import { Request, Response } from "express";
import { PIBGroupModel, PIB_COLORS } from "../models/PIBGroup";
import { PIBContentModel, DEFAULT_MODULES } from "../models/PIBContent";
import { PaymentModel } from "../models/Payment";
import { UserModel } from "../models/Users";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

const MATERIALS_DIR = path.join(__dirname, "../../uploads/pib-materials");
if (!fs.existsSync(MATERIALS_DIR)) {
  fs.mkdirSync(MATERIALS_DIR, { recursive: true });
}

const getUnlockedWeek = (startDate?: Date, status?: string): number => {
  if (status === "completed") return 16;
  if (!startDate || status === "pending") return 1;

  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffInDays / 7) + 1;
  return Math.min(16, Math.max(1, week));
};

const weekToModule = (weekNumber: number): number => {
  if (weekNumber <= 4) return 1;
  if (weekNumber <= 8) return 2;
  if (weekNumber <= 12) return 3;
  return 4;
};

const buildPIBVideoIndex = (modules: any[]) => {
  const videoMap = new Map<string, { moduleNumber: number; weekNumber: number }>();
  let totalVideos = 0;

  for (const module of modules) {
    for (const week of module.weeklyContent || []) {
      for (const video of week.videos || []) {
        if (!video?._id) continue;
        const videoId = video._id.toString();
        videoMap.set(videoId, {
          moduleNumber: module.moduleNumber,
          weekNumber: week.weekNumber,
        });
        totalVideos += 1;
      }
    }
  }

  return { videoMap, totalVideos };
};

const calculatePIBProgress = (
  completedVideoIds: string[],
  modules: any[],
  unlockedWeek: number
) => {
  const safeUnlockedWeek = Math.max(1, Math.min(16, unlockedWeek));
  const { videoMap } = buildPIBVideoIndex(modules);

  const sanitizedCompletedVideos = [...new Set(completedVideoIds)].filter((id) => videoMap.has(id));
  const completedSet = new Set(sanitizedCompletedVideos);

  const orderedWeeks: Array<{ weekNumber: number; moduleNumber: number; videoIds: string[] }> = [];
  for (const module of modules) {
    for (const week of module.weeklyContent || []) {
      orderedWeeks.push({
        weekNumber: week.weekNumber,
        moduleNumber: module.moduleNumber,
        videoIds: (week.videos || [])
          .filter((v: any) => v?._id)
          .map((v: any) => v._id.toString()),
      });
    }
  }

  orderedWeeks.sort((a, b) => a.weekNumber - b.weekNumber);
  const unlockedWeeks = orderedWeeks.filter((w) => w.weekNumber <= safeUnlockedWeek);

  let currentWeek = unlockedWeeks.length ? unlockedWeeks[0].weekNumber : 1;
  for (const week of unlockedWeeks) {
    const allWeekCompleted = week.videoIds.every((videoId) => completedSet.has(videoId));
    if (!allWeekCompleted) {
      currentWeek = week.weekNumber;
      break;
    }
    currentWeek = week.weekNumber;
  }

  const currentModule = weekToModule(currentWeek);

  const availableVideoIds = unlockedWeeks.flatMap((week) => week.videoIds);
  const availableVideoSet = new Set(availableVideoIds);
  const completedAvailableVideos = sanitizedCompletedVideos.filter((id) => availableVideoSet.has(id)).length;
  const completionPercentage = availableVideoIds.length
    ? Math.round((completedAvailableVideos / availableVideoIds.length) * 100)
    : 0;

  return {
    currentWeek,
    currentModule,
    sanitizedCompletedVideos,
    completionPercentage,
    completedAvailableVideos,
    totalAvailableVideos: availableVideoIds.length,
  };
};

// ==================== PIB GROUPS ====================

