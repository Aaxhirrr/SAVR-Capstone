import api from './api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  is_published: boolean;
  meta_description: string | null;
  featured_image_url: string | null;
}

export interface BlogPostCreate {
  title: string;
  content: string;
  excerpt?: string;
  meta_description?: string;
  featured_image_url?: string;
}

const blogService = {
  // Get all published posts
  async getAllPosts(): Promise<BlogPost[]> {
    const response = await api.get('/blog');
    return response.data;
  },

  async getAllPostsAdmin(): Promise<BlogPost[]> {
    const response = await api.get('/blog/all');
    return response.data;
  },

  // Get single post by slug
  async getPostBySlug(slug: string): Promise<BlogPost> {
    const response = await api.get(`/blog/${slug}`);
    return response.data;
  },

  // Create new post (admin only)
  async createPost(data: BlogPostCreate): Promise<BlogPost> {
    const response = await api.post('/blog', data);
    return response.data;
  },

  // Publish post (admin only)
  async publishPost(postId: string): Promise<BlogPost> {
    const response = await api.put(`/blog/${postId}/publish`);
    return response.data;
  },

  // Delete post (admin only)
  async deletePost(postId: string): Promise<void> {
    await api.delete(`/blog/${postId}`);
  }
};

export default blogService;
