import Testimonial, { ITestimonial } from "../models/Testimonial";

export class TestimonialRepository {
  async create(testimonialData: Partial<ITestimonial>): Promise<ITestimonial> {
    const testimonial = new Testimonial(testimonialData);
    return await testimonial.save();
  }

  async findById(id: string): Promise<ITestimonial | null> {
    return await Testimonial.findById(id).populate("userId", "name email avatar locality");
  }

  async findAll(filters: any = {}): Promise<ITestimonial[]> {
    return await Testimonial.find(filters)
      .populate("userId", "name email avatar locality")
      .sort({ publishDate: -1 });
  }

  async findApproved(): Promise<ITestimonial[]> {
    return await Testimonial.find({ isApproved: true })
      .populate("userId", "name avatar locality")
      .sort({ publishDate: -1 });
  }

  async findFeatured(): Promise<ITestimonial[]> {
    return await Testimonial.find({ isApproved: true, isFeatured: true })
      .populate("userId", "name avatar locality")
      .sort({ publishDate: -1 });
  }

  async findByArea(area: string): Promise<ITestimonial[]> {
    return await Testimonial.find({ area, isApproved: true })
      .populate("userId", "name avatar locality")
      .sort({ publishDate: -1 });
  }

  async findByUserId(userId: string): Promise<ITestimonial[]> {
    return await Testimonial.find({ userId }).sort({ createdAt: -1 });
  }

  async update(
    id: string,
    updateData: Partial<ITestimonial>
  ): Promise<ITestimonial | null> {
    return await Testimonial.findByIdAndUpdate(id, updateData, { new: true });
  }

  async approve(id: string): Promise<ITestimonial | null> {
    return await Testimonial.findByIdAndUpdate(
      id,
      { isApproved: true },
      { new: true }
    );
  }

  async feature(
    id: string,
    isFeatured: boolean = true
  ): Promise<ITestimonial | null> {
    return await Testimonial.findByIdAndUpdate(
      id,
      { isFeatured },
      { new: true }
    );
  }

  async delete(id: string): Promise<ITestimonial | null> {
    return await Testimonial.findByIdAndDelete(id);
  }

  async getAverageRating(): Promise<number> {
    const result = await Testimonial.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    return result.length > 0 ? result[0].avgRating : 0;
  }

  async getAverageRatingByArea(area: string): Promise<number> {
    const result = await Testimonial.aggregate([
      { $match: { isApproved: true, area } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ]);
    return result.length > 0 ? result[0].avgRating : 0;
  }
}

export default new TestimonialRepository();
