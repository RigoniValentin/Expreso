import Course, { ICourse } from "../models/Course";

export class CourseRepository {
  async create(courseData: Partial<ICourse>): Promise<ICourse> {
    const course = new Course(courseData);
    return await course.save();
  }

  async findById(id: string): Promise<ICourse | null> {
    return await Course.findById(id).populate("modules");
  }

  async findBySlug(slug: string): Promise<ICourse | null> {
    return await Course.findOne({ slug }).populate("modules");
  }

  async findAll(filters: any = {}): Promise<ICourse[]> {
    return await Course.find(filters).sort({ order: 1, createdAt: -1 });
  }

  async findByArea(area: string): Promise<ICourse[]> {
    return await Course.find({ area, isPublished: true }).sort({ order: 1 });
  }

  async findPublished(): Promise<ICourse[]> {
    return await Course.find({ isPublished: true }).sort({ order: 1 });
  }

  async findFree(): Promise<ICourse[]> {
    return await Course.find({ isFree: true, isPublished: true }).sort({
      order: 1,
    });
  }

  async update(
    id: string,
    updateData: Partial<ICourse>
  ): Promise<ICourse | null> {
    return await Course.findByIdAndUpdate(id, updateData, { new: true });
  }

  async addModule(courseId: string, moduleId: string): Promise<ICourse | null> {
    return await Course.findByIdAndUpdate(
      courseId,
      { $addToSet: { modules: moduleId } },
      { new: true }
    );
  }

  async removeModule(
    courseId: string,
    moduleId: string
  ): Promise<ICourse | null> {
    return await Course.findByIdAndUpdate(
      courseId,
      { $pull: { modules: moduleId } },
      { new: true }
    );
  }

  async delete(id: string): Promise<ICourse | null> {
    return await Course.findByIdAndDelete(id);
  }

  async countByArea(area: string): Promise<number> {
    return await Course.countDocuments({ area, isPublished: true });
  }
}

export default new CourseRepository();
