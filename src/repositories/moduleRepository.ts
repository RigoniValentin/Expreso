import Module, { IModule } from "../models/Module";

export class ModuleRepository {
  async create(moduleData: Partial<IModule>): Promise<IModule> {
    const module = new Module(moduleData);
    return await module.save();
  }

  async findById(id: string): Promise<IModule | null> {
    return await Module.findById(id).populate("contents");
  }

  async findBySlug(slug: string, courseId: string): Promise<IModule | null> {
    return await Module.findOne({ slug, courseId }).populate("contents");
  }

  async findByCourseId(courseId: string): Promise<IModule[]> {
    return await Module.find({ courseId }).sort({ week: 1, order: 1 });
  }

  async findByWeek(courseId: string, week: number): Promise<IModule[]> {
    return await Module.find({ courseId, week }).sort({ order: 1 });
  }

  async findAll(filters: any = {}): Promise<IModule[]> {
    return await Module.find(filters).sort({ week: 1, order: 1 });
  }

  async update(
    id: string,
    updateData: Partial<IModule>
  ): Promise<IModule | null> {
    return await Module.findByIdAndUpdate(id, updateData, { new: true });
  }

  async addContent(
    moduleId: string,
    contentId: string
  ): Promise<IModule | null> {
    return await Module.findByIdAndUpdate(
      moduleId,
      { $addToSet: { contents: contentId } },
      { new: true }
    );
  }

  async removeContent(
    moduleId: string,
    contentId: string
  ): Promise<IModule | null> {
    return await Module.findByIdAndUpdate(
      moduleId,
      { $pull: { contents: contentId } },
      { new: true }
    );
  }

  async addPractice(moduleId: string, practice: any): Promise<IModule | null> {
    return await Module.findByIdAndUpdate(
      moduleId,
      { $push: { practices: practice } },
      { new: true }
    );
  }

  async delete(id: string): Promise<IModule | null> {
    return await Module.findByIdAndDelete(id);
  }

  async getUnlockedModules(currentWeek: number): Promise<IModule[]> {
    return await Module.find({
      $or: [
        { week: { $lte: currentWeek } },
        { unlockDate: { $lte: new Date() } },
      ],
      isPublished: true,
    }).sort({ week: 1, order: 1 });
  }
}

export default new ModuleRepository();
