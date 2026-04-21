import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import blogService, { BlogPost, BlogPostCreate } from '@/services/blogService';
import { Trash2, Eye, Calendar, ArrowLeft, PenLine } from 'lucide-react';

const AdminBlogPage = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const allPosts = await blogService.getAllPostsAdmin();
      setPosts(allPosts);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load blog posts',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const postData: BlogPostCreate = {
        title,
        content,
        excerpt: excerpt || undefined,
        meta_description: metaDescription || undefined,
        featured_image_url: featuredImageUrl || undefined,
      };

      await blogService.createPost(postData);

      toast({
        title: 'Success!',
        description: 'Blog post created as draft',
      });

      // Reset form and return to list
      setTitle('');
      setContent('');
      setExcerpt('');
      setMetaDescription('');
      setFeaturedImageUrl('');
      setShowForm(false);

      loadPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create blog post',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      await blogService.publishPost(postId);
      toast({
        title: 'Published!',
        description: 'Blog post is now live',
      });
      loadPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish post',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await blogService.deletePost(postId);
      toast({
        title: 'Deleted',
        description: 'Blog post deleted successfully',
      });
      loadPosts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Draft';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const drafts = posts.filter((p) => !p.is_published);
  const published = posts.filter((p) => p.is_published);

  const PostRow = ({ post }: { post: BlogPost }) => (
    <div className="border rounded-lg p-4 flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{post.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{post.excerpt}</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(post.published_at)}
          </span>
          <span
            className={`px-2 py-1 rounded ${
              post.is_published
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {post.is_published ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="flex gap-2 ml-4">
        {!post.is_published && (
          <Button
            size="sm"
            onClick={() => handlePublish(post.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Eye className="w-4 h-4 mr-1" />
            Publish
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDelete(post.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Blog Management</h1>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <PenLine className="w-4 h-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {/* Create New Post Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create New Blog Post</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt (Short Preview)</Label>
                <Input
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description for list views"
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post content here..."
                  rows={15}
                  required
                  className="font-mono"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supports markdown formatting
                </p>
              </div>

              <div>
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  value={featuredImageUrl}
                  onChange={(e) => setFeaturedImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO description (max 160 characters)"
                  rows={2}
                  maxLength={160}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {metaDescription.length}/160 characters
                </p>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Draft'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Drafts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Drafts</CardTitle>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No drafts</p>
          ) : (
            <div className="space-y-4">
              {drafts.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Published */}
      <Card>
        <CardHeader>
          <CardTitle>Published</CardTitle>
        </CardHeader>
        <CardContent>
          {published.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No published posts yet</p>
          ) : (
            <div className="space-y-4">
              {published.map((post) => (
                <PostRow key={post.id} post={post} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlogPage;
