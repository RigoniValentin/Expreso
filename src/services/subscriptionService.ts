import mongoose from "mongoose";
import subscriptionRepository from "../repositories/subscriptionRepository";
import progressRepository from "../repositories/progressRepository";
import {
  ISubscriptionCreate,
  ISubscriptionUpdate,
} from "../types/NehilakTypes";

export class SubscriptionService {
  async createSubscription(data: ISubscriptionCreate) {
    // Calcular fechas (4 meses = 16 semanas)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4);

    const subscription = await subscriptionRepository.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      plan: data.plan,
      startDate,
      endDate,
      paymentInfo: data.paymentInfo,
      status: "active",
      progress: {
        currentWeek: 1,
        completedModules: [],
        lastActivity: new Date(),
      },
    });

    // Crear registro de progreso
    await progressRepository.create({
      userId: new mongoose.Types.ObjectId(data.userId),
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

    return subscription;
  }

  async getSubscriptionByUserId(userId: string) {
    const subscription = await subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      throw new Error("No se encontró una suscripción activa");
    }

    const daysRemaining = Math.ceil(
      (subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const totalDays = Math.ceil(
      (subscription.endDate.getTime() - subscription.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const weekProgress = Math.floor(
      ((totalDays - daysRemaining) / totalDays) * 100
    );

    return {
      ...subscription.toObject(),
      daysRemaining,
      weekProgress,
    };
  }

  async updateSubscription(id: string, data: ISubscriptionUpdate) {
    return await subscriptionRepository.update(id, data);
  }

  async pauseSubscription(id: string) {
    return await subscriptionRepository.update(id, { status: "paused" });
  }

  async resumeSubscription(id: string) {
    return await subscriptionRepository.update(id, { status: "active" });
  }

  async cancelSubscription(id: string) {
    return await subscriptionRepository.update(id, { status: "cancelled" });
  }

  async completeModule(subscriptionId: string, moduleId: string) {
    const subscription = await subscriptionRepository.addCompletedModule(
      subscriptionId,
      moduleId
    );

    // Actualizar semana actual si es necesario
    if (subscription) {
      const completedCount = subscription.progress.completedModules.length;
      const newWeek = Math.min(16, Math.floor(completedCount / 4) + 1);

      if (newWeek > subscription.progress.currentWeek) {
        await subscriptionRepository.updateCurrentWeek(subscriptionId, newWeek);
      }
    }

    return subscription;
  }

  async checkAndUpdateExpiredSubscriptions() {
    const expired = await subscriptionRepository.getExpiredSubscriptions();

    for (const subscription of expired) {
      await subscriptionRepository.update(
        (subscription._id as mongoose.Types.ObjectId).toString(),
        {
          status: "completed",
        }
      );
    }

    return expired.length;
  }
}

export default new SubscriptionService();
