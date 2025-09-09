import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BlogPostCard } from '@/components/blog/BlogPostCard';
import CreateBlogPostDialog from '@/components/blog/CreateBlogPostDialog';
import PageHeaderNav from '@/components/PageHeaderNav';

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

const Podcast = () => {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) return false;
      return (data || []).some((r: { role: string }) => r.role === 'admin');
    },
    enabled: !!user,
  });

  const { data: posts = [], refetch } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BlogPost[];
    },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <PageHeaderNav title="Podcast" showForward />
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20" style={{ marginTop: '20px' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <img 
              src="/lovable-uploads/11ffb9ca-b464-4313-9bc3-58aa222d4268.png" 
              alt="MyAuditionAI Podcast" 
              className="w-64 h-64 object-cover rounded-2xl shadow-2xl border-2 border-yellow-500/30"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            MyAuditionAI Podcast
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Behind-the-scenes insights, industry interviews, and acting tips from the world of AI-powered audition coaching.
          </p>
        </div>
      </section>

      {/* Admin Controls */}
      {isAdmin && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">Manage Blog Posts</h2>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              <Plus className="w-4 h-4" />
              Create Post
            </Button>
          </div>
        </section>
      )}

      {/* Blog Posts */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-950">
        <div className="max-w-4xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">
                No podcast episodes yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Post Dialog */}
      <CreateBlogPostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refetch();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Podcast;
