import mongoose, { Schema, Document } from "mongoose";

export interface IModule extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  week: number;
  order: number;
  contents: mongoose.Types.ObjectId[];
  practices: {
    title: string;
    description: string;
    duration: number; // minutos
    type: "meditation" | "exercise" | "reflection" | "practice";
  }[];
  isPublished: boolean;
  unlockDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleSchema: Schema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    week: {
      type: Number,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    contents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Content",
      },
    ],
    practices: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        type: {
          type: String,
          enum: ["meditation", "exercise", "reflection", "practice"],
          required: true,
        },
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    unlockDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IModule>("Module", ModuleSchema);
