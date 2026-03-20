import mongoose, { Schema, Document } from "mongoose";

export interface IReaction {
  userId: mongoose.Types.ObjectId;
  type: "love" | "inspire" | "gratitude" | "light";
  createdAt: Date;
}

export interface IComment {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  images: string[];
  videoUrl?: string;
  author: mongoose.Types.ObjectId;
  category: "bienestar" | "conciencia" | "energia" | "biologia" | "relaciones" | "general";
  tags: string[];
  reactions: IReaction[];
  comments: IComment[];
  viewCount: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReactionSchema = new Schema<IReaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["love", "inspire", "gratitude", "light"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CommentSchema = new Schema<IComment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: [true, "El contenido del comentario es requerido"],
    trim: true,
    maxlength: [2000, "El comentario no puede exceder 2000 caracteres"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: [true, "El título es requerido"],
      trim: true,
      maxlength: [200, "El título no puede exceder 200 caracteres"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      required: [true, "El extracto es requerido"],
      maxlength: [500, "El extracto no puede exceder 500 caracteres"],
    },
    content: {
      type: String,
      required: [true, "El contenido es requerido"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    images: [{
      type: String,
    }],
    videoUrl: {
      type: String,
      default: "",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["bienestar", "conciencia", "energia", "biologia", "relaciones", "general"],
      default: "general",
    },
    tags: [{
      type: String,
      trim: true,
    }],
    reactions: [ReactionSchema],
    comments: [CommentSchema],
    viewCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generar slug antes de guardar
BlogPostSchema.pre("save", function (next) {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    
    // Agregar timestamp para evitar duplicados
    this.slug = `${this.slug}-${Date.now().toString(36)}`;
  }
  
  // Actualizar publishedAt cuando se publica
  if (this.isModified("isPublished") && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Índices
BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ isPublished: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1 });
BlogPostSchema.index({ tags: 1 });

export const BlogPostModel = mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);
