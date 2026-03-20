import mongoose from "mongoose";
import courseRepository from "../repositories/courseRepository";
import moduleRepository from "../repositories/moduleRepository";
import { ICourseCreate, ICourseUpdate } from "../types/NehilakTypes";

export class CourseService {
  async createCourse(data: ICourseCreate) {
    return await courseRepository.create(data);
  }

  async getCourseById(id: string) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new Error("Curso no encontrado");
    }
    return course;
  }

  async getCourseBySlug(slug: string) {
    const course = await courseRepository.findBySlug(slug);
    if (!course) {
      throw new Error("Curso no encontrado");
    }
    return course;
  }

  async getAllCourses(includeUnpublished: boolean = false) {
    if (includeUnpublished) {
      return await courseRepository.findAll();
    }
    return await courseRepository.findPublished();
  }

  async getCoursesByArea(area: string) {
    return await courseRepository.findByArea(area);
  }

  async getFreeCourses() {
    return await courseRepository.findFree();
  }

  async updateCourse(id: string, data: ICourseUpdate) {
    return await courseRepository.update(id, data);
  }

  async deleteCourse(id: string) {
    // Eliminar módulos asociados
    const modules = await moduleRepository.findByCourseId(id);
    for (const module of modules) {
      await moduleRepository.delete(
        (module._id as mongoose.Types.ObjectId).toString()
      );
    }

    return await courseRepository.delete(id);
  }

  async publishCourse(id: string) {
    return await courseRepository.update(id, { isPublished: true });
  }

  async unpublishCourse(id: string) {
    return await courseRepository.update(id, { isPublished: false });
  }

  async getCourseWithModules(courseId: string, currentWeek?: number) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error("Curso no encontrado");
    }

    const modules = await moduleRepository.findByCourseId(courseId);

    // Si se proporciona currentWeek, filtrar módulos desbloqueados
    let filteredModules = modules;
    if (currentWeek !== undefined) {
      filteredModules = modules.filter(
        (module) =>
          module.week <= currentWeek ||
          (module.unlockDate && module.unlockDate <= new Date())
      );
    }

    return {
      ...course.toObject(),
      modules: filteredModules,
    };
  }

  async getAreaStatistics() {
    const areas = ["biology", "relationships", "consciousness", "energy"];
    const stats = [];

    for (const area of areas) {
      const count = await courseRepository.countByArea(area);
      stats.push({ area, count });
    }

    return stats;
  }
}

export default new CourseService();
