/**
 * SEED DATA para ExpresoMiArte Nehilak
 *
 * Este archivo contiene datos de ejemplo para poblar la base de datos
 * y permitir una demostración completa de la plataforma.
 *
 * Para ejecutar: node src/seed/seedData.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "../models/Course";
import Module from "../models/Module";
import Content from "../models/Content";
import Testimonial from "../models/Testimonial";
import LiveClass from "../models/LiveClass";

dotenv.config();

const seedData = async () => {
  try {
    // Conectar a MongoDB
    const mongoDbUrl = process.env.MONGODB_URL_STRING;
    if (!mongoDbUrl) {
      console.error("MONGODB_URL_STRING is not defined in your environment.");
      process.exit(1);
    }

    await mongoose.connect(mongoDbUrl);
    console.log("✅ Conectado a MongoDB");
    console.log("🌱 Iniciando seed de datos...");

    // Limpiar datos existentes
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Content.deleteMany({});
    await Testimonial.deleteMany({});
    await LiveClass.deleteMany({});

    // ============ CURSOS ============
    const courses = await Course.insertMany([
      // BIOLOGÍA
      {
        title: "Fundamentos de la Fuerza Vibracional",
        slug: "fundamentos-fuerza-vibracional",
        description:
          "Descubre cómo construir un cuerpo fuerte, resistente y flexible que te permita expresar tu arte en el mundo físico con plenitud y goce.",
        coverImage: "/assets/courses/biologia-1.jpg",
        area: "biology",
        level: "beginner",
        duration: 4,
        objectives: [
          "Desarrollar fuerza funcional para la vida diaria",
          "Aumentar resistencia física y energética",
          "Cultivar equilibrio y flexibilidad",
          "Integrar movimiento consciente en ambientes vibracionales",
        ],
        isPublished: true,
        isFree: false,
        order: 1,
      },
      {
        title: "Movimiento en Espacios Vibracionales",
        slug: "movimiento-espacios-vibracionales",
        description:
          "Aprende a moverte con gracia y poder en diferentes ambientes energéticos, adaptando tu biología a las frecuencias del entorno.",
        coverImage: "/assets/courses/biologia-2.jpg",
        area: "biology",
        level: "intermediate",
        duration: 4,
        objectives: [
          "Adaptar el movimiento a diferentes frecuencias",
          "Reconocer señales biológicas en ambientes vibracionales",
          "Desarrollar resistencia energética",
          "Integrar práctica física con conciencia vibracional",
        ],
        isPublished: true,
        isFree: false,
        order: 2,
      },

      // RELACIONES
      {
        title: "Relaciones desde el Amor Propio",
        slug: "relaciones-amor-propio",
        description:
          "Construye vínculos profesionales y personales desde el desborde de tu amor propio, creando relaciones que nutren y expanden tu ser.",
        coverImage: "/assets/courses/relaciones-1.jpg",
        area: "relationships",
        level: "beginner",
        duration: 4,
        objectives: [
          "Cultivar amor propio abundante",
          "Construir relaciones profesionales autosuficientes",
          "Disfrutar vínculos familiares y de pareja",
          "Completar emociones en las relaciones",
        ],
        isPublished: true,
        isFree: false,
        order: 1,
      },
      {
        title: "Goce en Familia y Pareja",
        slug: "goce-familia-pareja",
        description:
          "Transforma tus relaciones íntimas en espacios de expansión mutua, donde el placer y el goce sean el fundamento del vínculo.",
        coverImage: "/assets/courses/relaciones-2.jpg",
        area: "relationships",
        level: "intermediate",
        duration: 4,
        objectives: [
          "Crear espacios de goce en pareja",
          "Disfrutar vínculos familiares desde el placer",
          "Completar emociones en familia",
          "Expandir el amor en las relaciones íntimas",
        ],
        isPublished: true,
        isFree: false,
        order: 2,
      },

      // CONCIENCIA
      {
        title: "Pensamientos que Alientan",
        slug: "pensamientos-que-alientan",
        description:
          "Aprende a dirigir tu mente hacia pensamientos e imágenes que te impulsan hacia la abundancia y la expansión del ser.",
        coverImage: "/assets/courses/conciencia-1.jpg",
        area: "consciousness",
        level: "beginner",
        duration: 4,
        objectives: [
          "Identificar pensamientos limitantes",
          "Crear imágenes de futuros abundantes",
          "Cultivar presencia en el aquí y ahora",
          "Reducir recuerdos obsoletos",
        ],
        isPublished: true,
        isFree: true, // Este es gratuito para muestra
        order: 1,
      },
      {
        title: "Proyección de Futuros Abundantes",
        slug: "proyeccion-futuros-abundantes",
        description:
          "Domina el arte de proyectar futuros que te expanden, creando desde la conciencia la realidad que deseas vivir.",
        coverImage: "/assets/courses/conciencia-2.jpg",
        area: "consciousness",
        level: "intermediate",
        duration: 4,
        objectives: [
          "Proyectar futuros desde la abundancia",
          "Manifestar realidades deseadas",
          "Sostener visiones expandidas",
          "Integrar proyección con acción",
        ],
        isPublished: true,
        isFree: false,
        order: 2,
      },

      // ENERGÍA
      {
        title: "Fundamentos del Merkahaba",
        slug: "fundamentos-merkahaba",
        description:
          "Descubre y desarrolla tu merkahaba personal, el vehículo energético que te permite navegar dimensiones vibracionales.",
        coverImage: "/assets/courses/energia-1.jpg",
        area: "energy",
        level: "beginner",
        duration: 4,
        objectives: [
          "Comprender el concepto de merkahaba",
          "Activar tu vehículo energético",
          "Usar energía para expansión",
          "Transformación personal desde la energía",
        ],
        isPublished: true,
        isFree: false,
        order: 1,
      },
      {
        title: "Navegación Vibracional Avanzada",
        slug: "navegacion-vibracional",
        description:
          "Profundiza en el uso consciente de tu energía para expandirte a frecuencias más elevadas y sostener tu transformación.",
        coverImage: "/assets/courses/energia-2.jpg",
        area: "energy",
        level: "advanced",
        duration: 4,
        objectives: [
          "Navegar diferentes frecuencias",
          "Sostener estados expandidos",
          "Integrar merkahaba en la vida diaria",
          "Expandir capacidad energética",
        ],
        isPublished: true,
        isFree: false,
        order: 2,
      },
    ]);

    console.log(`✅ Creados ${courses.length} cursos`);

    // ============ TESTIMONIOS ============
    const testimonials = await Testimonial.insertMany([
      {
        authorName: "María Luz González",
        authorRole: "Arquitecta",
        content:
          "Nehilak transformó mi vida por completo. En 4 meses pasé de vivir en automático a crear mi realidad desde el goce y la abundancia. Cada día despierto agradecida por este viaje.",
        rating: 5,
        area: "general",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2024-11-15"),
      },
      {
        authorName: "Carlos Mendoza",
        authorRole: "Emprendedor",
        content:
          "El trabajo en Biología me dio una fuerza que nunca imaginé tener. Ahora puedo sostener mis proyectos con energía y vitalidad. Mi cuerpo es mi aliado en la creación.",
        rating: 5,
        area: "biology",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2024-11-20"),
      },
      {
        authorName: "Ana Sofía Ramírez",
        authorRole: "Terapeuta",
        content:
          "Las enseñanzas sobre Relaciones cambiaron mi forma de vincularme. Ahora mis relaciones son espacios de expansión y goce mutuo. El amor propio es mi fundamento.",
        rating: 5,
        area: "relationships",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2024-12-01"),
      },
      {
        authorName: "Diego Fernández",
        authorRole: "Profesor de Yoga",
        content:
          "La Conciencia expandida que desarrollé me permite proyectar futuros abundantes con claridad. Mi mente ahora es una herramienta de creación, no de limitación.",
        rating: 5,
        area: "consciousness",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2024-12-05"),
      },
      {
        authorName: "Valentina Torres",
        authorRole: "Diseñadora",
        content:
          "El trabajo con Energía y el merkahaba abrió puertas que ni sabía que existían. Navego frecuencias con facilidad y mi vida es pura expansión vibracional.",
        rating: 5,
        area: "energy",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2024-12-08"),
      },
    ]);

    console.log(`✅ Creados ${testimonials.length} testimonios`);

    // ============ CLASES EN VIVO ============
    const now = new Date();
    const liveClasses = await LiveClass.insertMany([
      {
        title: "Práctica Matinal de Fuerza Vibracional",
        description:
          "Comenzamos el día activando nuestra fuerza biológica con ejercicios que integran cuerpo y energía. Una práctica de 45 minutos para despertar tu potencial.",
        instructor: {
          name: "Laura Nehilak",
          bio: "Instructora certificada en movimiento vibracional con 10 años de experiencia",
          avatarUrl: "/assets/instructors/laura.jpg",
        },
        area: "biology",
        scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // En 2 días
        duration: 45,
        meetingUrl: "https://zoom.us/j/ejemplo1",
        isLive: false,
        maxParticipants: 50,
        registeredUsers: [],
        resources: [],
      },
      {
        title: "Círculo de Relaciones Conscientes",
        description:
          "Espacio de encuentro para compartir experiencias y profundizar en la construcción de vínculos desde el amor propio.",
        instructor: {
          name: "Roberto Amor",
          bio: "Facilitador de procesos relacionales y transformación emocional",
          avatarUrl: "/assets/instructors/roberto.jpg",
        },
        area: "relationships",
        scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // En 5 días
        duration: 60,
        meetingUrl: "https://zoom.us/j/ejemplo2",
        isLive: false,
        maxParticipants: 30,
        registeredUsers: [],
        resources: [],
      },
      {
        title: "Meditación de Proyección Abundante",
        description:
          "Guía meditativa para proyectar futuros desde la conciencia expandida y manifestar la realidad que deseas vivir.",
        instructor: {
          name: "Sofía Luz",
          bio: "Maestra en meditación y proyección consciente",
          avatarUrl: "/assets/instructors/sofia.jpg",
        },
        area: "consciousness",
        scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // En 7 días
        duration: 30,
        meetingUrl: "https://zoom.us/j/ejemplo3",
        isLive: false,
        maxParticipants: 100,
        registeredUsers: [],
        resources: [],
      },
      {
        title: "Activación del Merkahaba",
        description:
          "Práctica energética para activar y fortalecer tu vehículo vibracional, expandiendo tu capacidad de navegar frecuencias elevadas.",
        instructor: {
          name: "Miguel Energía",
          bio: "Guía energético especializado en merkahaba y expansión vibracional",
          avatarUrl: "/assets/instructors/miguel.jpg",
        },
        area: "energy",
        scheduledDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // En 10 días
        duration: 90,
        meetingUrl: "https://zoom.us/j/ejemplo4",
        isLive: false,
        maxParticipants: 40,
        registeredUsers: [],
        resources: [],
      },
    ]);

    console.log(`✅ Creadas ${liveClasses.length} clases en vivo`);

    console.log("🎉 Seed de datos completado exitosamente!");
    console.log("\n📊 Resumen:");
    console.log(`   - Cursos: ${courses.length}`);
    console.log(`   - Testimonios: ${testimonials.length}`);
    console.log(`   - Clases en vivo: ${liveClasses.length}`);
    console.log("\n🚀 La plataforma está lista para demostración!");

    await mongoose.disconnect();
    console.log("✅ Desconectado de MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Ejecutar seed
seedData();
