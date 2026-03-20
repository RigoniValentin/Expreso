import Subscription, { ISubscription } from "../models/Subscription";
import mongoose from "mongoose";

export class SubscriptionRepository {
  async create(
    subscriptionData: Partial<ISubscription>
  ): Promise<ISubscription> {
    const subscription = new Subscription(subscriptionData);
    return await subscription.save();
  }

  async findById(id: string): Promise<ISubscription | null> {
    return await Subscription.findById(id).populate("userId", "name email");
  }

  async findByUserId(userId: string): Promise<ISubscription | null> {
    return await Subscription.findOne({
      userId,
      status: { $in: ["active", "paused"] },
    }).sort({ createdAt: -1 });
  }

  async findAll(filters: any = {}): Promise<ISubscription[]> {
    return await Subscription.find(filters)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
  }

  async update(
    id: string,
    updateData: Partial<ISubscription>
  ): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(id, updateData, { new: true });
  }

  async addCompletedModule(
    subscriptionId: string,
    moduleId: string
  ): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        $addToSet: { "progress.completedModules": moduleId },
        $set: { "progress.lastActivity": new Date() },
      },
      { new: true }
    );
  }

  async updateCurrentWeek(
    subscriptionId: string,
    week: number
  ): Promise<ISubscription | null> {
    return await Subscription.findByIdAndUpdate(
      subscriptionId,
      { "progress.currentWeek": week },
      { new: true }
    );
  }

  async getActiveSubscriptions(): Promise<ISubscription[]> {
    return await Subscription.find({
      status: "active",
      endDate: { $gte: new Date() },
    });
  }

  async getExpiredSubscriptions(): Promise<ISubscription[]> {
    return await Subscription.find({
      status: "active",
      endDate: { $lt: new Date() },
    });
  }

  async delete(id: string): Promise<ISubscription | null> {
    return await Subscription.findByIdAndDelete(id);
  }
}

export default new SubscriptionRepository();
