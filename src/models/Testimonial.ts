import mongoose, { Schema, Document } from "mongoose";

export interface ITestimonial extends Document {
  userId?: mongoose.Types.ObjectId;
  authorName: string;
  authorRole?: string;
  avatarUrl?: string;
  content: string;
  rating: number;
  area?: "biology" | "relationships" | "consciousness" | "energy" | "general";
  isApproved: boolean;
  isFeatured: boolean;
  publishDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorRole: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    area: {
      type: String,
      enum: ["biology", "relationships", "consciousness", "energy", "general"],
      default: "general",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);
