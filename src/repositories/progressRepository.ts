import Progress, { IProgress } from "../models/Progress";

export class ProgressRepository {
  async create(progressData: Partial<IProgress>): Promise<IProgress> {
    const progress = new Progress(progressData);
    return await progress.save();
  }

  async findById(id: string): Promise<IProgress | null> {
    return await Progress.findById(id)
      .populate("completedContents.contentId")
      .populate("completedModules.moduleId")
      .populate("completedCourses.courseId");
  }

  async findByUserId(userId: string): Promise<IProgress | null> {
    return await Progress.findOne({ userId })
      .populate("completedContents.contentId")
      .populate("completedModules.moduleId")
      .populate("completedCourses.courseId");
  }

  async update(
    userId: string,
    updateData: Partial<IProgress>
  ): Promise<IProgress | null> {
    return await Progress.findOneAndUpdate({ userId }, updateData, {
      new: true,
      upsert: true,
    });
  }

  async addCompletedContent(
    userId: string,
    contentId: string,
    timeSpent: number = 0
  ): Promise<IProgress | null> {
    const now = new Date();
    return await Progress.findOneAndUpdate(
      { userId },
      {
        $addToSet: {
          completedContents: {
            contentId,
            completedAt: now,
            timeSpent,
          },
        },
        $inc: { totalTimeSpent: timeSpent },
        $set: { "streak.lastActivity": now },
      },
      { new: true, upsert: true }
    );
  }

  async addCompletedModule(
    userId: string,
    moduleId: string
  ): Promise<IProgress | null> {
    return await Progress.findOneAndUpdate(
      { userId },
      {
        $addToSet: {
          completedModules: {
            moduleId,
            completedAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );
  }

  async addCompletedCourse(
    userId: string,
    courseId: string
  ): Promise<IProgress | null> {
    return await Progress.findOneAndUpdate(
      { userId },
      {
        $addToSet: {
          completedCourses: {
            courseId,
            completedAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );
  }

  async addJournalEntry(userId: string, entry: any): Promise<IProgress | null> {
    return await Progress.findOneAndUpdate(
      { userId },
      {
        $push: {
          journalEntries: {
            ...entry,
            date: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );
  }

  async updateAreaProgress(
    userId: string,
    area: string,
    progress: number
  ): Promise<IProgress | null> {
    const updateField = `areaProgress.${area}`;
    return await Progress.findOneAndUpdate(
      { userId },
      { $set: { [updateField]: Math.min(100, Math.max(0, progress)) } },
      { new: true, upsert: true }
    );
  }

  async updateStreak(userId: string): Promise<IProgress | null> {
    const userProgress = await this.findByUserId(userId);
    if (!userProgress) return null;

    const lastActivity = userProgress.streak.lastActivity;
    const now = new Date();
    const daysDifference = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = userProgress.streak.current;

    if (daysDifference === 1) {
      newStreak += 1;
    } else if (daysDifference > 1) {
      newStreak = 1;
    }

    const longestStreak = Math.max(userProgress.streak.longest, newStreak);

    return await Progress.findOneAndUpdate(
      { userId },
      {
        $set: {
          "streak.current": newStreak,
          "streak.longest": longestStreak,
          "streak.lastActivity": now,
        },
      },
      { new: true }
    );
  }

  async getJournalEntries(
    userId: string,
    area?: string,
    limit?: number
  ): Promise<any[]> {
    const progress = await this.findByUserId(userId);
    if (!progress) return [];

    let entries = progress.journalEntries;

    if (area) {
      entries = entries.filter((entry) => entry.area === area);
    }

    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    if (limit) {
      entries = entries.slice(0, limit);
    }

    return entries;
  }

  async delete(userId: string): Promise<IProgress | null> {
    return await Progress.findOneAndDelete({ userId });
  }
}

export default new ProgressRepository();
