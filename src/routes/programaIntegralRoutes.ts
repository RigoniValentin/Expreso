import { Router } from "express";
import {
  getProgramaIntegral,
  updateProgramaIntegral,
  createProgramaIntegral,
  deleteProgramaIntegral,
} from "../controllers/programaIntegralController";
import { verifyToken } from "../middlewares/auth";

const router: any = Router();

// Ruta pública - Obtener información del programa
router.get("/", getProgramaIntegral);

// Rutas protegidas - Requieren autenticación (para admin en el futuro)
router.post("/", verifyToken, createProgramaIntegral);
router.put("/:id", verifyToken, updateProgramaIntegral);
router.delete("/:id", verifyToken, deleteProgramaIntegral);

export default router;
