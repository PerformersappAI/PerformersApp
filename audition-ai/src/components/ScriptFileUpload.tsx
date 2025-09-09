
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DataUseDisclaimer } from '@/components/DataUseDisclaimer';

interface ScriptFileUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
}

const ScriptFileUpload: React.FC<ScriptFileUploadProps> = ({ onTextExtracted }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error' | 'retry'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [extractedFileName, setExtractedFileName] = useState<string>('');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset status
    setUploadStatus('idle');
    setLastError(null);
    setExtractedFileName('');

    // Enhanced file validation
    const allowedTypes = ['text/plain', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = "Please upload a PDF or TXT file.";
      setLastError(errorMsg);
      setUploadStatus('error');
      toast({
        title: "Invalid File Type",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    if (file.size > maxSize) {
      const errorMsg = "File too large. Please select a file smaller than 10MB.";
      setLastError(errorMsg);
      setUploadStatus('error');
      toast({
        title: "File Too Large",
        description: errorMsg,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);

      const { data, error } = await supabase.functions.invoke('extract-text', {
        body: formData
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('PDF extraction response:', data);
      console.log('Extracted text length:', data?.text?.length);
      console.log('First 100 chars:', data?.text?.substring(0, 100));
      
      if (data?.text && data.text.trim()) {
        console.log('🔄 Calling onTextExtracted with:', {
          textLength: data.text.length,
          fileName: file.name,
          firstChars: data.text.substring(0, 50)
        });
        onTextExtracted(data.text, file.name);
        setExtractedFileName(file.name);
        setUploadStatus('success');
        toast({
          title: "Success!",
          description: `Text extracted from ${file.name} (${data.text.length} characters)`,
        });
      } else {
        throw new Error('No text could be extracted from the file. The file might be corrupted or contain only images.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract text from file';
      setLastError(errorMessage);
      setUploadStatus('error');
      
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRetry = () => {
    setUploadStatus('retry');
    setLastError(null);
    // Trigger file input click
    const fileInput = document.getElementById('script-file') as HTMLInputElement;
    fileInput?.click();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Upload className="w-5 h-5" />
            Upload Script File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataUseDisclaimer size="sm" className="mb-4" />
          <div className="space-y-4">
            {/* Main Upload Area */}
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              uploadStatus === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
              uploadStatus === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
              'border-border hover:border-primary/50'
            }`}>
              {uploadStatus === 'success' ? (
                <div className="space-y-3">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-400">
                      File Uploaded Successfully!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {extractedFileName}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setUploadStatus('idle');
                    setExtractedFileName('');
                  }}>
                    Upload Another File
                  </Button>
                </div>
              ) : uploadStatus === 'error' ? (
                <div className="space-y-3">
                  <AlertTriangle className="w-12 h-12 mx-auto text-red-600" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-400">
                      Upload Failed
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-500">
                      {lastError}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={handleRetry}>
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      Choose Your Script File
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Upload PDF or TXT files (up to 10MB)
                    </p>
                  </div>
                  <label htmlFor="script-file" className="cursor-pointer">
                    <Button 
                      disabled={isUploading} 
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      asChild
                    >
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Extracting Text...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="script-file"
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                <strong>Supported formats:</strong> PDF, TXT • <strong>Max size:</strong> 10MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ScriptFileUpload;
