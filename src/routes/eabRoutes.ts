import { Router } from "express";
import multer from "multer";
import {
  getAllEABs,
  getAvailableEABs,
  getEABById,
  createEAB,
  updateEAB,
  deleteEAB,
  activateEAB,
  addModuleToEAB,
  updateModuleInEAB,
  deleteModuleFromEAB,
  addVideoToModule,
  deleteVideoFromModule,
  addMaterialToModule,
  removeMaterialFromModule,
  enrollInEAB,
  getMyEABs,
  updateEABProgress,
} from "../controllers/eabController";
import { verifyToken } from "../middlewares/auth";

const router: any = Router();

const materialUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ==================== RUTAS PÚBLICAS ====================

// Obtener EABs disponibles
router.get("/available", getAvailableEABs);

// Obtener un EAB por ID (público)
router.get("/detail/:id", getEABById);

// ==================== RUTAS PROTEGIDAS (Usuario autenticado) ====================

// Obtener mis EABs inscriptos
router.get("/my-eabs", verifyToken, getMyEABs);

// Inscribirse a un EAB
router.post("/:id/enroll", verifyToken, enrollInEAB);

// Actualizar mi progreso
router.put("/:id/progress", verifyToken, updateEABProgress);

// ==================== RUTAS ADMIN ====================

// Obtener todos los EABs (admin)
router.get("/", verifyToken, getAllEABs);

// Crear un EAB (admin)
router.post("/", verifyToken, createEAB);

// Actualizar un EAB (admin)
router.put("/:id", verifyToken, updateEAB);

// Eliminar un EAB (admin)
router.delete("/:id", verifyToken, deleteEAB);

// Activar un EAB (admin)
router.post("/:id/activate", verifyToken, activateEAB);

// Agregar módulo a un EAB (admin)
router.post("/:id/modules", verifyToken, addModuleToEAB);

// Actualizar módulo (admin)
router.put("/:id/modules/:moduleNumber", verifyToken, updateModuleInEAB);

// Eliminar módulo (admin)
router.delete("/:id/modules/:moduleNumber", verifyToken, deleteModuleFromEAB);

// Agregar video a un módulo (admin)
router.post("/:id/modules/:moduleNumber/videos", verifyToken, addVideoToModule);

// Eliminar video de un módulo (admin)
router.delete("/:id/modules/:moduleNumber/videos/:videoId", verifyToken, deleteVideoFromModule);

// Agregar material a un módulo (admin)
router.post("/:id/modules/:moduleNumber/materials", verifyToken, materialUpload.single("file"), addMaterialToModule);

// Eliminar material de un módulo (admin)
router.delete("/:id/modules/:moduleNumber/materials/:materialId", verifyToken, removeMaterialFromModule);

export default router;
