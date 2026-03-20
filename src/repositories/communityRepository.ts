import CommunityPost, { ICommunityPost } from "../models/CommunityPost";

export class CommunityRepository {
  async createPost(postData: Partial<ICommunityPost>): Promise<ICommunityPost> {
    const post = new CommunityPost(postData);
    return await post.save();
  }

  async findPostById(id: string): Promise<ICommunityPost | null> {
    return await CommunityPost.findById(id)
      .populate("userId", "name email")
      .populate("comments.userId", "name email");
  }

  async findAllPosts(filters: any = {}): Promise<ICommunityPost[]> {
    return await CommunityPost.find(filters)
      .populate("userId", "name email")
      .sort({ isPinned: -1, createdAt: -1 });
  }

  async findPostsByArea(area: string): Promise<ICommunityPost[]> {
    return await CommunityPost.find({ area, isApproved: true })
      .populate("userId", "name email")
      .sort({ isPinned: -1, createdAt: -1 });
  }

  async findPostsByUser(userId: string): Promise<ICommunityPost[]> {
    return await CommunityPost.find({ userId }).sort({ createdAt: -1 });
  }

  async updatePost(
    id: string,
    updateData: Partial<ICommunityPost>
  ): Promise<ICommunityPost | null> {
    return await CommunityPost.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deletePost(id: string): Promise<ICommunityPost | null> {
    return await CommunityPost.findByIdAndDelete(id);
  }

  async addComment(
    postId: string,
    comment: any
  ): Promise<ICommunityPost | null> {
    return await CommunityPost.findByIdAndUpdate(
      postId,
      { $push: { comments: { ...comment, createdAt: new Date() } } },
      { new: true }
    ).populate("comments.userId", "name email");
  }

  async likePost(
    postId: string,
    userId: string
  ): Promise<ICommunityPost | null> {
    return await CommunityPost.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userId } },
      { new: true }
    );
  }

  async unlikePost(
    postId: string,
    userId: string
  ): Promise<ICommunityPost | null> {
    return await CommunityPost.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId } },
      { new: true }
    );
  }

  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    const post = await CommunityPost.findById(postId);
    if (!post) return false;
    return post.likes.some((id) => id.toString() === userId);
  }

  async pinPost(
    postId: string,
    isPinned: boolean = true
  ): Promise<ICommunityPost | null> {
    return await CommunityPost.findByIdAndUpdate(
      postId,
      { isPinned },
      { new: true }
    );
  }

  async approvePost(postId: string): Promise<ICommunityPost | null> {
    return await CommunityPost.findByIdAndUpdate(
      postId,
      { isApproved: true },
      { new: true }
    );
  }

  async searchPosts(query: string): Promise<ICommunityPost[]> {
    return await CommunityPost.find({
      isApproved: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ],
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
  }

  async getPopularPosts(limit: number = 10): Promise<ICommunityPost[]> {
    return await CommunityPost.find({ isApproved: true })
      .sort({ likes: -1, comments: -1 })
      .limit(limit)
      .populate("userId", "name email");
  }
}

export default new CommunityRepository();
