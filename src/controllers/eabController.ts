import { Request, Response } from "express";
import { EABModel } from "../models/EAB";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

const EAB_MATERIALS_DIR = path.join(__dirname, "../../uploads/eab-materials");

// Crear directorio si no existe
if (!fs.existsSync(EAB_MATERIALS_DIR)) {
  fs.mkdirSync(EAB_MATERIALS_DIR, { recursive: true });
}

// ==================== EAB CRUD (Admin) ====================

// Obtener todos los EABs
export const getAllEABs = async (req: Request, res: Response) => {
  try {
    const eabs = await EABModel.find()
      .populate("createdBy", "name username")
      .populate("participants.userId", "name username email")
      .sort({ createdAt: -1 });

    res.status(200).json(eabs);
  } catch (error) {
    console.error("Error al obtener EABs:", error);
    res.status(500).json({ message: "Error al obtener las experiencias" });
  }
};

// Obtener EABs disponibles (público)
export const getAvailableEABs = async (req: Request, res: Response) => {
  try {
    const eabs = await EABModel.find({
      status: { $in: ["active"] },
      isOpen: true,
    })
      .select("-participants")
      .sort({ startDate: 1 });

    const eabsWithCount = eabs.map((eab) => ({
      ...eab.toObject(),
      participantCount: eab.participants?.length || 0,
    }));

    res.status(200).json(eabsWithCount);
  } catch (error) {
    console.error("Error al obtener EABs disponibles:", error);
    res.status(500).json({ message: "Error al obtener las experiencias disponibles" });
  }
};

// Obtener un EAB por ID (público - sin participantes)
export const getEABById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const eab = await EABModel.findById(id)
      .populate("createdBy", "name username")
      .populate("participants.userId", "name username email");

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    res.status(200).json(eab);
  } catch (error) {
    console.error("Error al obtener EAB:", error);
    res.status(500).json({ message: "Error al obtener la experiencia" });
  }
};

// Crear un EAB (Admin)
export const createEAB = async (req: Request, res: Response) => {
  try {
    const { title, description, icon, price, currency, startDate, endDate, maxParticipants, isOpen } = req.body;
    const userId = req.currentUser?._id;

    const newEAB = new EABModel({
      title,
      description,
      icon: icon || "🔥",
      price: price || 0,
      currency: currency || "USD",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      maxParticipants: maxParticipants || 50,
      isOpen: isOpen || false,
      createdBy: userId,
    });

    await newEAB.save();

    res.status(201).json({
      message: "Experiencia creada exitosamente",
      eab: newEAB,
    });
  } catch (error) {
    console.error("Error al crear EAB:", error);
    res.status(500).json({ message: "Error al crear la experiencia" });
  }
};

// Actualizar un EAB (Admin)
export const updateEAB = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const eab = await EABModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    res.status(200).json({
      message: "Experiencia actualizada exitosamente",
      eab,
    });
  } catch (error) {
    console.error("Error al actualizar EAB:", error);
    res.status(500).json({ message: "Error al actualizar la experiencia" });
  }
};

// Eliminar un EAB (Admin)
export const deleteEAB = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const eab = await EABModel.findByIdAndDelete(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    res.status(200).json({ message: "Experiencia eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar EAB:", error);
    res.status(500).json({ message: "Error al eliminar la experiencia" });
  }
};

// Activar un EAB (Admin)
export const activateEAB = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    const eab = await EABModel.findById(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    if (startDate) eab.startDate = new Date(startDate);
    if (endDate) eab.endDate = new Date(endDate);
    eab.status = "active";
    eab.isOpen = true;

    await eab.save();

    res.status(200).json({
      message: "Experiencia activada exitosamente",
      eab,
    });
  } catch (error) {
    console.error("Error al activar EAB:", error);
    res.status(500).json({ message: "Error al activar la experiencia" });
  }
};

// ==================== MÓDULOS ====================

// Agregar módulo a un EAB (Admin)
export const addModuleToEAB = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const eab = await EABModel.findById(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    const moduleNumber = eab.modules.length + 1;

    eab.modules.push({
      moduleNumber,
      title,
      description: description || "",
      videos: [],
      materials: [],
    });

    await eab.save();

    res.status(200).json({
      message: "Módulo agregado exitosamente",
      eab,
    });
  } catch (error) {
    console.error("Error al agregar módulo:", error);
    res.status(500).json({ message: "Error al agregar el módulo" });
  }
};

