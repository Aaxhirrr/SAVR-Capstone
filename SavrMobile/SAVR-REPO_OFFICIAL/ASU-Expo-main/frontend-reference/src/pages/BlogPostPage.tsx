import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import blogService, { BlogPost } from '@/services/blogService';
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (slug: string) => {
    try {
      const data = await blogService.getPostBySlug(slug);
      setPost(data);
    } catch (error) {
      setError('Post not found');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Loading post...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-500 mb-4">{error || 'Post not found'}</p>
        <Link to="/blog">
          <Button>Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <article>
            {post.featured_image_url && (
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-96 object-cover rounded-lg mb-8"
              />
            )}

            <h1 className="text-5xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center gap-2 text-gray-500 mb-8">
              <Calendar className="w-4 h-4" />
              {formatDate(post.published_at)}
            </div>

            <Card>
              <CardContent className="prose max-w-none p-8">
                <div className="whitespace-pre-wrap">{post.content}</div>
              </CardContent>
            </Card>

            <div className="mt-12 text-center py-12 bg-white rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Ready to start saving on groceries?</h2>
              <p className="text-gray-600 mb-6">Join thousands of Canadians saving money with SAVR</p>
              <Link to="/signup">
                <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg">
                  Try SAVR Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
