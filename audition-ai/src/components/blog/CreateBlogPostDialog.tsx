
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface CreateBlogPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateBlogPostDialog: React.FC<CreateBlogPostDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    youtube_url: '',
    cover_image_url: '',
    status: 'draft' as 'draft' | 'published'
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));

      toast({
        title: "Upload successful",
        description: "Cover image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, cover_image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(formData.title);

      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: formData.title.trim(),
          content: formData.content.trim(),
          excerpt: formData.excerpt.trim(),
          slug,
          author_id: user.id,
          youtube_url: formData.youtube_url.trim() || null,
          cover_image_url: formData.cover_image_url.trim() || null,
          status: formData.status,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Blog post created successfully",
      });

      setFormData({
        title: '',
        content: '',
        excerpt: '',
        youtube_url: '',
        cover_image_url: '',
        status: 'draft'
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast({
        title: "Error",
        description: "Failed to create blog post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Blog Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter post title"
              required
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief description of the post"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your blog post content here"
              rows={8}
              required
            />
          </div>

          <div>
            <Label htmlFor="youtube_url">YouTube URL</Label>
            <Input
              id="youtube_url"
              type="url"
              value={formData.youtube_url}
              onChange={(e) => {
                const url = e.target.value;
                if (url && !url.includes('youtube.com') && !url.includes('youtu.be')) {
                  toast({
                    title: "Invalid URL",
                    description: "Please enter a valid YouTube URL",
                    variant: "destructive",
                  });
                  return;
                }
                setFormData(prev => ({ ...prev, youtube_url: url }));
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <Label htmlFor="cover_image">Cover Image</Label>
            <div className="space-y-4">
              {formData.cover_image_url ? (
                <div className="relative">
                  <img 
                    src={formData.cover_image_url} 
                    alt="Cover preview" 
                    className="w-full h-48 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Upload a cover image</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="relative"
                    disabled={uploading}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </Button>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Or enter URL manually:</p>
                <Input
                  type="url"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'draft' | 'published') => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBlogPostDialog;
