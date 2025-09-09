import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  youtube_url: string | null;
  status: 'draft' | 'published';
  author_id: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });

  const getYouTubeEmbedId = (url: string) => {
    if (!url) return null;
    
    // Enhanced regex to handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Debug: Log the URL if no match is found
    console.log('Failed to extract YouTube ID from URL:', url);
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-muted rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post not found</h1>
            <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist.</p>
            <Link to="/podcast">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Podcast
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const videoId = post.youtube_url ? getYouTubeEmbedId(post.youtube_url) : null;

  return (
    <div className="min-h-screen bg-background">
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/podcast">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Podcast
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              Podcast
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between pb-6 border-b border-border">
            <p className="text-sm text-muted-foreground">
              By {post.profiles?.full_name || 'Admin'}
            </p>
          </div>
        </div>

        {/* Media */}
        {(videoId || post.cover_image_url) && (
          <div className="mb-8">
            {videoId ? (
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={post.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : post.cover_image_url ? (
              <div className="aspect-video rounded-lg overflow-hidden">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-blockquote:text-foreground prose-code:text-foreground">
          <div 
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
            className="leading-relaxed [&>p]:mb-4 [&>h1]:mb-4 [&>h2]:mb-4 [&>h3]:mb-4 [&>h4]:mb-4 [&>h5]:mb-4 [&>h6]:mb-4"
          />
        </div>
      </article>
    </div>
  );
}