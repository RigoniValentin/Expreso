import mongoose from "mongoose";
import communityRepository from "../repositories/communityRepository";
import {
  ICommunityPostCreate,
  ICommunityPostUpdate,
  ICommentCreate,
} from "../types/NehilakTypes";

export class CommunityService {
  async createPost(data: ICommunityPostCreate) {
    return await communityRepository.createPost({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
    });
  }

  async getPostById(id: string, userId?: string) {
    const post = await communityRepository.findPostById(id);
    if (!post) {
      throw new Error("Publicación no encontrada");
    }

    const isLiked = userId
      ? await communityRepository.hasUserLiked(id, userId)
      : false;

    return {
      ...post.toObject(),
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      isLiked,
    };
  }

  async getAllPosts(userId?: string) {
    const posts = await communityRepository.findAllPosts({ isApproved: true });

    return await Promise.all(
      posts.map(async (post) => {
        const isLiked = userId
          ? await communityRepository.hasUserLiked(
              (post._id as mongoose.Types.ObjectId).toString(),
              userId
            )
          : false;

        return {
          ...post.toObject(),
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          isLiked,
        };
      })
    );
  }

  async getPostsByArea(area: string, userId?: string) {
    const posts = await communityRepository.findPostsByArea(area);

    return await Promise.all(
      posts.map(async (post) => {
        const isLiked = userId
          ? await communityRepository.hasUserLiked(
              (post._id as mongoose.Types.ObjectId).toString(),
              userId
            )
          : false;

        return {
          ...post.toObject(),
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          isLiked,
        };
      })
    );
  }

  async getUserPosts(userId: string) {
    return await communityRepository.findPostsByUser(userId);
  }

  async updatePost(id: string, userId: string, data: ICommunityPostUpdate) {
    const post = await communityRepository.findPostById(id);
    if (!post) {
      throw new Error("Publicación no encontrada");
    }

    if (post.userId.toString() !== userId) {
      throw new Error("No tienes permiso para editar esta publicación");
    }

    return await communityRepository.updatePost(id, data);
  }

  async deletePost(id: string, userId: string, isAdmin: boolean = false) {
    const post = await communityRepository.findPostById(id);
    if (!post) {
      throw new Error("Publicación no encontrada");
    }

    if (!isAdmin && post.userId.toString() !== userId) {
      throw new Error("No tienes permiso para eliminar esta publicación");
    }

    return await communityRepository.deletePost(id);
  }

  async addComment(postId: string, comment: ICommentCreate) {
    return await communityRepository.addComment(postId, comment);
  }

  async likePost(postId: string, userId: string) {
    const isLiked = await communityRepository.hasUserLiked(postId, userId);

    if (isLiked) {
      return await communityRepository.unlikePost(postId, userId);
    } else {
      return await communityRepository.likePost(postId, userId);
    }
  }

  async pinPost(postId: string, isPinned: boolean = true) {
    return await communityRepository.pinPost(postId, isPinned);
  }

  async approvePost(postId: string) {
    return await communityRepository.approvePost(postId);
  }

  async searchPosts(query: string, userId?: string) {
    const posts = await communityRepository.searchPosts(query);

    return await Promise.all(
      posts.map(async (post) => {
        const isLiked = userId
          ? await communityRepository.hasUserLiked(
              (post._id as mongoose.Types.ObjectId).toString(),
              userId
            )
          : false;

        return {
          ...post.toObject(),
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          isLiked,
        };
      })
    );
  }

  async getPopularPosts(limit: number = 10, userId?: string) {
    const posts = await communityRepository.getPopularPosts(limit);

    return await Promise.all(
      posts.map(async (post) => {
        const isLiked = userId
          ? await communityRepository.hasUserLiked(
              (post._id as mongoose.Types.ObjectId).toString(),
              userId
            )
          : false;

        return {
          ...post.toObject(),
          likesCount: post.likes.length,
          commentsCount: post.comments.length,
          isLiked,
        };
      })
    );
  }
}

export default new CommunityService();
