import { Router, Request } from "express";
import multer, { FileFilterCallback } from "multer";
import { verifyToken } from "../middlewares/auth";
import { authorize } from "../middlewares/roles";
import {
  uploadBlogImage,
  uploadCoverImage,
  deleteImage,
} from "../controllers/uploadController";

const router = Router();

// Configuración de multer para almacenamiento en memoria (para procesar con sharp)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // Solo permitir imágenes
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF)"));
    }
  },
});

// Rutas de upload (requieren autenticación y rol admin)
router.post(
  "/image",
  verifyToken,
  authorize(["admin", "Admin"]),
  upload.single("image"),
  uploadBlogImage as any
);

router.post(
  "/cover",
  verifyToken,
  authorize(["admin", "Admin"]),
  upload.single("image"),
  uploadCoverImage as any
);

router.delete(
  "/image/:fileName",
  verifyToken,
  authorize(["admin", "Admin"]),
  deleteImage as any
);

export default router;
