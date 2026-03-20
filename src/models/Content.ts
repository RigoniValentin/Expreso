import mongoose, { Schema, Document } from "mongoose";

export interface IContent extends Document {
  moduleId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  type: "video" | "article" | "audio" | "pdf" | "live_class";
  description: string;
  contentUrl: string;
  thumbnailUrl?: string;
  duration?: number; // en minutos
  order: number;
  isDaily: boolean;
  publishDate: Date;
  tags: string[];
  resources: {
    title: string;
    url: string;
    type: string;
  }[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema: Schema = new Schema(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "Module",
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
    type: {
      type: String,
      enum: ["video", "article", "audio", "pdf", "live_class"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    contentUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    duration: {
      type: Number,
    },
    order: {
      type: Number,
      default: 0,
    },
    isDaily: {
      type: Boolean,
      default: false,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    tags: [
      {
        type: String,
      },
    ],
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IContent>("Content", ContentSchema);
