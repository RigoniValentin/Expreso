import { Request, Response } from "express";
import subscriptionService from "../services/subscriptionService";
import courseService from "../services/courseService";
import progressService from "../services/progressService";
import liveClassService from "../services/liveClassService";
import communityService from "../services/communityService";
import contentRepository from "../repositories/contentRepository";
import testimonialRepository from "../repositories/testimonialRepository";

// ============ SUBSCRIPTION CONTROLLERS ============
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const subscription = await subscriptionService.createSubscription(req.body);
    res.status(201).json(subscription);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const subscription = await subscriptionService.getSubscriptionByUserId(
      userId
    );
    res.json(subscription);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const pauseSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.pauseSubscription(id);
    res.json(subscription);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.cancelSubscription(id);
    res.json(subscription);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ============ COURSE CONTROLLERS ============
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courses = await courseService.getAllCourses();
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourseBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = (req as any).user?._id;

    const subscription = userId
      ? await subscriptionService.getSubscriptionByUserId(userId)
      : null;
    const currentWeek = subscription?.progress?.currentWeek;

    const course = await courseService.getCourseWithModules(slug, currentWeek);
    res.json(course);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getCoursesByArea = async (req: Request, res: Response) => {
  try {
    const { area } = req.params;
    const courses = await courseService.getCoursesByArea(area);
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ============ PROGRESS CONTROLLERS ============
export const getMyProgress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const progress = await progressService.getProgressByUserId(userId);
    res.json(progress);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const markContentCompleted = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { contentId, timeSpent } = req.body;
    const progress = await progressService.markContentCompleted(
      userId,
      contentId,
      timeSpent
    );
    res.json(progress);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const addJournalEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const entry = await progressService.addJournalEntry(userId, req.body);
    res.status(201).json(entry);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getJournalEntries = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { area, limit } = req.query;
    const entries = await progressService.getJournalEntries(
      userId,
      area as string,
      limit ? parseInt(limit as string) : undefined
    );
    res.json(entries);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const stats = await progressService.getDashboardStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ============ CONTENT CONTROLLERS ============
export const getDailyContent = async (req: Request, res: Response) => {
  try {
    const content = await contentRepository.findDailyContent();
    res.json(content);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getContentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await contentRepository.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Contenido no encontrado" });
    }
    res.json(content);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

// ============ LIVE CLASS CONTROLLERS ============
export const getUpcomingLiveClasses = async (req: Request, res: Response) => {
  try {
    const classes = await liveClassService.getUpcomingClasses();
    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const registerForLiveClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const liveClass = await liveClassService.registerUserForClass(id, userId);
    res.json(liveClass);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const unregisterFromLiveClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const liveClass = await liveClassService.unregisterUserFromClass(
      id,
      userId
    );
    res.json(liveClass);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyLiveClasses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const classes = await liveClassService.getUserUpcomingClasses(userId);
    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ============ COMMUNITY CONTROLLERS ============
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    const posts = await communityService.getAllPosts(userId);
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const post = await communityService.createPost({ ...req.body, userId });
    res.status(201).json(post);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const likePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const post = await communityService.likePost(id, userId);
    res.json(post);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    const post = await communityService.addComment(id, {
      userId,
      content: req.body.content,
    });
    res.status(201).json(post);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ============ TESTIMONIAL CONTROLLERS ============
export const getTestimonials = async (req: Request, res: Response) => {
  try {
    const { featured, area } = req.query;

    let testimonials;
    if (featured === "true") {
      testimonials = await testimonialRepository.findFeatured();
    } else if (area) {
      testimonials = await testimonialRepository.findByArea(area as string);
    } else {
      testimonials = await testimonialRepository.findApproved();
    }

    res.json(testimonials);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?._id;
    const testimonial = await testimonialRepository.create({
      ...req.body,
      userId,
    });
    res.status(201).json(testimonial);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
