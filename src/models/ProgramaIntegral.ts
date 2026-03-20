import mongoose, { Schema, Document } from "mongoose";

// Interface para un módulo individual del programa
export interface IModulo {
  number: number;
  weeks: string;
  title: string;
  purpose: string;
  axes: string[];
  practices: string[];
  expectedResult: string;
}

// Interface principal del Programa Integral en Bienestar
export interface IProgramaIntegral extends Document {
  title: string;
  subtitle: string;
  description: string[];
  mainQuote: string;
  objetivoGeneral: string;
  objetivosEspecificos: string[];
  principios: string[];
  duracion: {
    months: number;
    weeks: number;
  };
  formato: string[];
  modalidad: string[];
  sesiones: {
    frequency: string;
    duration: string;
  };
  practicaPersonal: string;
  modulos: IModulo[];
  elementosTransversales: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ModuloSchema: Schema = new Schema({
  number: {
    type: Number,
    required: true,
  },
  weeks: {
    type: String,
    required: true,
  },
  title: {
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
});

const ProgramaIntegralSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      default: "Programa Integral en Bienestar",
    },
    subtitle: {
      type: String,
      required: true,
      default:
        "Propuesta de acompañamiento vivencial para la expansión del ser humano",
    },
    description: {
      type: [String],
      required: true,
      default: [
        "El Programa Integral en Bienestar (PIB) es una propuesta de acompañamiento humano, individual y grupal, diseñada para quienes desean habitar su vida con mayor conciencia, bienestar, placer, goce y disfrute, integrando de manera práctica y experiencial su biología, emociones, conciencia y energía.",
        "Este programa no busca corregir ni reparar al ser humano, sino recordar, activar y expandir su potencial natural, facilitando un proceso de reconexión profunda con el cuerpo, la sensibilidad, la presencia y la autosuficiencia.",
        "El PIB se desarrolla desde una visión integral, sencilla y accesible, aplicable a la vida cotidiana, respetando el ritmo, la biología y la historia de cada persona.",
      ],
    },
    mainQuote: {
      type: String,
      default:
        "No venimos a arreglarnos, venimos a habitarnos plenamente.",
    },
    objetivoGeneral: {
      type: String,
      required: true,
      default:
        "Acompañar a las personas en un proceso de expansión integral que les permita habitar su cuerpo, expandir sus relaciones, nuclear su conciencia y movilizar su energía, generando bienestar, coherencia interna y disfrute real en su diario vivir.",
    },
    objetivosEspecificos: {
      type: [String],
      required: true,
      default: [
        "Fortalecer la presencia y la autopercepción corporal",
        "Expandir la biología a través del movimiento consciente",
        "Reconocer, completar y transformar la experiencia emocional",
        "Desarrollar una conciencia que aliente y sostenga la vida",
        "Aprender a movilizar la energía para el bienestar cotidiano",
        "Integrar lo vivido como un estilo de vida consciente",
      ],
    },
    principios: {
      type: [String],
      required: true,
      default: [
        "Enfoque vivencial y práctico (aprender haciendo y sintiendo)",
        "Centralidad en el ser, no en el deber ser ni en el tener",
        "Integración de cuerpo, emoción, conciencia y energía",
        "Bienestar sostenido desde la autosuficiencia",
        "Placer, goce y disfrute como estados naturales del vivir",
        "Acompañamiento cercano, humano y consciente",
      ],
    },
    duracion: {
      months: {
        type: Number,
        default: 4,
      },
      weeks: {
        type: Number,
        default: 16,
      },
    },
    formato: {
      type: [String],
      default: ["Presencial", "Virtual"],
    },
    modalidad: {
      type: [String],
      default: ["Individual", "Grupal"],
    },
    sesiones: {
      frequency: {
        type: String,
        default: "1 sesión semanal",
      },
      duration: {
        type: String,
        default: "90 a 120 minutos",
      },
    },
    practicaPersonal: {
      type: String,
      default: "10-20 minutos diarios",
    },
    modulos: {
      type: [ModuloSchema],
      required: true,
      default: [],
    },
    elementosTransversales: {
      type: [String],
      default: [
        "Prácticas simples y aplicables",
        "Acompañamiento humano y cercano",
        "Comunidad consciente como sostén",
        "Predominio de la experiencia sobre la teoría",
        "Adaptabilidad a distintos formatos",
        "Respeto por la biología y el ritmo personal",
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const ProgramaIntegralModel = mongoose.model<IProgramaIntegral>(
  "ProgramaIntegral",
  ProgramaIntegralSchema
);
