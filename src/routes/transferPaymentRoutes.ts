import { Router, Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { verifyToken } from "../middlewares/auth";
import {
  createPayment,
  getMyPayments,
  getAllPayments,
  getPendingPayments,
  approvePayment,
  rejectPayment,
} from "../controllers/transferPaymentController";

const router = Router();

// Configuración de multer para comprobantes (almacenamiento en memoria)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen o PDF"));
    }
  },
});

// ==================== RUTAS USUARIO ====================

// Enviar comprobante de pago
router.post(
  "/",
  verifyToken,
  upload.single("receipt"),
  createPayment as any
);

// Obtener mis pagos (historial)
router.get("/my-payments", verifyToken, getMyPayments);

// ==================== RUTAS ADMIN ====================

// Obtener todos los pagos (con filtros opcionales: ?status=pending&productType=pib)
router.get("/", verifyToken, getAllPayments);

// Obtener pagos pendientes
router.get("/pending", verifyToken, getPendingPayments);

// Aprobar un pago
router.put("/:id/approve", verifyToken, approvePayment);

// Rechazar un pago
router.put("/:id/reject", verifyToken, rejectPayment);

export default router;
