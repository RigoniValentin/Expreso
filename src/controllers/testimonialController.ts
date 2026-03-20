import { Request, Response } from "express";
import { TestimonialRepository } from "../repositories/testimonialRepository";
import { UserModel } from "../models/Users";
import { getSingleParam } from "@utils/requestParams";

const testimonialRepo = new TestimonialRepository();

// Obtener testimonios aprobados (público)
export const getApprovedTestimonials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { area, limit } = req.query;

    let testimonials;
    if (area && area !== "all") {
      testimonials = await testimonialRepo.findByArea(area as string);
    } else {
      testimonials = await testimonialRepo.findApproved();
    }

    // Aplicar límite si se especifica
    if (limit) {
      testimonials = testimonials.slice(0, parseInt(limit as string));
    }

    res.status(200).json({
      success: true,
      data: testimonials,
      count: testimonials.length,
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los testimonios",
    });
  }
};

// Obtener testimonios destacados (público)
export const getFeaturedTestimonials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { limit } = req.query;
    let testimonials = await testimonialRepo.findFeatured();

    if (limit) {
      testimonials = testimonials.slice(0, parseInt(limit as string));
    }

    res.status(200).json({
      success: true,
      data: testimonials,
      count: testimonials.length,
    });
  } catch (error) {
    console.error("Error fetching featured testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener testimonios destacados",
    });
  }
};

// Obtener estadísticas de testimonios (público)
export const getTestimonialStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const avgRating = await testimonialRepo.getAverageRating();
    const testimonials = await testimonialRepo.findApproved();

    const byArea = testimonials.reduce((acc: Record<string, number>, t) => {
      const area = t.area || "general";
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalCount: testimonials.length,
        averageRating: Math.round(avgRating * 10) / 10,
        byArea,
      },
    });
  } catch (error) {
    console.error("Error fetching testimonial stats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
    });
  }
};

// Crear testimonio (requiere autenticación)
export const createTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.currentUser?._id || req.currentUser?.id;
    const { content, rating, area } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Debes iniciar sesión para dejar un testimonio",
      });
      return;
    }

    // Obtener datos del usuario desde la base de datos
    const user = await UserModel.findById(userId).select("name avatar locality");
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
      return;
    }

    if (!content || !rating) {
      res.status(400).json({
        success: false,
        message: "El contenido y la valoración son requeridos",
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: "La valoración debe estar entre 1 y 5",
      });
      return;
    }

    const testimonialData = {
      userId,
      authorName: user.name,
      authorRole: user.locality || undefined, // Usamos la localidad como "rol" o descripción
      avatarUrl: user.avatar || undefined,
      content,
      rating,
      area: area || "general",
      isApproved: false, // Los testimonios requieren aprobación
      isFeatured: false,
      publishDate: new Date(),
    };

    const testimonial = await testimonialRepo.create(testimonialData);

    res.status(201).json({
      success: true,
      data: testimonial,
      message: "Testimonio enviado. Será visible una vez aprobado por un administrador.",
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el testimonio",
    });
  }
};

// Obtener testimonios del usuario actual
export const getMyTestimonials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const testimonials = await testimonialRepo.findByUserId(userId);

    res.status(200).json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("Error fetching user testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tus testimonios",
    });
  }
};

// ============ ADMIN FUNCTIONS ============

// Obtener todos los testimonios (admin)
export const getAllTestimonials = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { approved, featured } = req.query;
    
    let filters: any = {};
    if (approved !== undefined) {
      filters.isApproved = approved === "true";
    }
    if (featured !== undefined) {
      filters.isFeatured = featured === "true";
    }

    const testimonials = await testimonialRepo.findAll(filters);

    res.status(200).json({
      success: true,
      data: testimonials,
      count: testimonials.length,
    });
  } catch (error) {
    console.error("Error fetching all testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener testimonios",
    });
  }
};

// Aprobar testimonio (admin)
export const approveTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = getSingleParam(req.params.id);
    const testimonial = await testimonialRepo.approve(id);

    if (!testimonial) {
      res.status(404).json({
        success: false,
        message: "Testimonio no encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: testimonial,
      message: "Testimonio aprobado exitosamente",
    });
  } catch (error) {
    console.error("Error approving testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Error al aprobar el testimonio",
    });
  }
};

// Destacar/quitar destacado (admin)
export const toggleFeatured = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = getSingleParam(req.params.id);
    const { isFeatured } = req.body;

    const testimonial = await testimonialRepo.feature(id, isFeatured);

    if (!testimonial) {
      res.status(404).json({
        success: false,
        message: "Testimonio no encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: testimonial,
      message: isFeatured ? "Testimonio destacado" : "Testimonio quitado de destacados",
    });
  } catch (error) {
    console.error("Error toggling featured:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el testimonio",
    });
  }
};

// Actualizar testimonio (admin)
export const updateTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = getSingleParam(req.params.id);
    const updateData = req.body;

    const testimonial = await testimonialRepo.update(id, updateData);

    if (!testimonial) {
      res.status(404).json({
        success: false,
        message: "Testimonio no encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: testimonial,
      message: "Testimonio actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el testimonio",
    });
  }
};

// Eliminar testimonio (admin)
export const deleteTestimonial = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = getSingleParam(req.params.id);
    const testimonial = await testimonialRepo.delete(id);

    if (!testimonial) {
      res.status(404).json({
        success: false,
        message: "Testimonio no encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Testimonio eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el testimonio",
    });
  }
};
