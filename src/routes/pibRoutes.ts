import { Router } from "express";
import multer from "multer";
import {
  // Groups
  getAllPIBGroups,
  getAvailablePIBGroups,
  getPIBGroupById,
  createPIBGroup,
  updatePIBGroup,
  deletePIBGroup,
  startPIBGroup,
  addWeeklyVideo,
  // Enrollment
  enrollInPIBGroup,
  getMyPIBGroup,
  updateMyProgress,
  getMyPIBPaymentStatus,
  addMemberToGroup,
  removeMemberFromGroup,
  // Content
  getPIBContent,
  getPIBModule,
  updatePIBModule,
  addVideoToWeek,
  addMaterialToWeek,
  removeMaterialFromWeek,
  getPIBColors,
} from "../controllers/pibController";
import { verifyToken } from "../middlewares/auth";

const router: any = Router();

const materialUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ==================== RUTAS PÚBLICAS ====================

// Obtener colores disponibles
router.get("/colors", getPIBColors);

// Obtener grupos disponibles para inscripción
router.get("/groups/available", getAvailablePIBGroups);

// Obtener contenido de módulos (compartido)
router.get("/content", getPIBContent);

// Obtener un módulo específico
router.get("/content/:moduleNumber", getPIBModule);

// ==================== RUTAS PROTEGIDAS (Usuario autenticado) ====================

// Obtener mi grupo inscrito
router.get("/my-group", verifyToken, getMyPIBGroup);

// Obtener estado de pago PIB
router.get("/my-payment-status", verifyToken, getMyPIBPaymentStatus);

// Inscribirse a un grupo
router.post("/groups/:id/enroll", verifyToken, enrollInPIBGroup);

// Actualizar mi progreso
router.put("/groups/:groupId/progress", verifyToken, updateMyProgress);

// ==================== RUTAS ADMIN ====================

// Obtener todos los grupos (admin)
router.get("/groups", verifyToken, getAllPIBGroups);

// Obtener un grupo por ID (admin)
router.get("/groups/:id", verifyToken, getPIBGroupById);

// Crear un grupo (admin)
router.post("/groups", verifyToken, createPIBGroup);

// Actualizar un grupo (admin)
router.put("/groups/:id", verifyToken, updatePIBGroup);

// Eliminar un grupo (admin)
router.delete("/groups/:id", verifyToken, deletePIBGroup);

// Iniciar un grupo (establecer fecha de inicio)
router.post("/groups/:id/start", verifyToken, startPIBGroup);

// Agregar video grupal semanal a un grupo
router.post("/groups/:id/weekly-video", verifyToken, addWeeklyVideo);

// Agregar miembro a un grupo (admin)
router.post("/groups/:id/add-member", verifyToken, addMemberToGroup);

// Eliminar miembro de un grupo (admin)
router.delete("/groups/:id/members/:userId", verifyToken, removeMemberFromGroup);

// Actualizar un módulo de contenido (admin)
router.put("/content/:moduleNumber", verifyToken, updatePIBModule);

// Agregar video a una semana específica (admin)
router.post("/content/:moduleNumber/week/:weekNumber/video", verifyToken, addVideoToWeek);

// Agregar material a una semana específica (admin)
router.post("/content/:moduleNumber/week/:weekNumber/material", verifyToken, materialUpload.single("file"), addMaterialToWeek);

// Eliminar material de una semana específica (admin)
router.delete("/content/:moduleNumber/week/:weekNumber/material/:materialId", verifyToken, removeMaterialFromWeek);

export default router;
