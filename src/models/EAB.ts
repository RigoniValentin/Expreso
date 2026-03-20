import mongoose, { Schema, Document } from "mongoose";

// Video dentro de un módulo EAB
export interface IEABVideo {
  title: string;
  youtubeUrl: string;
  duration?: string;
  description?: string;
  order: number;
}

// Material adjunto (PDF, audio, imagen, etc.)
export interface IEABMaterial {
  title: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

// Módulo de un EAB
export interface IEABModule {
  moduleNumber: number;
  title: string;
  description?: string;
  videos: IEABVideo[];
  materials: IEABMaterial[];
}

// Interface principal del EAB
export interface IEAB extends Document {
  title: string;
  description: string;
  icon: string;
  price: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  status: "draft" | "active" | "completed" | "cancelled";
  maxParticipants?: number;
  isOpen: boolean;
  modules: IEABModule[];
  participants: IEABParticipant[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEABParticipant {
  userId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  progress: {
    currentModule: number;
    completedVideos: string[];
  };
}

const EABVideoSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  youtubeUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  order: {
    type: Number,
    required: true,
    default: 1,
  },
});

const EABMaterialSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const EABModuleSchema: Schema = new Schema({
  moduleNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  videos: {
    type: [EABVideoSchema],
    default: [],
  },
  materials: {
    type: [EABMaterialSchema],
    default: [],
  },
});

const EABParticipantSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  progress: {
    currentModule: {
      type: Number,
      default: 1,
    },
    completedVideos: {
      type: [String],
      default: [],
    },
  },
});

const EABSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "🔥",
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled"],
      default: "draft",
    },
    maxParticipants: {
      type: Number,
      default: 50,
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
    modules: {
      type: [EABModuleSchema],
      default: [],
    },
    participants: {
      type: [EABParticipantSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const EABModel = mongoose.model<IEAB>("EAB", EABSchema);