// Obtener todos los grupos PIB
export const getAllPIBGroups = async (req: Request, res: Response) => {
  try {
    const groups = await PIBGroupModel.find()
      .populate("createdBy", "name username")
      .populate("participants.userId", "name username email")
      .sort({ createdAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error al obtener grupos PIB:", error);
    res.status(500).json({ message: "Error al obtener los grupos" });
  }
};

// Obtener grupos disponibles para inscripción (públicos)
export const getAvailablePIBGroups = async (req: Request, res: Response) => {
  try {
    const groups = await PIBGroupModel.find({
      isOpen: true,
      status: { $in: ["pending", "active"] },
    })
      .select("-participants")
      .sort({ startDate: 1 });

    const now = new Date();

    // Agregar conteo de participantes y flag de inscripción vencida
    const groupsWithCount = groups.map((group) => {
      const enrollmentExpired = group.startDate
        ? now.getTime() - new Date(group.startDate).getTime() > 30 * 24 * 60 * 60 * 1000
        : false;
      return {
        ...group.toObject(),
        participantCount: group.participants?.length || 0,
        enrollmentExpired,
      };
    });

    res.status(200).json(groupsWithCount);
  } catch (error) {
    console.error("Error al obtener grupos disponibles:", error);
    res.status(500).json({ message: "Error al obtener los grupos disponibles" });
  }
};

// Obtener un grupo PIB por ID
export const getPIBGroupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const group = await PIBGroupModel.findById(id)
      .populate("createdBy", "name username")
      .populate("participants.userId", "name username email avatar");

    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error al obtener grupo PIB:", error);
    res.status(500).json({ message: "Error al obtener el grupo" });
  }
};

// Crear un nuevo grupo PIB (Admin)
export const createPIBGroup = async (req: Request, res: Response) => {
  try {
    const { name, color, description, startDate, maxParticipants, fullPrice, monthlyPrice } = req.body;
    const userId = req.currentUser?._id;

    // Validar color
    if (!PIB_COLORS[color]) {
      return res.status(400).json({ 
        message: "Color inválido", 
        validColors: Object.keys(PIB_COLORS) 
      });
    }

    const newGroup = new PIBGroupModel({
      name,
      color,
      colorHex: PIB_COLORS[color],
      description,
      startDate: startDate ? new Date(startDate) : undefined,
      maxParticipants: maxParticipants || 30,
      fullPrice: fullPrice || 0,
      monthlyPrice: monthlyPrice || 0,
      createdBy: userId,
      status: startDate ? "pending" : "pending",
    });

    await newGroup.save();

    res.status(201).json({
      message: "Grupo PIB creado exitosamente",
      group: newGroup,
    });
  } catch (error) {
    console.error("Error al crear grupo PIB:", error);
    res.status(500).json({ message: "Error al crear el grupo" });
  }
};

// Actualizar un grupo PIB (Admin)
export const updatePIBGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Si se actualiza el color, actualizar también el colorHex
    if (updates.color && PIB_COLORS[updates.color]) {
      updates.colorHex = PIB_COLORS[updates.color];
    }

    const group = await PIBGroupModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    res.status(200).json({
      message: "Grupo actualizado exitosamente",
      group,
    });
  } catch (error) {
    console.error("Error al actualizar grupo PIB:", error);
    res.status(500).json({ message: "Error al actualizar el grupo" });
  }
};

// Eliminar un grupo PIB (Admin)
export const deletePIBGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const group = await PIBGroupModel.findByIdAndDelete(id);

    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    res.status(200).json({ message: "Grupo eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar grupo PIB:", error);
    res.status(500).json({ message: "Error al eliminar el grupo" });
  }
};

// Iniciar un grupo PIB (establecer fecha de inicio)
export const startPIBGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate } = req.body;

    const group = await PIBGroupModel.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    group.startDate = new Date(startDate);
    group.status = "active";

    await group.save();

    res.status(200).json({
      message: "Grupo iniciado exitosamente",
      group,
    });
  } catch (error) {
    console.error("Error al iniciar grupo PIB:", error);
    res.status(500).json({ message: "Error al iniciar el grupo" });
  }
};

// Agregar video grupal semanal (Admin)
export const addWeeklyVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { week, moduleNumber, title, youtubeUrl, description, isAvailable } = req.body;

    const group = await PIBGroupModel.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    // Verificar si ya existe un video para esa semana
    const existingIndex = group.weeklyGroupVideos.findIndex((v) => v.week === week);

    if (existingIndex >= 0) {
      // Actualizar video existente
      group.weeklyGroupVideos[existingIndex] = {
        week,
        moduleNumber,
        title,
        youtubeUrl,
        description,
        isAvailable: isAvailable ?? true,
      };
    } else {
      // Agregar nuevo video
      group.weeklyGroupVideos.push({
        week,
        moduleNumber,
        title,
        youtubeUrl,
        description,
        isAvailable: isAvailable ?? true,
      });
    }

    await group.save();

    res.status(200).json({
      message: "Video semanal agregado exitosamente",
      group,
    });
  } catch (error) {
    console.error("Error al agregar video semanal:", error);
    res.status(500).json({ message: "Error al agregar el video" });
  }
};

