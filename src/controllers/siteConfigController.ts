import { Request, Response } from "express";
import { SiteConfigModel } from "../models/SiteConfig";

// Obtener configuración del sitio (público)
export const getSiteConfig = async (_req: Request, res: Response) => {
  try {
    let config = await SiteConfigModel.findOne();
    if (!config) {
      config = await SiteConfigModel.create({});
    }
    res.status(200).json(config);
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    res.status(500).json({ message: "Error al obtener configuración" });
  }
};

// Actualizar videos de pilares (admin)
export const updatePillarVideos = async (req: Request, res: Response) => {
  try {
    const { pillarVideos } = req.body;

    if (!Array.isArray(pillarVideos)) {
      return res.status(400).json({ message: "pillarVideos debe ser un array" });
    }

    let config = await SiteConfigModel.findOne();
    if (!config) {
      config = await SiteConfigModel.create({ pillarVideos });
    } else {
      config.pillarVideos = pillarVideos;
      await config.save();
    }

    res.status(200).json(config);
  } catch (error) {
    console.error("Error al actualizar videos de pilares:", error);
    res.status(500).json({ message: "Error al actualizar videos de pilares" });
  }
};

// Actualizar videos de productos (admin)
export const updateProductVideos = async (req: Request, res: Response) => {
  try {
    const { productVideos } = req.body;

    if (!Array.isArray(productVideos)) {
      return res.status(400).json({ message: "productVideos debe ser un array" });
    }

    let config = await SiteConfigModel.findOne();
    if (!config) {
      config = await SiteConfigModel.create({ productVideos });
    } else {
      config.productVideos = productVideos;
      await config.save();
    }

    res.status(200).json(config);
  } catch (error) {
    console.error("Error al actualizar videos de productos:", error);
    res.status(500).json({ message: "Error al actualizar videos de productos" });
  }
};
