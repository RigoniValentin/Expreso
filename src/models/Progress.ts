import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  completedContents: {
    contentId: mongoose.Types.ObjectId;
    completedAt: Date;
    timeSpent: number; // minutos
  }[];
  completedModules: {
    moduleId: mongoose.Types.ObjectId;
    completedAt: Date;
  }[];
  completedCourses: {
    courseId: mongoose.Types.ObjectId;
    completedAt: Date;
  }[];
  journalEntries: {
    date: Date;
    area: "biology" | "relationships" | "consciousness" | "energy";
    reflection: string;
    mood: number; // 1-5
    achievements: string[];
  }[];
  areaProgress: {
    biology: number; // 0-100
    relationships: number;
    consciousness: number;
    energy: number;
  };
  totalTimeSpent: number; // minutos
  streak: {
    current: number;
    longest: number;
    lastActivity: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    completedContents: [
      {
        contentId: {
          type: Schema.Types.ObjectId,
          ref: "Content",
          required: true,
        },
        completedAt: { type: Date, default: Date.now },
        timeSpent: { type: Number, default: 0 },
      },
    ],
    completedModules: [
      {
        moduleId: {
          type: Schema.Types.ObjectId,
          ref: "Module",
          required: true,
        },
        completedAt: { type: Date, default: Date.now },
      },
    ],
    completedCourses: [
      {
        courseId: {
          type: Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
        completedAt: { type: Date, default: Date.now },
      },
    ],
    journalEntries: [
      {
        date: { type: Date, default: Date.now },
        area: {
          type: String,
          enum: ["biology", "relationships", "consciousness", "energy"],
          required: true,
        },
        reflection: { type: String, required: true },
        mood: { type: Number, min: 1, max: 5, required: true },
        achievements: [{ type: String }],
      },
    ],
    areaProgress: {
      biology: { type: Number, default: 0, min: 0, max: 100 },
      relationships: { type: Number, default: 0, min: 0, max: 100 },
      consciousness: { type: Number, default: 0, min: 0, max: 100 },
      energy: { type: Number, default: 0, min: 0, max: 100 },
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
    },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastActivity: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProgress>("Progress", ProgressSchema);
