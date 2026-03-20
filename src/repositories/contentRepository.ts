import Content, { IContent } from "../models/Content";

export class ContentRepository {
  async create(contentData: Partial<IContent>): Promise<IContent> {
    const content = new Content(contentData);
    return await content.save();
  }

  async findById(id: string): Promise<IContent | null> {
    return await Content.findById(id);
  }

  async findBySlug(slug: string, moduleId: string): Promise<IContent | null> {
    return await Content.findOne({ slug, moduleId });
  }

  async findByModuleId(moduleId: string): Promise<IContent[]> {
    return await Content.find({ moduleId }).sort({ order: 1 });
  }

  async findDailyContent(date?: Date): Promise<IContent[]> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return await Content.find({
      isDaily: true,
      isPublished: true,
      publishDate: {
        $gte: targetDate,
        $lt: nextDay,
      },
    }).sort({ publishDate: -1 });
  }

  async findByType(type: string): Promise<IContent[]> {
    return await Content.find({ type, isPublished: true }).sort({
      publishDate: -1,
    });
  }

  async findAll(filters: any = {}): Promise<IContent[]> {
    return await Content.find(filters).sort({ order: 1 });
  }

  async update(
    id: string,
    updateData: Partial<IContent>
  ): Promise<IContent | null> {
    return await Content.findByIdAndUpdate(id, updateData, { new: true });
  }

  async addResource(
    contentId: string,
    resource: any
  ): Promise<IContent | null> {
    return await Content.findByIdAndUpdate(
      contentId,
      { $push: { resources: resource } },
      { new: true }
    );
  }

  async delete(id: string): Promise<IContent | null> {
    return await Content.findByIdAndDelete(id);
  }

  async searchByTags(tags: string[]): Promise<IContent[]> {
    return await Content.find({
      tags: { $in: tags },
      isPublished: true,
    }).sort({ publishDate: -1 });
  }

  async getRecentContent(limit: number = 10): Promise<IContent[]> {
    return await Content.find({ isPublished: true })
      .sort({ publishDate: -1 })
      .limit(limit);
  }
}

export default new ContentRepository();
