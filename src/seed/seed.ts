/**
 * SEED COMPLETO para ExpresoMiArte Nehilak
 *
 * Crea:
 *  - Roles: admin, user, guest
 *  - Usuario admin para gestión
 *  - Datos de demostración (cursos, testimonios, clases, blog, PIB, etc.)
 *
 * Ejecutar: npm run seed
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

// Modelos
import { RolesModel } from "../models/Roles";
import { UserModel } from "../models/Users";
import Course from "../models/Course";
import Module from "../models/Module";
import Content from "../models/Content";
import Testimonial from "../models/Testimonial";
import LiveClass from "../models/LiveClass";
import { ExampleModel } from "../models/Example";
import { TrainingModel } from "../models/Training";
import { VideoModel } from "../models/Videos";
import { ProgramaIntegralModel } from "../models/ProgramaIntegral";

dotenv.config();

// ─── Permisos por rol ────────────────────────────────────────────────
const ADMIN_PERMISSIONS = [
  "admin_granted",
  "manage_users",
  "manage_roles",
  "manage_courses",
  "manage_content",
  "manage_blog",
  "manage_pib",
  "manage_trainings",
  "manage_videos",
  "manage_questions",
  "manage_testimonials",
  "manage_live_classes",
  "manage_subscriptions",
  "view_analytics",
];

const USER_PERMISSIONS = [
  "view_courses",
  "view_content",
  "view_blog",
  "view_pib",
  "view_videos",
  "submit_questions",
  "view_live_classes",
  "join_live_classes",
  "view_community",
  "post_community",
  "edit_profile",
];

const GUEST_PERMISSIONS = [
  "view_courses",
  "view_blog",
  "view_testimonials",
];

// ─── Datos del admin ─────────────────────────────────────────────────
const ADMIN_USER = {
  name: "Administrador Nehilak",
  username: "admin",
  email: "admin@nehilak.com",
  password: "Admin123!",
  nationality: "Argentina",
  locality: "Buenos Aires",
  age: 35,
  bio: "Administrador principal de la plataforma ExpresoMiArte Nehilak",
};

// =====================================================================
//  SEED PRINCIPAL
// =====================================================================
const seed = async () => {
  try {
    const mongoDbUrl = process.env.MONGODB_URL_STRING;
    if (!mongoDbUrl) {
      console.error("❌ MONGODB_URL_STRING no está definida en el .env");
      process.exit(1);
    }

    await mongoose.connect(mongoDbUrl);
    console.log("✅ Conectado a MongoDB");
    console.log("🌱 Iniciando seed completo...\n");

    // ─── 1. ROLES ──────────────────────────────────────────────────
    console.log("════════════════════════════════════════");
    console.log("  1. Creando Roles");
    console.log("════════════════════════════════════════");

    await RolesModel.deleteMany({});

    const [adminRole, userRole, guestRole] = await RolesModel.insertMany([
      { name: "admin", permissions: ADMIN_PERMISSIONS },
      { name: "user", permissions: USER_PERMISSIONS },
      { name: "guest", permissions: GUEST_PERMISSIONS },
    ]);

    console.log(`   ✅ Rol "admin"  → ${adminRole._id}`);
    console.log(`   ✅ Rol "user"   → ${userRole._id}`);
    console.log(`   ✅ Rol "guest"  → ${guestRole._id}`);

    // ─── 2. USUARIO ADMIN ──────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  2. Creando Usuario Admin");
    console.log("════════════════════════════════════════");

    await UserModel.deleteMany({ email: ADMIN_USER.email });

    const adminUser = await UserModel.create({
      ...ADMIN_USER,
      roles: [adminRole._id],
      permissions: ADMIN_PERMISSIONS,
      subscription: {
        transactionId: "SEED_ADMIN",
        paymentDate: new Date(),
        expirationDate: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 año
        ),
      },
    });

    console.log(`   ✅ Admin creado: ${adminUser.email}`);
    console.log(`   📧 Email:    ${ADMIN_USER.email}`);
    console.log(`   🔑 Password: ${ADMIN_USER.password}`);
    console.log(`   🆔 ID:       ${adminUser._id}`);

    // ─── 3. USUARIOS DEMO ──────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  3. Creando Usuarios Demo");
    console.log("════════════════════════════════════════");

    const demoUsers = [
      {
        name: "María Luz González",
        username: "marialuz",
        email: "maria@demo.com",
        password: "Demo1234!",
        nationality: "Argentina",
        locality: "Córdoba",
        age: 28,
        bio: "Apasionada por el bienestar integral y la expansión personal",
        roles: [userRole._id],
        permissions: USER_PERMISSIONS,
        subscription: {
          transactionId: "SEED_DEMO_1",
          paymentDate: new Date(),
          expirationDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        },
      },
      {
        name: "Carlos Mendoza",
        username: "carlosmendoza",
        email: "carlos@demo.com",
        password: "Demo1234!",
        nationality: "Colombia",
        locality: "Medellín",
        age: 34,
        bio: "Emprendedor buscando equilibrio entre cuerpo y mente",
        roles: [userRole._id],
        permissions: USER_PERMISSIONS,
        subscription: {
          transactionId: "SEED_DEMO_2",
          paymentDate: new Date(),
          expirationDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        },
      },
      {
        name: "Visitante Invitado",
        username: "invitado",
        email: "invitado@demo.com",
        password: "Guest1234!",
        nationality: "México",
        locality: "CDMX",
        age: 25,
        bio: "Explorando la plataforma",
        roles: [guestRole._id],
        permissions: GUEST_PERMISSIONS,
      },
    ];

    // Eliminar demos previos
    await UserModel.deleteMany({
      email: { $in: demoUsers.map((u) => u.email) },
    });

    for (const u of demoUsers) {
      const created = await UserModel.create(u);
      console.log(`   ✅ ${created.name} (${created.email})`);
    }

    // ─── 4. CURSOS ─────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  4. Creando Cursos Demo");
    console.log("════════════════════════════════════════");

    await Course.deleteMany({});
    await Module.deleteMany({});
    await Content.deleteMany({});

    const courses = await Course.insertMany([
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
        isFree: true,
        order: 1,
      },
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
    ]);

    console.log(`   ✅ ${courses.length} cursos creados`);

    // ─── 5. TESTIMONIOS ────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  5. Creando Testimonios");
    console.log("════════════════════════════════════════");

    await Testimonial.deleteMany({});

    const testimonials = await Testimonial.insertMany([
      {
        authorName: "María Luz González",
        authorRole: "Arquitecta",
        content:
          "Nehilak transformó mi vida por completo. En 4 meses pasé de vivir en automático a crear mi realidad desde el goce y la abundancia.",
        rating: 5,
        area: "general",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2025-11-15"),
      },
      {
        authorName: "Carlos Mendoza",
        authorRole: "Emprendedor",
        content:
          "El trabajo en Biología me dio una fuerza que nunca imaginé tener. Mi cuerpo es mi aliado en la creación.",
        rating: 5,
        area: "biology",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2025-11-20"),
      },
      {
        authorName: "Ana Sofía Ramírez",
        authorRole: "Terapeuta",
        content:
          "Las enseñanzas sobre Relaciones cambiaron mi forma de vincularme. Ahora mis relaciones son espacios de expansión y goce mutuo.",
        rating: 5,
        area: "relationships",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2025-12-01"),
      },
      {
        authorName: "Diego Fernández",
        authorRole: "Profesor de Yoga",
        content:
          "La Conciencia expandida que desarrollé me permite proyectar futuros abundantes con claridad.",
        rating: 5,
        area: "consciousness",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2025-12-05"),
      },
      {
        authorName: "Valentina Torres",
        authorRole: "Diseñadora",
        content:
          "El trabajo con Energía y el merkahaba abrió puertas que ni sabía que existían.",
        rating: 5,
        area: "energy",
        isApproved: true,
        isFeatured: true,
        publishDate: new Date("2025-12-08"),
      },
    ]);

    console.log(`   ✅ ${testimonials.length} testimonios creados`);

    // ─── 6. CLASES EN VIVO ─────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  6. Creando Clases en Vivo");
    console.log("════════════════════════════════════════");

    await LiveClass.deleteMany({});

    const now = new Date();
    const liveClasses = await LiveClass.insertMany([
      {
        title: "Práctica Matinal de Fuerza Vibracional",
        description:
          "Comenzamos el día activando nuestra fuerza biológica con ejercicios que integran cuerpo y energía.",
        instructor: {
          name: "Laura Nehilak",
          bio: "Instructora certificada en movimiento vibracional",
          avatarUrl: "/assets/instructors/laura.jpg",
        },
        area: "biology",
        scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        duration: 45,
        meetingUrl: "https://zoom.us/j/demo1",
        isLive: false,
        maxParticipants: 50,
        registeredUsers: [],
        resources: [],
      },
      {
        title: "Círculo de Relaciones Conscientes",
        description:
          "Espacio de encuentro para profundizar en la construcción de vínculos desde el amor propio.",
        instructor: {
          name: "Roberto Amor",
          bio: "Facilitador de procesos relacionales",
          avatarUrl: "/assets/instructors/roberto.jpg",
        },
        area: "relationships",
        scheduledDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        duration: 60,
        meetingUrl: "https://zoom.us/j/demo2",
        isLive: false,
        maxParticipants: 30,
        registeredUsers: [],
        resources: [],
      },
      {
        title: "Meditación de Proyección Abundante",
        description:
          "Guía meditativa para proyectar futuros desde la conciencia expandida.",
        instructor: {
          name: "Sofía Luz",
          bio: "Maestra en meditación y proyección consciente",
          avatarUrl: "/assets/instructors/sofia.jpg",
        },
        area: "consciousness",
        scheduledDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        duration: 30,
        meetingUrl: "https://zoom.us/j/demo3",
        isLive: false,
        maxParticipants: 100,
        registeredUsers: [],
        resources: [],
      },
      {
        title: "Activación del Merkahaba",
        description:
          "Práctica energética para activar y fortalecer tu vehículo vibracional.",
        instructor: {
          name: "Miguel Energía",
          bio: "Guía energético especializado en merkahaba",
          avatarUrl: "/assets/instructors/miguel.jpg",
        },
        area: "energy",
        scheduledDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        duration: 90,
        meetingUrl: "https://zoom.us/j/demo4",
        isLive: false,
        maxParticipants: 40,
        registeredUsers: [],
        resources: [],
      },
    ]);

    console.log(`   ✅ ${liveClasses.length} clases en vivo creadas`);

    // ─── 7. CAPACITACIONES ─────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  7. Creando Capacitaciones");
    console.log("════════════════════════════════════════");

    await TrainingModel.deleteMany({});

    const trainings = await TrainingModel.insertMany([
      { name: "Seres de Arte", cupos: 20 },
      { name: "THR - Terapia Humana Relacional", cupos: 15 },
      { name: "PHR - Proceso Humano Relacional", cupos: 15 },
    ]);

    console.log(`   ✅ ${trainings.length} capacitaciones creadas`);

    // ─── 8. VIDEOS DEMO ────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  8. Creando Videos Demo");
    console.log("════════════════════════════════════════");

    await VideoModel.deleteMany({});

    const videos = await VideoModel.insertMany([
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        category: "biologia",
        trainingType: "Seres de Arte",
        level: "principiante",
        muscleGroup: "cuerpo completo",
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        category: "conciencia",
        trainingType: "THR",
        level: "intermedio",
      },
      {
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        category: "emociones",
        trainingType: "PHR",
        level: "avanzado",
      },
    ]);

    console.log(`   ✅ ${videos.length} videos creados`);

    // ─── 9. EJEMPLOS ───────────────────────────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  9. Creando Ejemplos");
    console.log("════════════════════════════════════════");

    await ExampleModel.deleteMany({});

    const examples = await ExampleModel.insertMany([
      {
        category: "conciencia",
        examples: [
          "Meditación guiada de 15 minutos cada mañana",
          "Ejercicio de visualización de futuros abundantes",
          "Práctica de atención plena en actividades cotidianas",
        ],
      },
      {
        category: "biologia",
        examples: [
          "Rutina de fuerza funcional de 30 minutos",
          "Respiración consciente para activar el sistema nervioso",
          "Movimiento libre en espacios vibracionales",
        ],
      },
      {
        category: "emociones",
        examples: [
          "Diario de gratitud y reconocimiento emocional",
          "Ejercicio de completar emociones en familia",
          "Práctica de expresión emocional auténtica",
        ],
      },
    ]);

    console.log(`   ✅ ${examples.length} categorías de ejemplos creadas`);

    // ─── 10. PROGRAMA INTEGRAL EN BIENESTAR ────────────────────────
    console.log("\n════════════════════════════════════════");
    console.log("  10. Creando Programa Integral en Bienestar");
    console.log("════════════════════════════════════════");

    await ProgramaIntegralModel.deleteMany({});

    const pib = await ProgramaIntegralModel.create({
      title: "Programa Integral en Bienestar",
      subtitle:
        "Propuesta de acompañamiento vivencial para la expansión del ser humano",
      description: [
        "El Programa Integral en Bienestar (PIB) es una propuesta de acompañamiento humano, individual y grupal, diseñada para quienes desean habitar su vida con mayor conciencia, bienestar, placer, goce y disfrute.",
        "Este programa no busca corregir ni reparar al ser humano, sino recordar, activar y expandir su potencial natural.",
        "El PIB se desarrolla desde una visión integral, sencilla y accesible, aplicable a la vida cotidiana.",
      ],
      mainQuote: "No venimos a arreglarnos, venimos a habitarnos plenamente.",
      objetivoGeneral:
        "Acompañar a las personas en un proceso de expansión integral que les permita habitar su cuerpo, expandir sus relaciones, nuclear su conciencia y movilizar su energía.",
      objetivosEspecificos: [
        "Fortalecer la presencia y la autopercepción corporal",
        "Expandir la biología a través del movimiento consciente",
        "Reconocer, completar y transformar la experiencia emocional",
        "Desarrollar una conciencia que aliente y sostenga la vida",
        "Aprender a movilizar la energía para el bienestar cotidiano",
        "Integrar lo vivido como un estilo de vida consciente",
      ],
      principios: [
        "Enfoque vivencial y práctico",
        "Centralidad en el ser, no en el deber ser",
        "Integración de cuerpo, emoción, conciencia y energía",
        "Bienestar sostenido desde la autosuficiencia",
        "Placer, goce y disfrute como estados naturales del vivir",
        "Acompañamiento cercano, humano y consciente",
      ],
      duracion: { months: 4, weeks: 16 },
      formato: ["Presencial", "Virtual"],
      modalidad: ["Individual", "Grupal"],
      sesiones: {
        frequency: "1 sesión semanal",
        duration: "90 a 120 minutos",
      },
      practicaPersonal: "10-20 minutos diarios",
      modulos: [
        {
          number: 1,
          weeks: "Semanas 1-4",
          title: "Habitar el Cuerpo",
          purpose:
            "Reconectar con la presencia corporal y activar la biología como base del bienestar.",
          axes: [
            "Conciencia corporal",
            "Respiración consciente",
            "Movimiento funcional",
          ],
          practices: [
            "Ejercicios de autopercepción",
            "Rutinas de fuerza vibracional",
            "Prácticas de grounding",
          ],
          expectedResult:
            "Mayor presencia corporal y conexión con la biología natural.",
        },
        {
          number: 2,
          weeks: "Semanas 5-8",
          title: "Expandir las Relaciones",
          purpose:
            "Construir vínculos desde el amor propio y la autosuficiencia emocional.",
          axes: [
            "Amor propio",
            "Comunicación consciente",
            "Vínculos nutritivos",
          ],
          practices: [
            "Ejercicios de espejo relacional",
            "Práctica de escucha activa",
            "Diálogos de completación emocional",
          ],
          expectedResult:
            "Relaciones más nutritivas y capacidad de vincularse desde la abundancia.",
        },
        {
          number: 3,
          weeks: "Semanas 9-12",
          title: "Nuclear la Conciencia",
          purpose:
            "Dirigir la mente hacia pensamientos que alientan y proyectar futuros abundantes.",
          axes: [
            "Gestión de pensamientos",
            "Proyección consciente",
            "Presencia en el aquí y ahora",
          ],
          practices: [
            "Meditaciones de proyección",
            "Ejercicios de visualización",
            "Práctica de mindfulness",
          ],
          expectedResult:
            "Mente orientada hacia la expansión, reducción de pensamientos limitantes.",
        },
        {
          number: 4,
          weeks: "Semanas 13-16",
          title: "Movilizar la Energía",
          purpose:
            "Activar el merkahaba personal y navegar frecuencias vibracionales elevadas.",
          axes: [
            "Activación energética",
            "Merkahaba",
            "Integración vibracional",
          ],
          practices: [
            "Activación del merkahaba",
            "Prácticas de expansión energética",
            "Integración final del proceso",
          ],
          expectedResult:
            "Capacidad de movilizar la energía de forma consciente y sostenida.",
        },
      ],
      elementosTransversales: [
        "Prácticas simples y aplicables",
        "Acompañamiento humano y cercano",
        "Comunidad consciente como sostén",
        "Predominio de la experiencia sobre la teoría",
        "Adaptabilidad a distintos formatos",
        "Respeto por la biología y el ritmo personal",
      ],
      isActive: true,
    });

    console.log(`   ✅ PIB creado: "${pib.title}"`);

    // ═════════════════════════════════════════════════════════════════
    //  RESUMEN FINAL
    // ═════════════════════════════════════════════════════════════════
    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════╗");
    console.log("║          🎉 SEED COMPLETADO EXITOSAMENTE           ║");
    console.log("╠══════════════════════════════════════════════════════╣");
    console.log("║                                                      ║");
    console.log("║  📋 ROLES CREADOS:                                   ║");
    console.log("║     • admin  (permisos completos)                    ║");
    console.log("║     • user   (acceso a contenido)                    ║");
    console.log("║     • guest  (solo lectura)                          ║");
    console.log("║                                                      ║");
    console.log("║  👤 USUARIO ADMIN:                                   ║");
    console.log(`║     📧 Email:    ${ADMIN_USER.email}            ║`);
    console.log(`║     🔑 Password: ${ADMIN_USER.password}                    ║`);
    console.log("║                                                      ║");
    console.log("║  👥 USUARIOS DEMO:                                   ║");
    console.log("║     • maria@demo.com    / Demo1234! (user)           ║");
    console.log("║     • carlos@demo.com   / Demo1234! (user)           ║");
    console.log("║     • invitado@demo.com / Guest1234! (guest)         ║");
    console.log("║                                                      ║");
    console.log("║  📊 DATOS DE DEMO:                                   ║");
    console.log(`║     • ${courses.length} Cursos                                    ║`);
    console.log(`║     • ${testimonials.length} Testimonios                              ║`);
    console.log(`║     • ${liveClasses.length} Clases en vivo                            ║`);
    console.log(`║     • ${trainings.length} Capacitaciones                            ║`);
    console.log(`║     • ${videos.length} Videos                                     ║`);
    console.log(`║     • ${examples.length} Categorías de ejemplos                   ║`);
    console.log("║     • 1 Programa Integral en Bienestar               ║");
    console.log("║                                                      ║");
    console.log("╚══════════════════════════════════════════════════════╝");

    await mongoose.disconnect();
    console.log("\n✅ Desconectado de MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
