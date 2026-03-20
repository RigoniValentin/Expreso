import { Request, Response } from "express";
import { BlogPostModel } from "../models/BlogPost";
import mongoose from "mongoose";

// Obtener todos los posts publicados (público)
export const getPublishedPosts = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
    } = req.query;

    const query: any = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const posts = await BlogPostModel.find(query)
      .populate("author", "name avatar")
      .select("-content")
      .sort({ publishedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await BlogPostModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Error al obtener posts:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los posts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Obtener un post por slug (público)
export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const post = await BlogPostModel.findOneAndUpdate(
      { slug, isPublished: true },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate("author", "name avatar");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Error al obtener post:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Obtener todos los posts (admin)
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await BlogPostModel.find()
      .populate("author", "name avatar")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await BlogPostModel.countDocuments();

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error) {
    console.error("Error al obtener posts:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los posts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Crear un post (admin)
export const createPost = async (req: Request, res: Response) => {
  console.log("=== CREATE POST CALLED ===");
  console.log("Request body:", req.body);
  console.log("Current user:", req.currentUser);
  
  try {
    const {
      title,
      excerpt,
      content,
      coverImage,
      images,
      videoUrl,
      category,
      tags,
      isPublished,
    } = req.body;

    const authorId = req.currentUser?._id;
    console.log("Author ID:", authorId);

    if (!authorId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const newPost = await BlogPostModel.create({
      title,
      excerpt,
      content,
      coverImage,
      images: images || [],
      videoUrl,
      category,
      tags: tags || [],
      author: authorId,
      isPublished: isPublished || false,
    });

    await newPost.populate("author", "name avatar");

    res.status(201).json({
      success: true,
      data: newPost,
      message: "Post creado exitosamente",
    });
  } catch (error) {
    console.error("Error al crear post:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Actualizar un post (admin)
export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const post = await BlogPostModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "name avatar");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
      message: "Post actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar post:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Eliminar un post (admin)
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await BlogPostModel.findByIdAndDelete(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Post eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar post:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el post",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Agregar reacción a un post (usuarios autenticados)
export const addReaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const userId = req.currentUser?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!["love", "inspire", "gratitude", "light"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de reacción inválido",
      });
    }

    const post = await BlogPostModel.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post no encontrado",
      });
    }

    // Verificar si ya reaccionó con el mismo tipo
    const existingReaction = post.reactions.find(
      (r) => r.userId.toString() === userId.toString() && r.type === type
    );

    if (existingReaction) {
      // Quitar la reacción si ya existe
      post.reactions = post.reactions.filter(
        (r) => !(r.userId.toString() === userId.toString() && r.type === type)
      );
    } else {
      // Agregar nueva reacción
      post.reactions.push({
        userId: userId as any,
        type,
        createdAt: new Date(),
      });
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: {
        reactions: post.reactions,
        reactionCounts: getReactionCounts(post.reactions),
      },
      message: existingReaction ? "Reacción eliminada" : "Reacción agregada",
    });
  } catch (error) {
    console.error("Error al agregar reacción:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la reacción",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Helper para contar reacciones
function getReactionCounts(reactions: any[]) {
  const uniqueUsers = new Set(reactions.map((r) => r.userId.toString())).size;
  return {
    love: reactions.filter((r) => r.type === "love").length,
    inspire: reactions.filter((r) => r.type === "inspire").length,
    gratitude: reactions.filter((r) => r.type === "gratitude").length,
    light: reactions.filter((r) => r.type === "light").length,
    total: reactions.length,
    uniqueUsers,
  };
}

// Obtener categorías con conteo
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await BlogPostModel.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las categorías",
    });
  }
};

// Obtener posts destacados (más reacciones o más recientes)
export const getFeaturedPosts = async (req: Request, res: Response) => {
  try {
    // Primero intentar obtener posts con más reacciones
    let posts = await BlogPostModel.aggregate([
      { $match: { isPublished: true } },
      { $addFields: { reactionCount: { $size: { $ifNull: ["$reactions", []] } } } },
      { $sort: { reactionCount: -1, publishedAt: -1 } },
      { $limit: 5 },
    ]);

    // Si no hay posts con reacciones, obtener los más recientes
    if (posts.length === 0) {
      posts = await BlogPostModel.find({ isPublished: true })
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean();
    }

    await BlogPostModel.populate(posts, { path: "author", select: "name avatar" });

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("Error al obtener posts destacados:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los posts destacados",
    });
  }
};

// Agregar comentario a un post (usuarios autenticados)
export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.currentUser?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "El contenido del comentario es requerido",
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "El comentario no puede exceder 2000 caracteres",
      });
    }

    const post = await BlogPostModel.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post no encontrado",
      });
    }

    post.comments.push({
      userId: userId as any,
      content: content.trim(),
      createdAt: new Date(),
    });

    await post.save();

    // Populate los datos del usuario en los comentarios
    await post.populate("comments.userId", "name avatar");

    res.status(201).json({
      success: true,
      data: post.comments,
      message: "Comentario agregado exitosamente",
    });
  } catch (error) {
    console.error("Error al agregar comentario:", error);
    res.status(500).json({
      success: false,
      message: "Error al agregar el comentario",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Eliminar comentario (propietario o admin)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.currentUser?._id;
    const userRoles = req.currentUser?.roles || [];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    const post = await BlogPostModel.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post no encontrado",
      });
    }

    const comment = post.comments.find(
      (c: any) => c._id.toString() === commentId
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comentario no encontrado",
      });
    }

    const isAdmin = userRoles.some((r) =>
      ["admin", "Admin"].includes(r?.name || "")
    );
    const isOwner = comment.userId.toString() === userId.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para eliminar este comentario",
      });
    }

    post.comments = post.comments.filter(
      (c: any) => c._id.toString() !== commentId
    );

    await post.save();

    await post.populate("comments.userId", "name avatar");

    res.status(200).json({
      success: true,
      data: post.comments,
      message: "Comentario eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el comentario",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Obtener comentarios de un post (público)
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await BlogPostModel.findById(id)
      .select("comments")
      .populate("comments.userId", "name avatar");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: post.comments,
    });
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los comentarios",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
