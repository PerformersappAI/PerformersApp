import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrialSignupFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TrialSignupForm: React.FC<TrialSignupFormProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('handle-trial-signup', {
        body: {
          full_name: fullName,
          email: email,
          password: password,
        },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your free trial has been activated. Welcome aboard!",
      });

      // Automatically sign in the user to complete setup
      const { data: signInResult, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Auto sign-in failed:', signInError);
        toast({
          title: "Account created. Please sign in",
          description: "Sign in with your email and password, then add a profile photo in Profile.",
          variant: "destructive",
        });
      } else if (signInResult?.user && selectedImage) {
        try {
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedTypes.includes(selectedImage.type) || selectedImage.size > 5 * 1024 * 1024) {
            toast({
              title: "Invalid image",
              description: "Please upload a JPEG, PNG, or WebP under 5MB.",
              variant: "destructive",
            });
          } else {
            const ext = selectedImage.name.split('.').pop();
            const fileName = `${signInResult.user.id}/avatar_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
              .from('actor-profiles')
              .upload(fileName, selectedImage, { upsert: true });

            if (!uploadError) {
              const { data: publicData } = supabase.storage
                .from('actor-profiles')
                .getPublicUrl(fileName);
              const avatarUrl = publicData.publicUrl;

              const { error: profileError } = await supabase.from('profiles').upsert({
                id: signInResult.user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
              });

              if (profileError) {
                console.error('Profile upsert error:', profileError);
              }
            } else {
              console.error('Image upload error:', uploadError);
            }
          }
        } catch (e) {
          console.error('Error uploading avatar during signup:', e);
        }
      }

      setFullName('');
      setEmail('');
      setPassword('');
      setSelectedImage(null);
      setImagePreview(null);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Trial signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Your Free Trial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile Photo (optional)</Label>
            <div className="flex items-center gap-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="h-12 w-12 rounded-full object-cover border border-gray-700"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 text-sm">
                  IMG
                </div>
              )}
              <Input
                id="avatar"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedImage(file);
                  setImagePreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !fullName || !email || !password || password.length < 8}
              className="flex-1"
            >
              {isLoading ? "Starting Trial..." : "Start Free Trial"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};