// ==================== INSCRIPCIONES ====================

// Inscribirse a un grupo PIB
export const enrollInPIBGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.currentUser?._id?.toString();

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const group = await PIBGroupModel.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    if (!group.isOpen) {
      return res.status(400).json({ message: "Las inscripciones están cerradas para este grupo" });
    }

    // Verificar si pasó más de 1 mes desde el inicio del programa
    if (group.startDate) {
      const now = new Date();
      const msInMonth = 30 * 24 * 60 * 60 * 1000;
      if (now.getTime() - new Date(group.startDate).getTime() > msInMonth) {
        return res.status(400).json({
          message: "El período de inscripción ha finalizado. Contacta por WhatsApp para más información.",
          enrollmentExpired: true,
        });
      }
    }

    if (group.maxParticipants && group.participants.length >= group.maxParticipants) {
      return res.status(400).json({ message: "El grupo ha alcanzado el máximo de participantes" });
    }

    // Verificar si ya está inscrito
    const alreadyEnrolled = group.participants.some(
      (p) => p.userId.toString() === userId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Ya estás inscrito en este grupo" });
    }

    group.participants.push({
      userId: new mongoose.Types.ObjectId(userId),
      enrolledAt: new Date(),
      paymentPlan: "full",
      paidInstallments: 1,
      accessActive: true,
      progress: {
        currentModule: 1,
        currentWeek: 1,
        completedVideos: [],
      },
    });

    await group.save();

    res.status(200).json({
      message: "Inscripción exitosa",
      group,
    });
  } catch (error) {
    console.error("Error al inscribirse:", error);
    res.status(500).json({ message: "Error al inscribirse al grupo" });
  }
};

// Obtener mi grupo inscrito
export const getMyPIBGroup = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?._id;
    const userIdStr = userId?.toString();

    if (!userIdStr) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const group = await PIBGroupModel.findOne({
      "participants.userId": userId,
      status: { $in: ["pending", "active"] },
    })
      .populate("participants.userId", "name username email avatar");

    if (!group) {
      return res.status(404).json({ message: "No estás inscrito en ningún grupo activo" });
    }

    // Obtener el progreso del usuario
    const myParticipant = group.participants.find(
      (p) => p.userId._id.toString() === userIdStr
    );

    // Check if monthly user needs to pay — deactivate access if overdue
    if (myParticipant && myParticipant.paymentPlan === "monthly" && myParticipant.nextPaymentDue) {
      const now = new Date();
      if (now > myParticipant.nextPaymentDue && myParticipant.paidInstallments < 4) {
        // Check if there's a pending payment for the next installment
        const pendingPayment = await PaymentModel.findOne({
          userId,
          productId: group._id,
          installmentNumber: myParticipant.paidInstallments + 1,
          status: "pending",
        });
        if (!pendingPayment && myParticipant.accessActive) {
          myParticipant.accessActive = false;
          await group.save();
        }
      }
    }

    let progressSummary: any = null;
    if (myParticipant) {
      const modules = await PIBContentModel.find({ isActive: true })
        .select("moduleNumber weeklyContent.weekNumber weeklyContent.videos._id")
        .sort({ moduleNumber: 1 });

      const unlockedWeek = myParticipant.accessActive
        ? getUnlockedWeek(group.startDate, group.status)
        : 0;

      const calc = calculatePIBProgress(
        myParticipant.progress.completedVideos || [],
        modules,
        Math.max(1, unlockedWeek)
      );

      const previous = JSON.stringify(myParticipant.progress);
      myParticipant.progress.completedVideos = calc.sanitizedCompletedVideos;

      if (myParticipant.accessActive) {
        myParticipant.progress.currentWeek = calc.currentWeek;
        myParticipant.progress.currentModule = calc.currentModule;
      }

      if (previous !== JSON.stringify(myParticipant.progress)) {
        await group.save();
      }

      progressSummary = {
        completionPercentage: calc.completionPercentage,
        completedVideos: calc.completedAvailableVideos,
        totalVideos: calc.totalAvailableVideos,
        unlockedWeek,
      };
    }

    res.status(200).json({
      group,
      myProgress: myParticipant?.progress,
      progressSummary,
      paymentInfo: myParticipant ? {
        paymentPlan: myParticipant.paymentPlan,
        paidInstallments: myParticipant.paidInstallments,
        nextPaymentDue: myParticipant.nextPaymentDue,
        accessActive: myParticipant.accessActive,
      } : null,
    });
  } catch (error) {
    console.error("Error al obtener mi grupo:", error);
    res.status(500).json({ message: "Error al obtener tu grupo" });
  }
};

