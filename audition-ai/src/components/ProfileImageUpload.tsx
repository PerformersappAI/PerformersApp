
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { DataUseDisclaimer } from "@/components/DataUseDisclaimer";

interface ProfileImageUploadProps {
  label: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
}

export function ProfileImageUpload({ label, currentUrl, onUpload }: ProfileImageUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    if (!user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
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
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image.",
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
  };

  return (
    <div className="space-y-4">
      <Label className="text-white">{label}</Label>
      
      {currentUrl ? (
        <div className="relative">
            <img
              src={currentUrl}
              alt={label}
              className="w-full h-48 object-cover rounded-lg border"
              onError={(e) => {
                console.error('Image failed to load:', currentUrl);
                // Show placeholder instead of empty src
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
            <div className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg items-center justify-center hidden bg-muted/20">
              <div className="text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load image</p>
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
        <div className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No image uploaded</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
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
        {currentUrl ? "Replace Image" : "Upload Image"}
      </Button>
      
      <DataUseDisclaimer size="sm" className="mt-3" />
    </div>
  );
}
