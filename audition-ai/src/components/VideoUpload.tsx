
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowLeft, Loader2 } from "lucide-react";
import { DataUseDisclaimer } from "@/components/DataUseDisclaimer";

interface VideoUploadProps {
  analysis: any;
  coachingSessionId: string;
  onVideoUploaded: (videoId: string) => void;
  onBackToCoaching: () => void;
}

const VideoUpload = ({ analysis, coachingSessionId, onVideoUploaded, onBackToCoaching }: VideoUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum file size: 1GB
  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB in bytes

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}. Please compress your video or choose a smaller file.`,
        variant: "destructive",
      });
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid video file (MP4, MOV, AVI, etc.)",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Save video submission to database with file path for later cleanup
      const { data: submission, error: dbError } = await supabase
        .from('video_submissions')
        .insert({
          user_id: user.id,
          coaching_session_id: coachingSessionId,
          video_url: data.publicUrl,
          video_title: file.name,
          storage_file_path: fileName // Store file path for cleanup
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Video uploaded successfully!",
        description: "Your video is now being processed for evaluation.",
      });

      onVideoUploaded(submission.id);
    } catch (error: any) {
      console.error('Error uploading video:', error);
      
      let errorMessage = "There was an error uploading your video. Please try again.";
      
      if (error.message?.includes('Payload too large') || error.statusCode === '413') {
        errorMessage = `Your video file is too large. Please compress it to under ${formatFileSize(MAX_FILE_SIZE)} and try again.`;
      } else if (error.message?.includes('Invalid file type')) {
        errorMessage = "Please select a valid video file format (MP4, MOV, AVI).";
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the file input to allow re-selecting the same file after error
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="outline" 
          onClick={onBackToCoaching}
          className="bg-background text-foreground border-border hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Coaching
        </Button>
        <h2 className="text-2xl font-bold text-foreground">Upload Your Audition Video</h2>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Video Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground space-y-2">
            <p>Upload your self-tape for analysis and feedback.</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Supported formats: MP4, MOV, AVI</li>
              <li>Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</li>
              <li>Recommended: 1080p resolution, good lighting and audio</li>
              <li className="text-blue-400">💡 Videos are automatically deleted after analysis to save space</li>
            </ul>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground mb-4">
              Drag and drop your video file here, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-yellow-foreground"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Choose Video File"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <DataUseDisclaimer className="mt-6" />
    </div>
  );
};

export default VideoUpload;
