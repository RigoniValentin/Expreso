import mongoose from "mongoose";

// ============ SUBSCRIPTION TYPES ============
export interface ISubscriptionCreate {
  userId: string;
  plan: "nehilak_4_months";
  paymentInfo: {
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
  };
}

export interface ISubscriptionUpdate {
  status?: "active" | "paused" | "cancelled" | "completed";
  currentWeek?: number;
}

export interface ISubscriptionResponse {
  _id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date;
  progress: {
    currentWeek: number;
    completedModules: string[];
    lastActivity: Date;
  };
  daysRemaining: number;
  weekProgress: number;
}

// ============ COURSE TYPES ============
export interface ICourseCreate {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  area: "biology" | "relationships" | "consciousness" | "energy";
  level?: "beginner" | "intermediate" | "advanced";
  duration: number;
  objectives: string[];
  isFree?: boolean;
  order?: number;
}

export interface ICourseUpdate {
  title?: string;
  description?: string;
  coverImage?: string;
  isPublished?: boolean;
  objectives?: string[];
}

export interface ICourseResponse {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  area: string;
  level: string;
  duration: number;
  objectives: string[];
  modulesCount: number;
  isPublished: boolean;
  isFree: boolean;
}

// ============ MODULE TYPES ============
export interface IModuleCreate {
  courseId: string;
  title: string;
  slug: string;
  description: string;
  week: number;
  order?: number;
  practices?: {
    title: string;
    description: string;
    duration: number;
    type: "meditation" | "exercise" | "reflection" | "practice";
  }[];
  unlockDate?: Date;
}

export interface IModuleUpdate {
  title?: string;
  description?: string;
  isPublished?: boolean;
  practices?: any[];
}

export interface IModuleResponse {
  _id: string;
  courseId: string;
  title: string;
  slug: string;
  description: string;
  week: number;
  order: number;
  contentsCount: number;
  practices: any[];
  isPublished: boolean;
  isUnlocked: boolean;
}

// ============ CONTENT TYPES ============
export interface IContentCreate {
  moduleId: string;
  title: string;
  slug: string;
  type: "video" | "article" | "audio" | "pdf" | "live_class";
  description: string;
  contentUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  isDaily?: boolean;
  publishDate?: Date;
  tags?: string[];
  resources?: {
    title: string;
    url: string;
    type: string;
  }[];
}

export interface IContentUpdate {
  title?: string;
  description?: string;
  contentUrl?: string;
  isPublished?: boolean;
}

export interface IContentResponse {
  _id: string;
  moduleId: string;
  title: string;
  slug: string;
  type: string;
  description: string;
  contentUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  isDaily: boolean;
  tags: string[];
  resources: any[];
  isPublished: boolean;
}

// ============ TESTIMONIAL TYPES ============
export interface ITestimonialCreate {
  userId?: string;
  authorName: string;
  authorRole?: string;
  avatarUrl?: string;
  content: string;
  rating: number;
  area?: "biology" | "relationships" | "consciousness" | "energy" | "general";
}

export interface ITestimonialUpdate {
  isApproved?: boolean;
  isFeatured?: boolean;
}

export interface ITestimonialResponse {
  _id: string;
  authorName: string;
  authorRole?: string;
  avatarUrl?: string;
  content: string;
  rating: number;
  area: string;
  isFeatured: boolean;
  publishDate: Date;
}

// ============ PROGRESS TYPES ============
export interface IProgressUpdate {
  contentId?: string;
  moduleId?: string;
  courseId?: string;
  timeSpent?: number;
}

export interface IJournalEntry {
  area: "biology" | "relationships" | "consciousness" | "energy";
  reflection: string;
  mood: number;
  achievements: string[];
}

export interface IProgressResponse {
  _id: string;
  userId: string;
  subscriptionId: string;
  completedContents: number;
  completedModules: number;
  completedCourses: number;
  areaProgress: {
    biology: number;
    relationships: number;
    consciousness: number;
    energy: number;
  };
  totalTimeSpent: number;
  streak: {
    current: number;
    longest: number;
  };
  overallProgress: number;
}

// ============ LIVE CLASS TYPES ============
export interface ILiveClassCreate {
  title: string;
  description: string;
  instructor: {
    name: string;
    bio: string;
    avatarUrl: string;
  };
  area: "biology" | "relationships" | "consciousness" | "energy";
  scheduledDate: Date;
  duration: number;
  meetingUrl: string;
  maxParticipants?: number;
}

export interface ILiveClassUpdate {
  isLive?: boolean;
  recordingUrl?: string;
}

export interface ILiveClassResponse {
  _id: string;
  title: string;
  description: string;
  instructor: any;
  area: string;
  scheduledDate: Date;
  duration: number;
  meetingUrl: string;
  isLive: boolean;
  participantsCount: number;
  isRegistered: boolean;
}

// ============ COMMUNITY TYPES ============
export interface ICommunityPostCreate {
  userId: string;
  title: string;
  content: string;
  area?: "biology" | "relationships" | "consciousness" | "energy" | "general";
  tags?: string[];
}

export interface ICommunityPostUpdate {
  title?: string;
  content?: string;
  isApproved?: boolean;
  isPinned?: boolean;
}

export interface ICommentCreate {
  userId: string;
  content: string;
}

export interface ICommunityPostResponse {
  _id: string;
  userId: string;
  author: {
    name: string;
    avatar?: string;
  };
  title: string;
  content: string;
  area: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isPinned: boolean;
  createdAt: Date;
}
