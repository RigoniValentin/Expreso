import { Request, Response } from "express";
import { PaymentModel } from "../models/Payment";
import { PIBGroupModel } from "../models/PIBGroup";
import { EABModel } from "../models/EAB";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// Crear directorio de comprobantes si no existe
const RECEIPTS_DIR = path.join(__dirname, "../../uploads/receipts");
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

// ==================== USUARIO ====================

// Crear un pago (subir comprobante)
export const createPayment = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?._id;
    if (!userId) {
      res.status(401).json({ message: "Usuario no autenticado" });
      return;
    }

    const { productType, productId, productName, amount, paymentMethod, referenceNumber, paymentPlan, installmentNumber } = req.body;

    if (!productType || !productId || !productName || !amount || !paymentMethod || !referenceNumber) {
      res.status(400).json({ message: "Todos los campos son obligatorios" });
      return;
    }

    if (!["pib", "eab"].includes(productType)) {
      res.status(400).json({ message: "Tipo de producto inválido" });
      return;
    }

    if (!["transferencia", "pago_movil"].includes(paymentMethod)) {
      res.status(400).json({ message: "Método de pago inválido" });
      return;
    }

    // Verificar que el producto existe
    if (productType === "pib") {
      const group = await PIBGroupModel.findById(productId);
      if (!group) {
        res.status(404).json({ message: "Grupo PIB no encontrado" });
        return;
      }
    } else {
      const eab = await EABModel.findById(productId);
      if (!eab) {
        res.status(404).json({ message: "Experiencia EAB no encontrada" });
        return;
      }
    }

    // Verificar pagos existentes según el plan
    const plan = paymentPlan || "full";
    const instNumber = parseInt(installmentNumber) || 1;
    const totalInst = plan === "full" ? 1 : 4;

    if (plan === "full") {
      // For full payment, check if there's already an approved or pending payment
      const existingPayment = await PaymentModel.findOne({
        userId,
        productType,
        productId,
        paymentPlan: "full",
        status: { $in: ["pending", "approved"] },
      });

      if (existingPayment) {
        if (existingPayment.status === "approved") {
          res.status(400).json({ message: "Ya tienes acceso a este producto" });
          return;
        }
        res.status(400).json({ message: "Ya tienes un pago pendiente de aprobación para este producto" });
        return;
      }
    } else {
      // For monthly, check if this specific installment already has a pending/approved payment
      const existingInstallment = await PaymentModel.findOne({
        userId,
        productType,
        productId,
        installmentNumber: instNumber,
        status: { $in: ["pending", "approved"] },
      });

      if (existingInstallment) {
        if (existingInstallment.status === "approved") {
          res.status(400).json({ message: `La cuota ${instNumber} ya fue aprobada` });
          return;
        }
        res.status(400).json({ message: `Ya tienes un pago pendiente para la cuota ${instNumber}` });
        return;
      }
    }

    // Verificar archivo de comprobante
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ message: "Debes adjuntar el comprobante de pago" });
      return;
    }

    // Guardar el archivo
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${timestamp}-${random}${ext || ".jpg"}`;
    const filePath = path.join(RECEIPTS_DIR, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const payment = new PaymentModel({
      userId,
      productType,
      productId,
      productName,
      amount: Number(amount),
      currency: "VES",
      paymentMethod,
      paymentPlan: plan,
      installmentNumber: instNumber,
      totalInstallments: totalInst,
      referenceNumber: referenceNumber.trim(),
      receiptUrl: `/uploads/receipts/${fileName}`,
      status: "pending",
    });

    await payment.save();

    res.status(201).json({
      message: "Comprobante enviado correctamente. Pendiente de aprobación.",
      payment,
    });
  } catch (error) {
    console.error("Error al crear pago:", error);
    res.status(500).json({ message: "Error al procesar el pago" });
  }
};

// Obtener mis pagos (historial del usuario)
export const getMyPayments = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?._id;

    const payments = await PaymentModel.find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ message: "Error al obtener el historial de pagos" });
  }
};

// ==================== ADMIN ====================

// Obtener todos los pagos (admin)
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { status, productType } = req.query;

    const filter: any = {};
    if (status && typeof status === "string") {
      filter.status = status;
    }
    if (productType && typeof productType === "string") {
      filter.productType = productType;
    }

    const payments = await PaymentModel.find(filter)
      .populate("userId", "name username email avatar")
      .populate("reviewedBy", "name username")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ message: "Error al obtener los pagos" });
  }
};

// Obtener pagos pendientes (admin)
export const getPendingPayments = async (req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.find({ status: "pending" })
      .populate("userId", "name username email avatar")
      .sort({ createdAt: 1 }); // Los más antiguos primero

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error al obtener pagos pendientes:", error);
    res.status(500).json({ message: "Error al obtener pagos pendientes" });
  }
};

// Aprobar un pago (admin) — inscribe al usuario automáticamente
export const approvePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.currentUser?._id;
    const { adminNotes } = req.body;

    const payment = await PaymentModel.findById(id);
    if (!payment) {
      res.status(404).json({ message: "Pago no encontrado" });
      return;
    }

    if (payment.status !== "pending") {
      res.status(400).json({ message: "Este pago ya fue procesado" });
      return;
    }

    // Inscribir al usuario en el producto
    if (payment.productType === "pib") {
      const group = await PIBGroupModel.findById(payment.productId);
      if (!group) {
        res.status(404).json({ message: "Grupo PIB no encontrado" });
        return;
      }

      const participantIndex = group.participants.findIndex(
        (p) => p.userId.toString() === payment.userId.toString()
      );

      if (payment.paymentPlan === "full") {
        // Full payment — enroll with full access
        if (participantIndex === -1) {
          group.participants.push({
            userId: payment.userId,
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
        } else {
          group.participants[participantIndex].accessActive = true;
          group.participants[participantIndex].paymentPlan = "full";
          group.participants[participantIndex].paidInstallments = 1;
        }
      } else {
        // Monthly payment — handle installments
        if (participantIndex === -1) {
          // First installment — enroll
          const nextDue = new Date();
          nextDue.setMonth(nextDue.getMonth() + 1);
          group.participants.push({
            userId: payment.userId,
            enrolledAt: new Date(),
            paymentPlan: "monthly",
            paidInstallments: 1,
            nextPaymentDue: nextDue,
            accessActive: true,
            progress: {
              currentModule: 1,
              currentWeek: 1,
              completedVideos: [],
            },
          });
        } else {
          // Subsequent installment
          const participant = group.participants[participantIndex];
          participant.paidInstallments = payment.installmentNumber;
          participant.accessActive = true;
          if (payment.installmentNumber < 4) {
            const nextDue = new Date();
            nextDue.setMonth(nextDue.getMonth() + 1);
            participant.nextPaymentDue = nextDue;
          } else {
            // All installments paid
            participant.nextPaymentDue = undefined;
          }
        }
      }
      await group.save();
    } else if (payment.productType === "eab") {
      const eab = await EABModel.findById(payment.productId);
      if (!eab) {
        res.status(404).json({ message: "Experiencia EAB no encontrada" });
        return;
      }

      const alreadyEnrolled = eab.participants.some(
        (p) => p.userId.toString() === payment.userId.toString()
      );

      if (!alreadyEnrolled) {
        eab.participants.push({
          userId: payment.userId,
          enrolledAt: new Date(),
          progress: {
            currentModule: 1,
            completedVideos: [],
          },
        });
        await eab.save();
      }
    }

    // Actualizar el pago
    payment.status = "approved";
    payment.adminNotes = adminNotes || "";
    payment.reviewedBy = adminId as mongoose.Types.ObjectId;
    payment.reviewedAt = new Date();
    await payment.save();

    res.status(200).json({
      message: "Pago aprobado y usuario inscrito correctamente",
      payment,
    });
  } catch (error) {
    console.error("Error al aprobar pago:", error);
    res.status(500).json({ message: "Error al aprobar el pago" });
  }
};

// Rechazar un pago (admin)
export const rejectPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.currentUser?._id;
    const { adminNotes } = req.body;

    const payment = await PaymentModel.findById(id);
    if (!payment) {
      res.status(404).json({ message: "Pago no encontrado" });
      return;
    }

    if (payment.status !== "pending") {
      res.status(400).json({ message: "Este pago ya fue procesado" });
      return;
    }

    payment.status = "rejected";
    payment.adminNotes = adminNotes || "Pago rechazado";
    payment.reviewedBy = adminId as mongoose.Types.ObjectId;
    payment.reviewedAt = new Date();
    await payment.save();

    res.status(200).json({
      message: "Pago rechazado",
      payment,
    });
  } catch (error) {
    console.error("Error al rechazar pago:", error);
    res.status(500).json({ message: "Error al rechazar el pago" });
  }
};
