import mongoose, { Schema, Document } from "mongoose";

export interface ICommunityPost extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  area?: "biology" | "relationships" | "consciousness" | "energy" | "general";
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  comments: {
    userId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  isApproved: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityPostSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      enum: ["biology", "relationships", "consciousness", "energy", "general"],
      default: "general",
    },
    tags: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isApproved: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICommunityPost>(
  "CommunityPost",
  CommunityPostSchema
);
