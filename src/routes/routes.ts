import { NextFunction, Request, Response, Router } from "express";
import {
  findUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersSubscriptionInfo,
  updateUserCapacitations,
  updateUserCapacitationsByEmail,
} from "@controllers/userController";
import {
  findRoles,
  findRolesById,
  createRoles,
  updateRoles,
  deleteRoles,
} from "@controllers/rolesController";
import {
  loginUser,
  refreshToken,
  registerUser,
  forgotPassword,
  resetPassword,
} from "@controllers/auth/authControllers";
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
} from "@controllers/profileController";
import { getPermissions, verifyToken } from "@middlewares/auth";
import { checkRoles } from "@middlewares/roles";
import { checkSubscription } from "@middlewares/checkSubscription";
import {
  answerQuestionVideo1,
  answerQuestionVideo2,
  createQuestion,
  findQuestions,
  rejectQuestion,
} from "@controllers/questionController";
import {
  createVideo,
  deleteVideo,
  deleteVideoByUrl,
  findVideoById,
  findVideos,
  updateVideo,
  updateVideoByCombo,
} from "@controllers/videosController";
import {
  createTraining,
  updateCupos,
  getCupos,
  getTrainings,
} from "@controllers/trainingController";
import {
  createSubscription,
  getMySubscription,
  pauseSubscription,
  cancelSubscription,
  getAllCourses,
  getCourseBySlug,
  getCoursesByArea,
  createCourse,
  getMyProgress,
  markContentCompleted,
  addJournalEntry,
  getJournalEntries,
  getDashboard,
  getDailyContent,
  getContentById,
  getUpcomingLiveClasses,
  registerForLiveClass,
  unregisterFromLiveClass,
  getMyLiveClasses,
  getAllPosts,
  createPost,
  likePost,
  addComment,
  getTestimonials,
  createTestimonial,
} from "@controllers/nehilakController";
import {
  createPayPalOrder,
  capturePayPalOrder,
} from "@controllers/paymentController";
import { sendResetPasswordEmail } from "@services/emailService";
import { getExamples, saveExamples } from "@controllers/exampleController";
import { getChatHistory, deleteChatHistory } from "@controllers/chatController";
import { get } from "mongoose";
import programaIntegralRoutes from "./programaIntegralRoutes";
import blogRoutes from "./blogRoutes";
import uploadRoutes from "./uploadRoutes";
import testimonialRoutes from "./testimonialRoutes";
import pibRoutes from "./pibRoutes";
import eabRoutes from "./eabRoutes";
import transferPaymentRoutes from "./transferPaymentRoutes";
import siteConfigRoutes from "./siteConfigRoutes";

const router: any = Router();

