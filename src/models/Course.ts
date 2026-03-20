import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  area: "biology" | "relationships" | "consciousness" | "energy";
  level: "beginner" | "intermediate" | "advanced";
  duration: number; // en semanas
  objectives: string[];
  modules: mongoose.Types.ObjectId[];
  isPublished: boolean;
  isFree: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      enum: ["biology", "relationships", "consciousness", "energy"],
      required: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    duration: {
      type: Number,
      required: true,
    },
    objectives: [
      {
        type: String,
      },
    ],
    modules: [
      {
        type: Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICourse>("Course", CourseSchema);