// Actualizar progreso del usuario
export const updateMyProgress = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { currentModule, currentWeek, completedVideoId } = req.body;
    const userId = req.currentUser?._id;
    const userIdStr = userId?.toString();

    if (!userIdStr) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const group = await PIBGroupModel.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    const participantIndex = group.participants.findIndex(
      (p) => p.userId.toString() === userIdStr
    );

    if (participantIndex === -1) {
      return res.status(404).json({ message: "No estás inscrito en este grupo" });
    }

    const participant = group.participants[participantIndex];

    if (!participant.accessActive) {
      return res.status(403).json({
        message: "Tu acceso está temporalmente suspendido. Regulariza tu pago para continuar.",
      });
    }

    const unlockedWeek = getUnlockedWeek(group.startDate, group.status);
    const modules = await PIBContentModel.find({ isActive: true })
      .select("moduleNumber weeklyContent.weekNumber weeklyContent.videos._id")
      .sort({ moduleNumber: 1 });

    const { videoMap } = buildPIBVideoIndex(modules);

    const parsedCurrentWeek =
      currentWeek !== undefined && currentWeek !== null ? Number(currentWeek) : undefined;
    const parsedCurrentModule =
      currentModule !== undefined && currentModule !== null ? Number(currentModule) : undefined;

    if (
      parsedCurrentWeek !== undefined &&
      (!Number.isInteger(parsedCurrentWeek) || parsedCurrentWeek < 1 || parsedCurrentWeek > unlockedWeek)
    ) {
      return res.status(400).json({
        message: `Semana inválida. Puedes avanzar hasta la semana ${unlockedWeek}.`,
      });
    }

    if (
      parsedCurrentModule !== undefined &&
      (!Number.isInteger(parsedCurrentModule) || parsedCurrentModule < 1 || parsedCurrentModule > 4)
    ) {
      return res.status(400).json({ message: "Módulo inválido" });
    }

    if (completedVideoId) {
      const videoMeta = videoMap.get(completedVideoId);
      if (!videoMeta) {
        return res.status(400).json({ message: "Video inválido para el programa PIB" });
      }

      if (videoMeta.weekNumber > unlockedWeek) {
        return res.status(403).json({
          message: `Ese video aún no está desbloqueado. Semana disponible actual: ${unlockedWeek}`,
        });
      }

      if (!participant.progress.completedVideos.includes(completedVideoId)) {
        participant.progress.completedVideos.push(completedVideoId);
      }
    }

    const calc = calculatePIBProgress(participant.progress.completedVideos || [], modules, unlockedWeek);
    participant.progress.completedVideos = calc.sanitizedCompletedVideos;
    participant.progress.currentWeek =
      parsedCurrentWeek !== undefined ? parsedCurrentWeek : calc.currentWeek;
    participant.progress.currentModule =
      parsedCurrentModule !== undefined
        ? parsedCurrentModule
        : weekToModule(participant.progress.currentWeek);

    await group.save();

    res.status(200).json({
      message: "Progreso actualizado",
      progress: participant.progress,
      progressSummary: {
        completionPercentage: calc.completionPercentage,
        completedVideos: calc.completedAvailableVideos,
        totalVideos: calc.totalAvailableVideos,
        unlockedWeek,
      },
    });
  } catch (error) {
    console.error("Error al actualizar progreso:", error);
    res.status(500).json({ message: "Error al actualizar el progreso" });
  }
};

// ==================== PIB CONTENT (Módulos compartidos) ====================

// Obtener todo el contenido de módulos
export const getPIBContent = async (req: Request, res: Response) => {
  try {
    let modules = await PIBContentModel.find({ isActive: true }).sort({ moduleNumber: 1 });

    // Si no hay módulos, crear los por defecto
    if (modules.length === 0) {
      await PIBContentModel.insertMany(DEFAULT_MODULES);
      modules = await PIBContentModel.find({ isActive: true }).sort({ moduleNumber: 1 });
    }

    res.status(200).json(modules);
  } catch (error) {
    console.error("Error al obtener contenido PIB:", error);
    res.status(500).json({ message: "Error al obtener el contenido" });
  }
};

