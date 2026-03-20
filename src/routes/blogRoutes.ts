import { Router } from "express";
import {
  getPublishedPosts,
  getPostBySlug,
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
  addReaction,
  getCategories,
  getFeaturedPosts,
  addComment,
  deleteComment,
  getComments,
} from "../controllers/blogController";
import { verifyToken } from "../middlewares/auth";
import { authorize } from "../middlewares/roles";

const router: any = Router();

// Rutas públicas
router.get("/", getPublishedPosts);
router.get("/featured", getFeaturedPosts);
router.get("/categories", getCategories);
router.get("/post/:slug", getPostBySlug);

// Rutas que requieren autenticación
router.post("/:id/reaction", verifyToken, addReaction);
router.post("/:id/comment", verifyToken, addComment);
router.delete("/:id/comment/:commentId", verifyToken, deleteComment);

// Rutas públicas de comentarios
router.get("/:id/comments", getComments);

// Rutas de admin (requieren autenticación + rol admin)
router.get("/admin/all", verifyToken, authorize(["admin", "Admin"]), getAllPosts);
router.post("/admin", verifyToken, authorize(["admin", "Admin"]), createPost);
router.put("/admin/:id", verifyToken, authorize(["admin", "Admin"]), updatePost);
router.delete("/admin/:id", verifyToken, authorize(["admin", "Admin"]), deletePost);

export default router;
