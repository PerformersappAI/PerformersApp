import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Play } from "lucide-react";
import { DataUseDisclaimer } from "@/components/DataUseDisclaimer";

interface ProfileVideoUploadProps {
  label: string;
  currentUrl?: string;
  currentTitle?: string;
  onUpload: (url: string) => void;
  onTitleChange: (title: string) => void;
}

export function ProfileVideoUpload({ 
  label, 
  currentUrl, 
  currentTitle, 
  onUpload, 
  onTitleChange 
}: ProfileVideoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadVideo(file);
    }
  };

  const uploadVideo = async (file: File) => {
    if (!user) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mov', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP4 or MOV video file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a video smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      // Sanitize filename: remove spaces, special chars, convert to lowercase
      const sanitizedLabel = label.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      const fileName = `${user.id}/${sanitizedLabel}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('actor-profiles')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('actor-profiles')
        .getPublicUrl(fileName);

      onUpload(data.publicUrl);

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onUpload('');
    onTitleChange('');
  };

  return (
    <div className="space-y-4">
      <Label className="text-white">{label}</Label>
      
      <div className="space-y-3">
        <Input
          placeholder="Video title"
          value={currentTitle || ''}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        
        {currentUrl ? (
          <div className="relative">
            <div className="w-full aspect-video rounded-lg border overflow-hidden">
              <video
                src={currentUrl}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                onError={(e) => {
                  console.error('Video failed to load:', currentUrl);
                  // Show error message instead of broken video
                  e.currentTarget.style.display = 'none';
                  const placeholder = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            </div>
            <div className="w-full aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg items-center justify-center hidden bg-muted/20">
              <div className="text-center">
                <Play className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load video</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 text-white hover:text-white"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-full aspect-video border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Play className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No video uploaded</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/mov,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {currentUrl ? "Replace Video" : "Upload Video"}
        </Button>
      </div>
      
      <DataUseDisclaimer size="sm" className="mt-3" />
    </div>
  );
}
