import { Router } from "express";
import { verifyToken } from "../middlewares/auth";
import { authorize } from "../middlewares/roles";
import {
  getApprovedTestimonials,
  getFeaturedTestimonials,
  getTestimonialStats,
  createTestimonial,
  getMyTestimonials,
  getAllTestimonials,
  approveTestimonial,
  toggleFeatured,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController";

const router = Router();

// Rutas públicas
router.get("/", getApprovedTestimonials);
router.get("/featured", getFeaturedTestimonials);
router.get("/stats", getTestimonialStats);

// Rutas protegidas (usuarios autenticados)
router.post("/", verifyToken, createTestimonial);
router.get("/my", verifyToken, getMyTestimonials);

// Rutas de administrador
router.get("/admin/all", verifyToken, authorize(["admin", "Admin"]), getAllTestimonials);
router.patch("/admin/:id/approve", verifyToken, authorize(["admin", "Admin"]), approveTestimonial);
router.patch("/admin/:id/featured", verifyToken, authorize(["admin", "Admin"]), toggleFeatured);
router.put("/admin/:id", verifyToken, authorize(["admin", "Admin"]), updateTestimonial);
router.delete("/admin/:id", verifyToken, authorize(["admin", "Admin"]), deleteTestimonial);

export default router;
