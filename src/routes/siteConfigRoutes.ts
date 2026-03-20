import { Router } from "express";
import { getSiteConfig, updatePillarVideos, updateProductVideos } from "../controllers/siteConfigController";
import { verifyToken } from "../middlewares/auth";

const router: any = Router();

// Público: obtener configuración
router.get("/", getSiteConfig);

// Admin: actualizar videos de pilares
router.put("/pillar-videos", verifyToken, updatePillarVideos);

// Admin: actualizar videos de productos
router.put("/product-videos", verifyToken, updateProductVideos);

export default router;
