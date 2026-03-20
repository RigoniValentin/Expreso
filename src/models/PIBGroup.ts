import mongoose, { Schema, Document } from "mongoose";

// Video semanal grupal específico de cada programa
export interface IWeeklyVideo {
  week: number;
  moduleNumber: number;
  title: string;
  youtubeUrl: string;
  description?: string;
  isAvailable: boolean;
  availableFrom?: Date;
}

// Participante inscrito en el programa
export interface IParticipant {
  userId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  paymentPlan: "full" | "monthly";
  paidInstallments: number; // 1 for full, 1-4 for monthly
  nextPaymentDue?: Date; // Only for monthly plan
  accessActive: boolean;
  progress: {
    currentModule: number;
    currentWeek: number;
    completedVideos: string[]; // IDs de videos completados
  };
}

// Interface principal del Grupo PIB
export interface IPIBGroup extends Document {
  name: string;
  color: string; // Color identificador del grupo (amarillo, rojo, azul, etc.)
  colorHex: string; // Color en formato hex para UI
  description?: string;
  startDate?: Date; // Fecha de inicio del programa
  endDate?: Date; // Fecha de fin calculada (16 semanas después)
  status: "pending" | "active" | "completed" | "cancelled";
  maxParticipants?: number;
  fullPrice: number; // Precio pago único con descuento
  monthlyPrice: number; // Precio por mes (4 cuotas)
  participants: IParticipant[];
  weeklyGroupVideos: IWeeklyVideo[]; // Videos grupales semanales propios de este grupo
  isOpen: boolean; // Si está abierto para inscripciones
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyVideoSchema: Schema = new Schema({
  week: {
    type: Number,
    required: true,
    min: 1,
    max: 16,
  },
  moduleNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
  },
  title: {
    type: String,
    required: true,
  },
  youtubeUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  isAvailable: {
    type: Boolean,
    default: false,
  },
  availableFrom: {
    type: Date,
  },
});

const ParticipantSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
  },
  paymentPlan: {
    type: String,
    enum: ["full", "monthly"],
    default: "full",
  },
  paidInstallments: {
    type: Number,
    default: 1,
  },
  nextPaymentDue: {
    type: Date,
  },
  accessActive: {
    type: Boolean,
    default: true,
  },
  progress: {
    currentModule: {
      type: Number,
      default: 1,
    },
    currentWeek: {
      type: Number,
      default: 1,
    },
    completedVideos: {
      type: [String],
      default: [],
    },
  },
});

const PIBGroupSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
      enum: ["amarillo", "rojo", "azul", "verde", "violeta", "naranja", "rosa", "turquesa"],
    },
    colorHex: {
      type: String,
      required: true,
      default: "#a1dade",
    },
    description: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
    maxParticipants: {
      type: Number,
      default: 30,
    },
    fullPrice: {
      type: Number,
      default: 0,
    },
    monthlyPrice: {
      type: Number,
      default: 0,
    },
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    weeklyGroupVideos: {
      type: [WeeklyVideoSchema],
      default: [],
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Middleware para calcular fecha de fin al establecer fecha de inicio
PIBGroupSchema.pre("save", function (next) {
  if (this.isModified("startDate") && this.startDate) {
    const endDate = new Date(this.startDate as Date);
    endDate.setDate(endDate.getDate() + 16 * 7); // 16 semanas
    this.endDate = endDate;
  }
  next();
});

// Mapa de colores para la UI
export const PIB_COLORS: Record<string, string> = {
  amarillo: "#F59E0B",
  rojo: "#EF4444",
  azul: "#3B82F6",
  verde: "#22C55E",
  violeta: "#8B5CF6",
  naranja: "#F97316",
  rosa: "#EC4899",
  turquesa: "#14B8A6",
};

export const PIBGroupModel = mongoose.model<IPIBGroup>("PIBGroup", PIBGroupSchema);
