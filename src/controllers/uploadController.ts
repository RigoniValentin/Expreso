import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { getSingleParam } from "@utils/requestParams";

// Tipos para multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configuración de directorios
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
const BLOG_IMAGES_DIR = path.join(UPLOAD_DIR, "blog");

// Crear directorios si no existen
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(BLOG_IMAGES_DIR)) {
  fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
}

// Función para generar nombre único
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(originalName).toLowerCase();
  return `${timestamp}-${random}${ext === ".jpeg" ? ".jpg" : ext || ".jpg"}`;
};

// Comprimir y guardar imagen (usa sharp si está disponible, sino guarda directamente)
export const uploadBlogImage = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No se proporcionó ninguna imagen",
      });
      return;
    }

    const fileName = generateFileName(req.file.originalname);
    const outputPath = path.join(BLOG_IMAGES_DIR, fileName);
    const imageBuffer = req.file.buffer;
    const originalSize = req.file.size;

    try {
      // Intentar usar sharp para compresión
      const sharp = require("sharp");
      const metadata = await sharp(imageBuffer).metadata();

      // Determinar dimensiones máximas
      const maxWidth = 1920;

      // Configuración de compresión según el formato
      let processedImage = sharp(imageBuffer);

      // Redimensionar si es necesario
      if (metadata.width && metadata.width > maxWidth) {
        processedImage = processedImage.resize(maxWidth, undefined, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Aplicar compresión
      const outputFormat = metadata.format === "png" ? "png" : "jpeg";

      if (outputFormat === "jpeg") {
        processedImage = processedImage.jpeg({
          quality: 85,
          mozjpeg: true,
        });
      } else if (outputFormat === "png") {
        processedImage = processedImage.png({
          quality: 85,
          compressionLevel: 9,
        });
      }

      // Guardar imagen procesada
      await processedImage.toFile(outputPath);

      // Obtener info del archivo resultante
      const stats = fs.statSync(outputPath);
      const compressedSize = stats.size;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      console.log(`Imagen comprimida: ${originalSize} -> ${compressedSize} bytes (${compressionRatio}% reducción)`);

      res.status(200).json({
        success: true,
        data: {
          url: `/uploads/blog/${fileName}`,
          fileName,
          originalSize,
          compressedSize,
          compressionRatio: `${compressionRatio}%`,
        },
        message: "Imagen subida y comprimida exitosamente",
      });
    } catch (sharpError) {
      // Si sharp no está disponible, guardar directamente
      console.log("Sharp no disponible, guardando imagen sin comprimir");
      fs.writeFileSync(outputPath, imageBuffer);

      res.status(200).json({
        success: true,
        data: {
          url: `/uploads/blog/${fileName}`,
          fileName,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: "0%",
        },
        message: "Imagen subida exitosamente (sin compresión)",
      });
    }
  } catch (error) {
    console.error("Error al subir imagen:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la imagen",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Subir imagen de portada con tamaños específicos
export const uploadCoverImage = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No se proporcionó ninguna imagen",
      });
      return;
    }

    const baseName = generateFileName(req.file.originalname).replace(/\.[^.]+$/, "");
    const imageBuffer = req.file.buffer;
    const originalSize = req.file.size;

    try {
      // Intentar usar sharp para compresión
      const sharp = require("sharp");

      // Generar diferentes tamaños para diferentes usos
      const sizes = [
        { name: "full", width: 1920, height: 1080 },
        { name: "medium", width: 800, height: 450 },
        { name: "thumb", width: 400, height: 225 },
      ];

      const results: Record<string, string> = {};

      for (const size of sizes) {
        const outputFileName = `${baseName}-${size.name}.jpg`;
        const outputPath = path.join(BLOG_IMAGES_DIR, outputFileName);

        await sharp(imageBuffer)
          .resize(size.width, size.height, {
            fit: "cover",
            position: "center",
          })
          .jpeg({
            quality: size.name === "full" ? 90 : 85,
            mozjpeg: true,
          })
          .toFile(outputPath);

        results[size.name] = `/uploads/blog/${outputFileName}`;
      }

      // También guardar versión WebP
      const webpFileName = `${baseName}-full.webp`;
      const webpPath = path.join(BLOG_IMAGES_DIR, webpFileName);

      await sharp(imageBuffer)
        .resize(1920, 1080, {
          fit: "cover",
          position: "center",
        })
        .webp({
          quality: 85,
        })
        .toFile(webpPath);

      results.webp = `/uploads/blog/${webpFileName}`;

      const fullStats = fs.statSync(path.join(BLOG_IMAGES_DIR, `${baseName}-full.jpg`));

      res.status(200).json({
        success: true,
        data: {
          urls: results,
          primaryUrl: results.full,
          originalSize,
          compressedSize: fullStats.size,
        },
        message: "Imagen de portada procesada exitosamente",
      });
    } catch (sharpError) {
      // Si sharp no está disponible, guardar directamente
      console.log("Sharp no disponible, guardando imagen sin comprimir");
      const outputFileName = `${baseName}.jpg`;
      const outputPath = path.join(BLOG_IMAGES_DIR, outputFileName);
      fs.writeFileSync(outputPath, imageBuffer);

      res.status(200).json({
        success: true,
        data: {
          urls: { full: `/uploads/blog/${outputFileName}` },
          primaryUrl: `/uploads/blog/${outputFileName}`,
          originalSize,
          compressedSize: originalSize,
        },
        message: "Imagen subida exitosamente (sin compresión)",
      });
    }
  } catch (error) {
    console.error("Error al subir imagen de portada:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar la imagen de portada",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Eliminar imagen
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileName = getSingleParam(req.params.fileName);

    if (!fileName) {
      res.status(400).json({
        success: false,
        message: "Nombre de archivo requerido",
      });
      return;
    }

    // Seguridad: verificar que el archivo esté en el directorio correcto
    const filePath = path.join(BLOG_IMAGES_DIR, path.basename(fileName));

    if (!filePath.startsWith(BLOG_IMAGES_DIR)) {
      res.status(403).json({
        success: false,
        message: "Acceso denegado",
      });
      return;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      // También eliminar variantes si existen
      const baseName = fileName.replace(/(-full|-medium|-thumb)?\.[^.]+$/, "");
      const variants = ["full.jpg", "medium.jpg", "thumb.jpg", "full.webp"];

      for (const variant of variants) {
        const variantPath = path.join(BLOG_IMAGES_DIR, `${baseName}-${variant}`);
        if (fs.existsSync(variantPath)) {
          fs.unlinkSync(variantPath);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "Imagen eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar la imagen",
    });
  }
};
