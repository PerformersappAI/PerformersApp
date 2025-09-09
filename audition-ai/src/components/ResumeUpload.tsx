import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, FileText, Download } from "lucide-react";
import { DataUseDisclaimer } from "@/components/DataUseDisclaimer";

interface ResumeUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
}

export function ResumeUpload({ currentUrl, onUpload }: ResumeUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadResume(file);
    }
  };

  const uploadResume = async (file: File) => {
    if (!user) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a resume smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileName = `${user.id}/resume_${Date.now()}.pdf`;

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
        description: "Resume uploaded successfully!",
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Error",
        description: "Failed to upload resume.",
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

  const handleDownload = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <Label>Resume (PDF)</Label>
      
      {currentUrl ? (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Resume.pdf</p>
                <p className="text-sm text-muted-foreground">PDF document uploaded</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button variant="destructive" size="sm" className="text-white hover:text-white" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No resume uploaded</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
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
        {currentUrl ? "Replace Resume" : "Upload Resume"}
      </Button>
      
      <DataUseDisclaimer size="sm" className="mt-3" />
    </div>
  );
}