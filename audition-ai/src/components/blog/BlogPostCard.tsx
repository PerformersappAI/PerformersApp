
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

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

interface BlogPostCardProps {
  post: BlogPost;
}

export const BlogPostCard = ({ post }: BlogPostCardProps) => {
  const getYouTubeEmbedId = (url: string) => {
    // Enhanced regex to handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const videoId = post.youtube_url ? getYouTubeEmbedId(post.youtube_url) : null;

  return (
    <Link to={`/podcast/${post.slug}`} className="block">
      <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-0">
          <article className="grid md:grid-cols-2 gap-0">
          {/* Media Section */}
          <div className="relative">
            {videoId ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={post.title}
                  className="w-full h-full rounded-l-lg"
                  allowFullScreen
                />
              </div>
            ) : post.cover_image_url ? (
              <div className="aspect-video">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-contain bg-black/5"
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No media</p>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Podcast
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>

              <h2 className="text-2xl font-bold leading-tight text-foreground">
                {post.title}
              </h2>

              {post.excerpt && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="text-base text-muted-foreground leading-relaxed">
                <p>
                  {post.content.replace(/<[^>]*>/g, '').length > 150 
                    ? post.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
                    : post.content.replace(/<[^>]*>/g, '')}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                By {post.profiles?.full_name || 'Admin'}
              </p>
            </div>
          </div>
        </article>
      </CardContent>
    </Card>
    </Link>
  );
};