// Actualizar un módulo de un EAB (Admin)
export const updateModuleInEAB = async (req: Request, res: Response) => {
  try {
    const { id, moduleNumber } = req.params;
    const { title, description } = req.body;

    const eab = await EABModel.findById(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    const moduleIndex = eab.modules.findIndex(
      (m) => m.moduleNumber === parseInt(moduleNumber)
    );

    if (moduleIndex === -1) {
      res.status(404).json({ message: "Módulo no encontrado" });
      return;
    }

    if (title) eab.modules[moduleIndex].title = title;
    if (description !== undefined) eab.modules[moduleIndex].description = description;

    await eab.save();

    res.status(200).json({
      message: "Módulo actualizado exitosamente",
      eab,
    });
  } catch (error) {
    console.error("Error al actualizar módulo:", error);
    res.status(500).json({ message: "Error al actualizar el módulo" });
  }
};

// Eliminar un módulo de un EAB (Admin)
export const deleteModuleFromEAB = async (req: Request, res: Response) => {
  try {
    const { id, moduleNumber } = req.params;

    const eab = await EABModel.findById(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    eab.modules = eab.modules.filter(
      (m) => m.moduleNumber !== parseInt(moduleNumber)
    );

    // Renumerar módulos
    eab.modules.forEach((m, i) => {
      m.moduleNumber = i + 1;
    });

    await eab.save();

    res.status(200).json({
      message: "Módulo eliminado exitosamente",
      eab,
    });
  } catch (error) {
    console.error("Error al eliminar módulo:", error);
    res.status(500).json({ message: "Error al eliminar el módulo" });
  }
};

// ==================== VIDEOS ====================

// Agregar video a un módulo (Admin)
export const addVideoToModule = async (req: Request, res: Response) => {
  try {
    const { id, moduleNumber } = req.params;
    const { title, youtubeUrl, duration, description } = req.body;

    const eab = await EABModel.findById(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    const moduleIndex = eab.modules.findIndex(
      (m) => m.moduleNumber === parseInt(moduleNumber)
    );

    if (moduleIndex === -1) {
      res.status(404).json({ message: "Módulo no encontrado" });
      return;
    }

    const order = eab.modules[moduleIndex].videos.length + 1;

    eab.modules[moduleIndex].videos.push({
      title,
      youtubeUrl,
      duration: duration || "",
      description: description || "",
      order,
    });

    await eab.save();

    res.status(200).json({
      message: "Video agregado exitosamente",
      eab,
    });
  } catch (error) {
    console.error("Error al agregar video:", error);
    res.status(500).json({ message: "Error al agregar el video" });
  }
};

// Eliminar video de un módulo (Admin)
export const deleteVideoFromModule = async (req: Request, res: Response) => {
  try {
    const { id, moduleNumber, videoId } = req.params;

    const eab = await EABModel.findById(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    const moduleIndex = eab.modules.findIndex(
      (m) => m.moduleNumber === parseInt(moduleNumber)
    );

    if (moduleIndex === -1) {
      res.status(404).json({ message: "Módulo no encontrado" });
      return;
    }

    eab.modules[moduleIndex].videos = eab.modules[moduleIndex].videos.filter(
      (v: any) => v._id.toString() !== videoId
    );

    // Renumerar videos
    eab.modules[moduleIndex].videos.forEach((v, i) => {
      v.order = i + 1;
    });

    await eab.save();

    res.status(200).json({
      message: "Video eliminado exitosamente",
      eab,
    });
  } catch (error) {
    console.error("Error al eliminar video:", error);
    res.status(500).json({ message: "Error al eliminar el video" });
  }
};

// ==================== MATERIALES ====================

// Agregar material a un módulo (Admin)
export const addMaterialToModule = async (req: Request, res: Response) => {
  try {
    const { id, moduleNumber } = req.params;
    const { title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No se proporcionó un archivo" });
    }

    if (!title) {
      return res.status(400).json({ message: "El título es requerido" });
    }

    const eab = await EABModel.findById(id);
    if (!eab) {
      return res.status(404).json({ message: "Experiencia no encontrada" });
    }

    const moduleIndex = eab.modules.findIndex(
      (m) => m.moduleNumber === parseInt(moduleNumber)
    );
    if (moduleIndex === -1) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    const ext = path.extname(file.originalname);
    const safeName = `eab_${id}_m${moduleNumber}_${Date.now()}${ext}`;
    const filePath = path.join(EAB_MATERIALS_DIR, safeName);
    fs.writeFileSync(filePath, file.buffer);

    const material = {
      title,
      fileUrl: `/uploads/eab-materials/${safeName}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedAt: new Date(),
    };

    eab.modules[moduleIndex].materials.push(material as any);
    await eab.save();

    const savedModule = eab.modules[moduleIndex];
    const savedMaterial = savedModule.materials[savedModule.materials.length - 1];

    res.status(201).json(savedMaterial);
  } catch (error) {
    console.error("Error al agregar material:", error);
    res.status(500).json({ message: "Error al agregar material" });
  }
};

// Eliminar material de un módulo (Admin)
export const removeMaterialFromModule = async (req: Request, res: Response) => {
  try {
    const { id, moduleNumber, materialId } = req.params;

    const eab = await EABModel.findById(id);
    if (!eab) {
      return res.status(404).json({ message: "Experiencia no encontrada" });
    }

    const moduleIndex = eab.modules.findIndex(
      (m) => m.moduleNumber === parseInt(moduleNumber)
    );
    if (moduleIndex === -1) {
      return res.status(404).json({ message: "Módulo no encontrado" });
    }

    const materials = eab.modules[moduleIndex].materials;
    const materialIndex = materials.findIndex(
      (m: any) => m._id.toString() === materialId
    );
    if (materialIndex === -1) {
      return res.status(404).json({ message: "Material no encontrado" });
    }

    // Eliminar archivo del disco
    const material = materials[materialIndex];
    const filePath = path.join(__dirname, "../../", material.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    materials.splice(materialIndex, 1);
    await eab.save();

    res.status(200).json({ message: "Material eliminado exitosamente" });
  } catch (error) {
    console.error("Error al eliminar material:", error);
    res.status(500).json({ message: "Error al eliminar material" });
  }
};

// ==================== INSCRIPCIONES ====================

// Inscribirse a un EAB
export const enrollInEAB = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.currentUser?._id?.toString();

    if (!userId) {
      res.status(401).json({ message: "Usuario no autenticado" });
      return;
    }

    const eab = await EABModel.findById(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    if (!eab.isOpen) {
      res.status(400).json({ message: "Las inscripciones están cerradas" });
      return;
    }

    if (eab.maxParticipants && eab.participants.length >= eab.maxParticipants) {
      res.status(400).json({ message: "La experiencia ha alcanzado el máximo de participantes" });
      return;
    }

    const alreadyEnrolled = eab.participants.some(
      (p) => p.userId.toString() === userId
    );

    if (alreadyEnrolled) {
      res.status(400).json({ message: "Ya estás inscrito en esta experiencia" });
      return;
    }

    eab.participants.push({
      userId: new mongoose.Types.ObjectId(userId),
      enrolledAt: new Date(),
      progress: {
        currentModule: 1,
        completedVideos: [],
      },
    });

    await eab.save();

    res.status(200).json({
      message: "Inscripción exitosa",
      eab,
    });
  } catch (error) {
    console.error("Error al inscribirse:", error);
    res.status(500).json({ message: "Error al inscribirse" });
  }
};

// Obtener mis EABs inscriptos
export const getMyEABs = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?._id;

    const eabs = await EABModel.find({
      "participants.userId": userId,
      status: { $in: ["active", "completed"] },
    });

    const result = eabs.map((eab) => {
      const myParticipant = eab.participants.find(
        (p) => p.userId.toString() === userId
      );
      return {
        eab,
        myProgress: myParticipant?.progress,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener mis EABs:", error);
    res.status(500).json({ message: "Error al obtener tus experiencias" });
  }
};

// Actualizar progreso en un EAB
export const updateEABProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentModule, completedVideoId } = req.body;
    const userId = req.currentUser?._id;

    const eab = await EABModel.findById(id);

    if (!eab) {
      res.status(404).json({ message: "Experiencia no encontrada" });
      return;
    }

    const participantIndex = eab.participants.findIndex(
      (p) => p.userId.toString() === userId
    );

    if (participantIndex === -1) {
      res.status(404).json({ message: "No estás inscrito en esta experiencia" });
      return;
    }

    if (currentModule !== undefined) {
      eab.participants[participantIndex].progress.currentModule = currentModule;
    }
    if (completedVideoId) {
      const completedVideos = eab.participants[participantIndex].progress.completedVideos;
      if (!completedVideos.includes(completedVideoId)) {
        completedVideos.push(completedVideoId);
      }
    }

    await eab.save();

    res.status(200).json({
      message: "Progreso actualizado",
      progress: eab.participants[participantIndex].progress,
    });
  } catch (error) {
    console.error("Error al actualizar progreso:", error);
    res.status(500).json({ message: "Error al actualizar el progreso" });
  }
};
