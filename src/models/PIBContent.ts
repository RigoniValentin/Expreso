import mongoose, { Schema, Document } from "mongoose";

// Video individual dentro de una semana
export interface IVideo {
  title: string;
  youtubeUrl: string;
  duration?: string; // Ej: "15:30"
  description?: string;
  order: number;
}

// Material adjunto (PDF, audio, imagen, etc.)
export interface IMaterial {
  title: string;
  fileUrl: string;
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // bytes
  uploadedAt: Date;
}

// Semana con sus videos
export interface IWeek {
  weekNumber: number;
  title: string;
  description?: string;
  videos: IVideo[];
  materials: IMaterial[];
}

// Interface principal del contenido PIB (compartido entre todos los grupos)
export interface IPIBContent extends Document {
  moduleNumber: number;
  title: string;
  icon: string;
  weeks: string; // Ej: "Semanas 1-4"
  purpose: string;
  axes: string[];
  practices: string[];
  expectedResult: string;
  weeklyContent: IWeek[]; // Contenido detallado por semana
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema: Schema = new Schema({
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

const MaterialSchema: Schema = new Schema({
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

const WeekSchema: Schema = new Schema({
  weekNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 16,
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
    type: [VideoSchema],
    default: [],
  },
  materials: {
    type: [MaterialSchema],
    default: [],
  },
});

const PIBContentSchema: Schema = new Schema(
  {
    moduleNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 4,
    },
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "✨",
    },
    weeks: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    axes: {
      type: [String],
      required: true,
    },
    practices: {
      type: [String],
      required: true,
    },
    expectedResult: {
      type: String,
      required: true,
    },
    weeklyContent: {
      type: [WeekSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Datos iniciales de los módulos
export const DEFAULT_MODULES = [
  {
    moduleNumber: 1,
    title: "Habitar el Ser: Presencia, Cuerpo y Autoconciencia",
    icon: "🧘",
    weeks: "Semanas 1-4",
    purpose: "Establecer una base interna sólida a través de la presencia, la conexión corporal y la auto observación consciente.",
    axes: [
      "Presencia y atención consciente",
      "El cuerpo como territorio del bienestar",
      "Autopercepción y autoobservación",
    ],
    practices: [
      "Transmisión del Biológico",
      "Rutina básica para fuerza, flexibilidad, resistencia y equilibrio",
      "Respiración consciente reguladora",
      "Escaneo corporal y sensibilidad interna",
      "Reconocimiento emocional en la vida cotidiana",
      "Diario de conciencia",
      "Rutinas breves de conexión diaria (telepatía – preguntas)",
    ],
    expectedResult: "Mayor presencia, calma, claridad interna y sensación de habitar el propio cuerpo como hogar.",
    weeklyContent: [
      { weekNumber: 1, title: "Introducción a la Presencia", description: "Comenzamos el viaje de conexión con el ser", videos: [] },
      { weekNumber: 2, title: "El Cuerpo como Territorio", description: "Reconociendo nuestro hogar físico", videos: [] },
      { weekNumber: 3, title: "Respiración Consciente", description: "La respiración como ancla al presente", videos: [] },
      { weekNumber: 4, title: "Autoobservación", description: "Desarrollando la mirada interna", videos: [] },
    ],
  },
  {
    moduleNumber: 2,
    title: "Biología Viva y Emoción Consciente",
    icon: "🌿",
    weeks: "Semanas 5-8",
    purpose: "Expandir la biología y transformar la relación con las emociones, completando el cuerpo de Biología y el cuerpo de Emociones.",
    axes: [
      "Creación en la materia",
      "Autosuficiencia, Ser Arte",
      "Nuclear el amor en uno mismo",
    ],
    practices: [
      "Apertura de llaves articulares",
      "Rutinas para completar el cuerpo de Biología",
      "Respiración consciente",
      "Identificación y transformación de patrones emocionales",
      "Nutrición consciente (enfoque energético, no dietético)",
      "Autocuidado y placer corporal",
    ],
    expectedResult: "Incremento de la energía vital, mayor fluidez en las relaciones, capacidad de habitar el placer sin culpa y liberación de emociones de baja percepción.",
    weeklyContent: [
      { weekNumber: 5, title: "Llaves Articulares", description: "Abriendo el flujo de energía", videos: [] },
      { weekNumber: 6, title: "Cuerpo de Biología", description: "Completando nuestra expresión física", videos: [] },
      { weekNumber: 7, title: "Patrones Emocionales", description: "Reconociendo y transformando", videos: [] },
      { weekNumber: 8, title: "Nutrición y Autocuidado", description: "Alimentando cuerpo y alma", videos: [] },
    ],
  },
  {
    moduleNumber: 3,
    title: "Conciencia Nucleada y Energía Transformadora",
    icon: "✨",
    weeks: "Semanas 9-12",
    purpose: "Ampliar la conciencia más allá del condicionamiento y movilizar la energía para sostener el bienestar.",
    axes: [
      "Cuerpo de Conciencia: conciencia que aplasta vs. conciencia que alienta",
      "Cuerpo de Energía y transformación",
      "Disfrute consciente en el diario vivir",
    ],
    practices: [
      "Nuclear la conciencia en la vida cotidiana",
      "Ambientes vibracionales para la autosuficiencia",
      "Diferenciar información y acción",
      "Telepatía aplicada a la transformación",
      "Energía en movimiento",
    ],
    expectedResult: "Sensación de expansión, coherencia interna, goce consciente y mayor conexión con la vida en los distintos ambientes.",
    weeklyContent: [
      { weekNumber: 9, title: "Conciencia Nucleada", description: "Centrando nuestra atención", videos: [] },
      { weekNumber: 10, title: "Ambientes Vibracionales", description: "Creando espacios de bienestar", videos: [] },
      { weekNumber: 11, title: "Telepatía y Conexión", description: "Expandiendo la percepción", videos: [] },
      { weekNumber: 12, title: "Energía en Movimiento", description: "Fluyendo con la vida", videos: [] },
    ],
  },
  {
    moduleNumber: 4,
    title: "Integración, Disfrute y Vida Consciente",
    icon: "🦋",
    weeks: "Semanas 13-16",
    purpose: "Integrar lo vivido y convertirlo en un estilo de vida basado en bienestar, disfrute, coherencia y contribución.",
    axes: [
      "Integración de los cuerpos: Biología, Emociones, Conciencia y Energía",
      "Vivir desde el ser y no desde el tener",
      "Reconocimiento del Dios interno o chispa divina",
    ],
    practices: [
      "Diseño personal de prácticas diarias de bienestar",
      "Ritual consciente de inicio y cierre del día",
      "Comunicación consciente y vínculos auténticos",
      "Proyecto personal de disfrute y sentido",
      "Cierre grupal integrador",
    ],
    expectedResult: "Capacidad de sostener bienestar, placer y goce de forma simple, real y cotidiana.",
    weeklyContent: [
      { weekNumber: 13, title: "Integración de Cuerpos", description: "Unificando biología, emoción, conciencia y energía", videos: [] },
      { weekNumber: 14, title: "Rituales Conscientes", description: "Creando estructura de bienestar", videos: [] },
      { weekNumber: 15, title: "Vínculos Auténticos", description: "Comunicación desde el ser", videos: [] },
      { weekNumber: 16, title: "Cierre e Integración", description: "Celebrando el camino recorrido", videos: [] },
    ],
  },
];

export const PIBContentModel = mongoose.model<IPIBContent>("PIBContent", PIBContentSchema);
