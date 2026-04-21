import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import blogService, { BlogPost } from '@/services/blogService';
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

const BlogListPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await blogService.getAllPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:');
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
        <p className="text-gray-500">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Blog - Savr | Grocery Savings Tips</title>
        <meta name="description" content="Tips, tricks, and insights for saving money on groceries in Canada. Learn how to compare prices and shop smarter." />
        <link rel="canonical" href="https://savr.app/blog" />
        <meta property="og:title" content="Blog - Savr | Grocery Savings Tips" />
        <meta property="og:description" content="Tips, tricks, and insights for saving money on groceries in Canada." />
        <meta property="og:url" content="https://savr.app/blog" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://savr.app/" },
            { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://savr.app/blog" }
          ]
        })}</script>
      </Helmet>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">SAVR Blog</h1>
          <p className="text-xl text-gray-600 mb-8">
            Tips, tricks, and insights for saving money on groceries
          </p>

          <div className="mb-12">
            <Link to="/signup">
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                Try SAVR Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-16">No posts yet</p>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    {post.featured_image_url && (
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-64 object-cover rounded-t-lg"
                        width={800}
                        height={256}
                        loading="lazy"
                      />
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl hover:text-green-600 transition-colors">
                        {post.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.published_at)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{post.excerpt}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-16 text-center py-12 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Ready to start saving on groceries?</h2>
            <p className="text-gray-600 mb-6">Join thousands of Canadians saving money with SAVR</p>
            <Link to="/signup">
              <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg">
                Try SAVR Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;