// Obtener un módulo específico
export const getPIBModule = async (req: Request, res: Response) => {
  try {
    const { moduleNumber } = req.params;

    const module = await PIBContentModel.findOne({ 
      moduleNumber: parseInt(moduleNumber),
      isActive: true 
    });

    if (!module) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    res.status(200).json(module);
  } catch (error) {
    console.error("Error al obtener módulo:", error);
    res.status(500).json({ message: "Error al obtener el módulo" });
  }
};

// Actualizar contenido de un módulo (Admin)
export const updatePIBModule = async (req: Request, res: Response) => {
  try {
    const { moduleNumber } = req.params;
    const updates = req.body;

    const module = await PIBContentModel.findOneAndUpdate(
      { moduleNumber: parseInt(moduleNumber) },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!module) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    res.status(200).json({
      message: "Módulo actualizado exitosamente",
      module,
    });
  } catch (error) {
    console.error("Error al actualizar módulo:", error);
    res.status(500).json({ message: "Error al actualizar el módulo" });
  }
};

// Agregar video a una semana específica (Admin)
export const addVideoToWeek = async (req: Request, res: Response) => {
  try {
    const { moduleNumber, weekNumber } = req.params;
    const { title, youtubeUrl, duration, description, order } = req.body;

    const module = await PIBContentModel.findOne({ moduleNumber: parseInt(moduleNumber) });

    if (!module) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    const weekIndex = module.weeklyContent.findIndex(
      (w) => w.weekNumber === parseInt(weekNumber)
    );

    if (weekIndex === -1) {
      return res.status(404).json({ message: "Semana no encontrada" });
    }

    module.weeklyContent[weekIndex].videos.push({
      title,
      youtubeUrl,
      duration: duration || "",
      description: description || "",
      order: order || module.weeklyContent[weekIndex].videos.length + 1,
    });

    await module.save();

    res.status(200).json({
      message: "Video agregado exitosamente",
      module,
    });
  } catch (error) {
    console.error("Error al agregar video:", error);
    res.status(500).json({ message: "Error al agregar el video" });
  }
};

// Obtener estado de pago del usuario para PIB
export const getMyPIBPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?._id;
    const userIdStr = userId?.toString();

    if (!userIdStr) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const group = await PIBGroupModel.findOne({
      "participants.userId": userId,
      status: { $in: ["pending", "active"] },
    });

    if (!group) {
      return res.status(404).json({ message: "No estás inscrito en ningún grupo" });
    }

    const participant = group.participants.find(
      (p) => p.userId.toString() === userIdStr
    );

    if (!participant) {
      return res.status(404).json({ message: "Participante no encontrado" });
    }

    // Get payment history for this product
    const payments = await PaymentModel.find({
      userId,
      productId: group._id,
      productType: "pib",
    }).sort({ installmentNumber: 1 });

    res.status(200).json({
      groupId: group._id,
      groupName: group.name,
      paymentPlan: participant.paymentPlan,
      paidInstallments: participant.paidInstallments,
      totalInstallments: participant.paymentPlan === "full" ? 1 : 4,
      nextPaymentDue: participant.nextPaymentDue,
      accessActive: participant.accessActive,
      fullPrice: group.fullPrice,
      monthlyPrice: group.monthlyPrice,
      payments: payments.map((p) => ({
        _id: p._id,
        amount: p.amount,
        status: p.status,
        installmentNumber: p.installmentNumber,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error al obtener estado de pago:", error);
    res.status(500).json({ message: "Error al obtener estado de pago" });
  }
};

// Agregar miembro a un grupo (Admin)
export const addMemberToGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, paymentPlan = "full" } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El email del usuario es requerido" });
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No se encontró un usuario con ese email" });
    }

    const group = await PIBGroupModel.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    // Verificar si ya está inscrito
    const alreadyEnrolled = group.participants.some(
      (p) => p.userId.toString() === String(user._id)
    );
    if (alreadyEnrolled) {
      return res.status(400).json({ message: "Este usuario ya es miembro del grupo" });
    }

    if (group.maxParticipants && group.participants.length >= group.maxParticipants) {
      return res.status(400).json({ message: "El grupo ha alcanzado el máximo de participantes" });
    }

    const participant: any = {
      userId: user._id,
      enrolledAt: new Date(),
      paymentPlan,
      paidInstallments: paymentPlan === "full" ? 1 : 0,
      accessActive: true,
      progress: {
        currentModule: 1,
        currentWeek: 1,
        completedVideos: [],
      },
    };

    if (paymentPlan === "monthly") {
      const nextDue = new Date();
      nextDue.setMonth(nextDue.getMonth() + 1);
      participant.nextPaymentDue = nextDue;
    }

    group.participants.push(participant);
    await group.save();

    // Populate para devolver info del usuario
    const updated = await PIBGroupModel.findById(id)
      .populate("participants.userId", "name username email avatar");

    res.status(200).json({
      message: `Usuario ${user.name} agregado exitosamente al grupo`,
      group: updated,
    });
  } catch (error) {
    console.error("Error al agregar miembro:", error);
    res.status(500).json({ message: "Error al agregar miembro al grupo" });
  }
};

