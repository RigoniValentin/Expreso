import mongoose from "mongoose";
import progressRepository from "../repositories/progressRepository";
import subscriptionRepository from "../repositories/subscriptionRepository";
import contentRepository from "../repositories/contentRepository";
import moduleRepository from "../repositories/moduleRepository";
import courseRepository from "../repositories/courseRepository";
import { IJournalEntry } from "../types/NehilakTypes";

export class ProgressService {
  async getProgressByUserId(userId: string) {
    let progress = await progressRepository.findByUserId(userId);

    if (!progress) {
      // Crear progreso si no existe
      const subscription = await subscriptionRepository.findByUserId(userId);
      if (!subscription) {
        throw new Error("Usuario no tiene suscripción activa");
      }

      progress = await progressRepository.create({
        userId: new mongoose.Types.ObjectId(userId),
        subscriptionId: subscription._id as mongoose.Types.ObjectId,
        completedContents: [],
        completedModules: [],
        completedCourses: [],
        journalEntries: [],
        areaProgress: {
          biology: 0,
          relationships: 0,
          consciousness: 0,
          energy: 0,
        },
        totalTimeSpent: 0,
        streak: {
          current: 0,
          longest: 0,
          lastActivity: new Date(),
        },
      });
    }

    // Calcular progreso general
    const totalContents = progress.completedContents.length;
    const totalModules = progress.completedModules.length;
    const totalCourses = progress.completedCourses.length;

    const overallProgress = Math.min(
      100,
      Math.floor(
        (totalContents * 1 + totalModules * 10 + totalCourses * 50) / 10
      )
    );

    return {
      ...progress.toObject(),
      completedContents: totalContents,
      completedModules: totalModules,
      completedCourses: totalCourses,
      overallProgress,
    };
  }

  async markContentCompleted(
    userId: string,
    contentId: string,
    timeSpent: number = 0
  ) {
    const progress = await progressRepository.addCompletedContent(
      userId,
      contentId,
      timeSpent
    );

    // Actualizar streak
    await progressRepository.updateStreak(userId);

    // Verificar si completó todos los contenidos de un módulo
    const content = await contentRepository.findById(contentId);
    if (content) {
      await this.checkModuleCompletion(userId, content.moduleId.toString());
    }

    return progress;
  }

  async checkModuleCompletion(userId: string, moduleId: string) {
    const progress = await progressRepository.findByUserId(userId);
    if (!progress) return;

    const module = await moduleRepository.findById(moduleId);
    if (!module) return;

    // Verificar si todos los contenidos del módulo están completados
    const moduleContents = module.contents;
    const completedContents = progress.completedContents.map((c) =>
      c.contentId.toString()
    );

    const allCompleted = moduleContents.every((contentId) =>
      completedContents.includes(contentId.toString())
    );

    if (allCompleted) {
      await progressRepository.addCompletedModule(userId, moduleId);

      // Verificar si completó todos los módulos de un curso
      await this.checkCourseCompletion(userId, module.courseId.toString());

      // Actualizar progreso por área
      const course = await courseRepository.findById(
        module.courseId.toString()
      );
      if (course) {
        await this.updateAreaProgressAfterModule(userId, course.area);
      }
    }
  }

  async checkCourseCompletion(userId: string, courseId: string) {
    const progress = await progressRepository.findByUserId(userId);
    if (!progress) return;

    const course = await courseRepository.findById(courseId);
    if (!course) return;

    const courseModules = course.modules;
    const completedModules = progress.completedModules.map((m) =>
      m.moduleId.toString()
    );

    const allCompleted = courseModules.every((moduleId) =>
      completedModules.includes(moduleId.toString())
    );

    if (allCompleted) {
      await progressRepository.addCompletedCourse(userId, courseId);
    }
  }

  async updateAreaProgressAfterModule(userId: string, area: string) {
    const progress = await progressRepository.findByUserId(userId);
    if (!progress) return;

    // Contar módulos completados del área
    const completedModuleIds = progress.completedModules.map((m) =>
      m.moduleId.toString()
    );

    let areaModulesCompleted = 0;
    let totalAreaModules = 0;

    const areaCourses = await courseRepository.findByArea(area);
    for (const course of areaCourses) {
      const modules = await moduleRepository.findByCourseId(
        (course._id as mongoose.Types.ObjectId).toString()
      );
      totalAreaModules += modules.length;

      areaModulesCompleted += modules.filter((m) =>
        completedModuleIds.includes(
          (m._id as mongoose.Types.ObjectId).toString()
        )
      ).length;
    }

    const areaProgress =
      totalAreaModules > 0
        ? Math.floor((areaModulesCompleted / totalAreaModules) * 100)
        : 0;

    await progressRepository.updateAreaProgress(userId, area, areaProgress);
  }

  async addJournalEntry(userId: string, entry: IJournalEntry) {
    return await progressRepository.addJournalEntry(userId, entry);
  }

  async getJournalEntries(userId: string, area?: string, limit?: number) {
    return await progressRepository.getJournalEntries(userId, area, limit);
  }

  async updateStreak(userId: string) {
    return await progressRepository.updateStreak(userId);
  }

  async getDashboardStats(userId: string) {
    const progress = await this.getProgressByUserId(userId);
    const subscription = await subscriptionRepository.findByUserId(userId);

    return {
      totalTimeSpent: progress.totalTimeSpent,
      completedContents: progress.completedContents,
      completedModules: progress.completedModules,
      completedCourses: progress.completedCourses,
      currentStreak: progress.streak.current,
      longestStreak: progress.streak.longest,
      overallProgress: progress.overallProgress,
      areaProgress: progress.areaProgress,
      currentWeek: subscription?.progress.currentWeek || 1,
      daysRemaining: subscription
        ? Math.ceil(
            (subscription.endDate.getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    };
  }
}

export default new ProgressService();
