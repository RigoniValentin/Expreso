import mongoose, { Schema, Document } from "mongoose";

export interface ILiveClass extends Document {
  title: string;
  description: string;
  instructor: {
    name: string;
    bio: string;
    avatarUrl: string;
  };
  area: "biology" | "relationships" | "consciousness" | "energy";
  scheduledDate: Date;
  duration: number; // minutos
  meetingUrl: string;
  recordingUrl?: string;
  isLive: boolean;
  maxParticipants?: number;
  registeredUsers: mongoose.Types.ObjectId[];
  resources: {
    title: string;
    url: string;
    type: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const LiveClassSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      name: { type: String, required: true },
      bio: { type: String, required: true },
      avatarUrl: { type: String, required: true },
    },
    area: {
      type: String,
      enum: ["biology", "relationships", "consciousness", "energy"],
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    meetingUrl: {
      type: String,
      required: true,
    },
    recordingUrl: {
      type: String,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    maxParticipants: {
      type: Number,
    },
    registeredUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ILiveClass>("LiveClass", LiveClassSchema);
