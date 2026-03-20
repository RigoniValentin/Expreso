import { Request, Response } from "express";
import { ProgramaIntegralModel } from "../models/ProgramaIntegral";

// Obtener la información del Programa Integral
export const getProgramaIntegral = async (req: Request, res: Response) => {
  try {
    // Buscar el programa activo
    let programa = await ProgramaIntegralModel.findOne({ isActive: true });

    // Si no existe, crear uno con la información por defecto
    if (!programa) {
      programa = await ProgramaIntegralModel.create({
        modulos: [
          {
            number: 1,
            weeks: "Semanas 1-4",
            title: "Habitar el Ser: Presencia, Cuerpo y Autoconciencia",
            purpose:
              "Establecer una base interna sólida a través de la presencia, la conexión corporal y la auto observación consciente.",
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
            expectedResult:
              "Mayor presencia, calma, claridad interna y sensación de habitar el propio cuerpo como hogar.",
          },
          {
            number: 2,
            weeks: "Semanas 5-8",
            title: "Biología Viva y Emoción Consciente",
            purpose:
              "Expandir la biología y transformar la relación con las emociones, completando el cuerpo de Biología y el cuerpo de Emociones.",
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
            expectedResult:
              "Incremento de la energía vital, mayor fluidez en las relaciones, capacidad de habitar el placer sin culpa y liberación de emociones de baja percepción.",
          },
          {
            number: 3,
            weeks: "Semanas 9-12",
            title: "Conciencia Nucleada y Energía Transformadora",
            purpose:
              "Ampliar la conciencia más allá del condicionamiento y movilizar la energía para sostener el bienestar.",
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
            expectedResult:
              "Sensación de expansión, coherencia interna, goce consciente y mayor conexión con la vida en los distintos ambientes.",
          },
          {
            number: 4,
            weeks: "Semanas 13-16",
            title: "Integración, Disfrute y Vida Consciente",
            purpose:
              "Integrar lo vivido y convertirlo en un estilo de vida basado en bienestar, disfrute, coherencia y contribución.",
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
            expectedResult:
              "Capacidad de sostener bienestar, placer y goce de forma simple, real y cotidiana.",
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      data: programa,
    });
  } catch (error) {
    console.error("Error al obtener programa integral:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la información del programa",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Actualizar la información del Programa Integral (admin)
export const updateProgramaIntegral = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const programa = await ProgramaIntegralModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!programa) {
      return res.status(404).json({
        success: false,
        message: "Programa no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: programa,
      message: "Programa actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar programa integral:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el programa",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Crear un nuevo Programa Integral (admin)
export const createProgramaIntegral = async (req: Request, res: Response) => {
  try {
    const programaData = req.body;

    // Desactivar otros programas activos
    await ProgramaIntegralModel.updateMany(
      { isActive: true },
      { isActive: false }
    );

    const newPrograma = await ProgramaIntegralModel.create(programaData);

    res.status(201).json({
      success: true,
      data: newPrograma,
      message: "Programa creado exitosamente",
    });
  } catch (error) {
    console.error("Error al crear programa integral:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear el programa",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Eliminar un Programa Integral (admin)
export const deleteProgramaIntegral = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const programa = await ProgramaIntegralModel.findByIdAndDelete(id);

    if (!programa) {
      return res.status(404).json({
        success: false,
        message: "Programa no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      message: "Programa eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar programa integral:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el programa",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