export default () => {
  router.get("/health", (req: Request, res: Response) => {
    res.send("Api is healthy");
  });

  //#region Auth Routes
  router.post("/auth/register", registerUser);
  router.post("/auth/login", loginUser);
  router.get(
    "/auth/refresh",
    verifyToken,
    (req: Request, res: Response, next: NextFunction) => {
      res.set("Cache-Control", "no-store");
      next();
    },
    refreshToken
  );
  router.post("/auth/forgot-password", forgotPassword);
  router.post("/auth/reset-password", resetPassword);
  //#endregion

  //#region Profile Routes
  router.get("/profile", verifyToken, getProfile);
  router.put("/profile", verifyToken, updateProfile);
  router.put("/profile/avatar", verifyToken, updateAvatar);
  router.put("/profile/password", verifyToken, changePassword);
  //#endregion

  //#region User Routes
  router.get("/users", verifyToken, getPermissions, findUsers);
  router.get(
    "/users/subscription-info",
    verifyToken,
    getPermissions,
    getUsersSubscriptionInfo
  );
  router.get("/users/:id", verifyToken, getPermissions, findUserById);
  router.post("/users", verifyToken, getPermissions, checkRoles, createUser);
  router.put("/users/:id", verifyToken, getPermissions, updateUser);
  router.put(
    "/users/:id/capacitations",
    verifyToken,
    getPermissions,
    updateUserCapacitations
  );
  router.put(
    "/users/email/:email/capacitations",
    verifyToken,
    getPermissions,
    updateUserCapacitationsByEmail
  );
  router.delete("/users/:id", verifyToken, getPermissions, deleteUser);
  //#endregion

  //#region Roles Routes
  router.get("/roles", verifyToken, getPermissions, findRoles);
  router.get("/roles/:id", verifyToken, getPermissions, findRolesById);
  router.post("/roles", verifyToken, getPermissions, createRoles);
  router.put("/roles/:id", verifyToken, getPermissions, updateRoles);
  router.delete("/roles/:id", verifyToken, getPermissions, deleteRoles);
  //#endregion

  //#region Question Routes
  router.post(
    "/questions",
    verifyToken,
    checkSubscription,
    getPermissions,
    createQuestion
  );
  router.get(
    "/questions",
    verifyToken,
    checkSubscription,
    getPermissions,
    findQuestions
  );
  router.put(
    "/questions/:id/answer/1",
    verifyToken,
    checkSubscription,
    getPermissions,
    answerQuestionVideo1
  );
  router.put(
    "/questions/:id/answer/2",
    verifyToken,
    checkSubscription,
    getPermissions,
    answerQuestionVideo2
  );
  router.put("/questions/:id/reject", verifyToken, rejectQuestion);
  //#endregion

  //#region Videos Routes
  router.post(
    "/videos",
    verifyToken,
    checkSubscription,
    getPermissions,
    checkRoles,
    createVideo
  );
  router.get("/videos", findVideos);
  router.get("/videos/:id", findVideoById);
  router.put(
    "/videos/:id",
    verifyToken,
    getPermissions,
    checkRoles,
    updateVideo
  );
  router.put(
    "/videos-by-combo",
    verifyToken,
    getPermissions,
    checkRoles,
    updateVideoByCombo
  );
  router.delete(
    "/videos/:id",
    verifyToken,
    getPermissions,
    checkRoles,
    deleteVideo
  );
  router.delete(
    "/videos",
    verifyToken,
    getPermissions,
    checkRoles,
    deleteVideoByUrl
  );
  //#endregion

  // #region Trainings Routes
  router.post("/trainings", verifyToken, getPermissions, createTraining);
  router.put("/trainings/:id", verifyToken, getPermissions, updateCupos);
  router.get("/trainings/:id", verifyToken, getCupos);
  router.get("/trainings", getTrainings);
  // #endregion

  // #region Nehilak Platform Routes

  // Subscription Routes
  router.post("/nehilak/subscriptions", verifyToken, createSubscription);
  router.get("/nehilak/subscriptions/me", verifyToken, getMySubscription);
  router.put(
    "/nehilak/subscriptions/:id/pause",
    verifyToken,
    pauseSubscription
  );
  router.put(
    "/nehilak/subscriptions/:id/cancel",
    verifyToken,
    cancelSubscription
  );

  // Course Routes
  router.get("/nehilak/courses", getAllCourses);
  router.get("/nehilak/courses/area/:area", getCoursesByArea);
  router.get("/nehilak/courses/:slug", verifyToken, getCourseBySlug);
  router.post(
    "/nehilak/courses",
    verifyToken,
    getPermissions,
    checkRoles,
    createCourse
  );

  // Progress Routes
  router.get("/nehilak/progress/me", verifyToken, getMyProgress);
  router.post("/nehilak/progress/complete", verifyToken, markContentCompleted);
  router.post("/nehilak/progress/journal", verifyToken, addJournalEntry);
  router.get("/nehilak/progress/journal", verifyToken, getJournalEntries);
  router.get("/nehilak/dashboard", verifyToken, getDashboard);

  // Content Routes
  router.get("/nehilak/content/daily", getDailyContent);
  router.get("/nehilak/content/:id", verifyToken, getContentById);

  // Live Class Routes
  router.get(
    "/nehilak/live-classes/upcoming",
    verifyToken,
    getUpcomingLiveClasses
  );
  router.get("/nehilak/live-classes/mine", verifyToken, getMyLiveClasses);
  router.post(
    "/nehilak/live-classes/:id/register",
    verifyToken,
    registerForLiveClass
  );
  router.delete(
    "/nehilak/live-classes/:id/register",
    verifyToken,
    unregisterFromLiveClass
  );

  // Community Routes
  router.get("/nehilak/community/posts", getAllPosts);
  router.post("/nehilak/community/posts", verifyToken, createPost);
  router.post("/nehilak/community/posts/:id/like", verifyToken, likePost);
  router.post("/nehilak/community/posts/:id/comments", verifyToken, addComment);

  // Testimonial Routes
  router.get("/nehilak/testimonials", getTestimonials);
  router.post("/nehilak/testimonials", verifyToken, createTestimonial);

  // Programa Integral Routes
  router.use("/nehilak/programa-integral", programaIntegralRoutes);

  // Blog Routes
  router.use("/blog", blogRoutes);

  // Upload Routes
  router.use("/upload", uploadRoutes);

  // Testimonial Routes
  router.use("/testimonials", testimonialRoutes);

  // PIB (Programa Integral de Bienestar) Routes
  router.use("/pib", pibRoutes);

  // EAB (Experiencias de Aprendizaje para el Bienestar) Routes
  router.use("/eab", eabRoutes);

  // Transfer Payments (Transferencias y Pago Móvil) Routes
  router.use("/transfer-payments", transferPaymentRoutes);

  // Site Config Routes
  router.use("/site-config", siteConfigRoutes);

  // #endregion

  // #region PayPal Routes
  router.post("/paypal/create-order", verifyToken, createPayPalOrder);
  router.get("/paypal/capture-order", capturePayPalOrder);
  // #endregion

  // #region Email Routes
  // Route para enviar email a través del helper
  router.post("/send-email", async (req: Request, res: Response) => {
    const { to, subject, text } = req.body;
    try {
      await sendResetPasswordEmail(to, text);
      res.status(200).send(`Email sent to: ${to}`);
    } catch (error) {
      res.status(500).send("Error sending email");
    }
  });
  // #endregion

  // #region Example Routes
  router.get("/examples", getExamples);
  router.put("/examples", saveExamples);
  // #endregion

  // #region Chat Routes
  // Obtener historial (para todos los usuarios)
  router.get("/history", verifyToken, getChatHistory);

  // Eliminar historial (acceso restringido, por ejemplo admin)
  router.delete("/history", verifyToken, getPermissions, deleteChatHistory);
  // #endregion

  return router;
};