// Eliminar miembro de un grupo (Admin)
export const removeMemberFromGroup = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;

    const group = await PIBGroupModel.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Grupo no encontrado" });
    }

    const participantIndex = group.participants.findIndex(
      (p) => p.userId.toString() === userId
    );
    if (participantIndex === -1) {
      return res.status(404).json({ message: "El usuario no es miembro de este grupo" });
    }

    group.participants.splice(participantIndex, 1);
    await group.save();

    res.status(200).json({ message: "Miembro eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar miembro:", error);
    res.status(500).json({ message: "Error al eliminar miembro del grupo" });
  }
};

// Agregar material a una semana
export const addMaterialToWeek = async (req: Request, res: Response) => {
  try {
    const { moduleNumber, weekNumber } = req.params;
    const { title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No se proporcionó un archivo" });
    }

    if (!title) {
      return res.status(400).json({ message: "El título es requerido" });
    }

    const module = await PIBContentModel.findOne({ moduleNumber: parseInt(moduleNumber) });
    if (!module) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    const weekIndex = module.weeklyContent.findIndex(
      (w) => w.weekNumber === parseInt(weekNumber)
    );
    if (weekIndex === -1) {
      return res.status(404).json({ message: "Semana no encontrada" });
    }

    const ext = path.extname(file.originalname);
    const safeName = `m${moduleNumber}_w${weekNumber}_${Date.now()}${ext}`;
    const filePath = path.join(MATERIALS_DIR, safeName);
    fs.writeFileSync(filePath, file.buffer);

    const material = {
      title,
      fileUrl: `/uploads/pib-materials/${safeName}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
    };

    module.weeklyContent[weekIndex].materials.push(material as any);
    await module.save();

    const savedWeek = module.weeklyContent[weekIndex];
    const savedMaterial = savedWeek.materials[savedWeek.materials.length - 1];

    res.status(201).json(savedMaterial);
  } catch (error) {
    console.error("Error al agregar material:", error);
    res.status(500).json({ message: "Error al agregar material" });
  }
};

// Eliminar material de una semana
export const removeMaterialFromWeek = async (req: Request, res: Response) => {
  try {
    const { moduleNumber, weekNumber, materialId } = req.params;

    const module = await PIBContentModel.findOne({ moduleNumber: parseInt(moduleNumber) });
    if (!module) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    const weekIndex = module.weeklyContent.findIndex(
      (w) => w.weekNumber === parseInt(weekNumber)
    );
    if (weekIndex === -1) {
      return res.status(404).json({ message: "Semana no encontrada" });
    }

    const materials = module.weeklyContent[weekIndex].materials;
    const materialIndex = materials.findIndex(
      (m: any) => m._id.toString() === materialId
    );
    if (materialIndex === -1) {
      return res.status(404).json({ message: "Material no encontrado" });
    }

    const material = materials[materialIndex];
    const filePath = path.join(__dirname, "../../", material.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    materials.splice(materialIndex, 1);
    await module.save();

    res.status(200).json({ message: "Material eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ message: "Error al eliminar material" });
  }
};

// Obtener colores disponibles
export const getPIBColors = async (req: Request, res: Response) => {
  try {
    res.status(200).json(PIB_COLORS);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener colores" });
  }
};
