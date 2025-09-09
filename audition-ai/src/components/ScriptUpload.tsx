import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Scan, Upload, X, Eye, EyeOff, Edit3, Save, ScanText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DataUseDisclaimer } from '@/components/DataUseDisclaimer';

interface ScriptUploadProps {
  onScriptUploaded: (scriptId: string) => void;
}

const ScriptUpload: React.FC<ScriptUploadProps> = ({ onScriptUploaded }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [detectedCharacters, setDetectedCharacters] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractingText, setExtractingText] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const extractCharacters = (text: string): string[] => {
    const characterSet = new Set<string>();
    
    // Method 1: Character names followed by colons (most common in scripts)
    const dialogueMatches = text.match(/^[A-Z][A-Z\s\-'\.]+:/gm);
    if (dialogueMatches) {
      dialogueMatches.forEach(match => {
        const name = match.replace(':', '').trim();
        if (name.length > 1 && name.length < 30 && 
            !name.includes('FADE') && !name.includes('CUT') && 
            !name.includes('INT') && !name.includes('EXT')) {
          characterSet.add(name);
        }
      });
    }
    
    // Method 2: Character names in parentheses
    const parentheticalMatches = text.match(/\(([A-Z][A-Z\s\-']+)\)/g);
    if (parentheticalMatches) {
      parentheticalMatches.forEach(match => {
        const name = match.replace(/[()]/g, '').trim();
        if (name.length > 1 && name.length < 30 && 
            !name.toLowerCase().includes('pause') && 
            !name.toLowerCase().includes('beat') &&
            !name.toLowerCase().includes('cont')) {
          characterSet.add(name.toUpperCase());
        }
      });
    }
    
    // Method 3: Names at the beginning of lines (screenplay format)
    const screenplayMatches = text.match(/^\s*([A-Z][A-Z\s\-']+)$/gm);
    if (screenplayMatches) {
      screenplayMatches.forEach(match => {
        const name = match.trim();
        if (name.length > 1 && name.length < 30 && 
            !name.includes('FADE') && !name.includes('CUT') && 
            !name.includes('INT') && !name.includes('EXT') &&
            !name.includes('SCENE') && !name.includes('ACT')) {
          characterSet.add(name);
        }
      });
    }
    
    const characters = Array.from(characterSet);
    
    // Sort by frequency in the text
    const sortedCharacters = characters
      .filter(char => {
        const lowerChar = char.toLowerCase();
        return !lowerChar.includes('narrator') && 
               !lowerChar.includes('voice') && 
               !lowerChar.includes('announcer') &&
               !lowerChar.includes('off') &&
               !lowerChar.includes('cont');
      })
      .sort((a, b) => {
        const countA = (text.match(new RegExp(a, 'gi')) || []).length;
        const countB = (text.match(new RegExp(b, 'gi')) || []).length;
        return countB - countA;
      })
      .slice(0, 10);
    
    return sortedCharacters.length > 0 ? sortedCharacters : ['MAIN CHARACTER', 'PROTAGONIST', 'LEAD ROLE'];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = ['application/pdf', 'text/plain'];
      const allowedExtensions = ['.pdf', '.txt'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF or TXT file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove file extension for title
      }
    }
  };

  const extractTextFromFile = async () => {
    if (!selectedFile) return;

    setExtractingText(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data, error } = await supabase.functions.invoke('extract-text', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message || 'Failed to extract text from file');
      }

      if (data?.text) {
        setContent(data.text);
        const characters = extractCharacters(data.text);
        setDetectedCharacters(characters);
        
        toast({
          title: "Text extracted successfully!",
          description: `Extracted ${data.text.length} characters and detected ${characters.length} script characters.`,
        });
      } else {
        throw new Error('No text was extracted from the file');
      }
    } catch (error: any) {
      console.error('Text extraction error:', error);
      toast({
        title: "Extraction failed",
        description: error.message || "Failed to extract text from the file.",
        variant: "destructive",
      });
    } finally {
      setExtractingText(false);
    }
  };


  const clearFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const scanContentForCharacters = () => {
    if (content) {
      const characters = extractCharacters(content);
      setDetectedCharacters(characters);
      toast({
        title: "Characters detected!",
        description: `Found ${characters.length} characters in your script.`,
      });
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (newContent.trim()) {
      const characters = extractCharacters(newContent);
      setDetectedCharacters(characters);
    }
  };

  const startEditingPreview = () => {
    setEditableContent(content);
    setIsEditingPreview(true);
  };

  const savePreviewChanges = () => {
    setContent(editableContent);
    const characters = extractCharacters(editableContent);
    setDetectedCharacters(characters);
    setIsEditingPreview(false);
    toast({
      title: "Script updated!",
      description: "Your changes have been saved to the script.",
    });
  };

  const cancelPreviewEdit = () => {
    setEditableContent('');
    setIsEditingPreview(false);
  };


  const formatScriptContent = (content: string) => {
    if (!content) return 'No content to preview';
    
    return content
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        
        // Character names (all caps, followed by colon or on their own line)
        if (/^[A-Z][A-Z\s\-'\.]+:/.test(trimmedLine)) {
          return (
            <div key={index} className="font-bold text-primary mb-1">
              {trimmedLine}
            </div>
          );
        }
        
        // Regular dialogue/action
        return (
          <div key={index} className="text-foreground mb-1 leading-relaxed">
            {trimmedLine}
          </div>
        );
        
        // Parentheticals
        if (/^\(.*\)$/.test(trimmedLine)) {
          return (
            <div key={index} className="text-muted-foreground text-sm italic ml-4 mb-1">
              {trimmedLine}
            </div>
          );
        }
        
        // Empty lines
        if (!trimmedLine) {
          return <div key={index} className="h-2"></div>;
        }
        
        // Regular dialogue/action
        return (
          <div key={index} className="text-foreground mb-1 leading-relaxed">
            {trimmedLine}
          </div>
        );
      });
  };

  const handleGeminiOcr = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/jpeg,image/jpg,image/png';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsOcrProcessing(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://cqlczzkyktktaajbfmli.supabase.co/functions/v1/ocr-script', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`OCR failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data?.text) {
          setContent(data.text);
          const characters = extractCharacters(data.text);
          setDetectedCharacters(characters);
          const cleanFileName = file.name.replace(/\.[^/.]+$/, "") || "OCR Script";
          if (!title) {
            setTitle(cleanFileName);
          }
          
          toast({
            title: "OCR Success",
            description: `Successfully extracted text from ${file.name}`,
          });
        } else {
          throw new Error(data?.error || 'No text extracted from the document');
        }
      } catch (error: any) {
        console.error('OCR error:', error);
        toast({
          variant: "destructive",
          title: "OCR Failed",
          description: error.message || "Failed to extract text from the uploaded file",
        });
      } finally {
        setIsOcrProcessing(false);
      }
    };

    input.click();
  };

  const uploadScript = async () => {
    if (!user || !content) {
      toast({
        title: "Error",
        description: "Please provide script content.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Save script to database with detected characters
      const { data, error } = await supabase
        .from('scripts')
        .insert([
          {
            user_id: user.id,
            title: title || 'Untitled Script',
            content: content,
            characters: detectedCharacters,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Generate scene summary in the background
      try {
        const { data: summaryData, error: summaryError } = await supabase.functions.invoke('summarize-scene', {
          body: {
            scriptTitle: title || 'Untitled Script',
            scriptContent: content
          }
        });

        if (!summaryError && summaryData?.summary) {
          // Update script with the generated summary
          await supabase
            .from('scripts')
            .update({ scene_summary: summaryData.summary })
            .eq('id', data.id);
        }
      } catch (summaryError) {
        console.log('Scene summary generation failed, continuing without it:', summaryError);
        // Don't block the main upload flow for summary generation failures
      }

      toast({
        title: "Success!",
        description: "Your script has been uploaded successfully with character detection.",
      });

      onScriptUploaded(data.id);
      
      // Reset form
      setTitle('');
      setContent('');
      setDetectedCharacters([]);
      setSelectedFile(null);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    setUploading(false);
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="space-y-8">
      {/* Two-Panel Workspace */}
      <div className="space-y-8">
        
        {/* Panel 1: Upload */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-6">
            <CardTitle 
              className="text-foreground flex items-center gap-3 text-xl cursor-pointer hover:text-primary transition-colors"
              onClick={triggerFileInput}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              Upload Script
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base leading-relaxed">
              Start by uploading a file or entering your script details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-foreground text-base font-medium">Script Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter script title..."
                className="bg-background border-border text-foreground text-base h-12"
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <Label className="text-foreground text-base font-medium">Upload Script File</Label>
              <DataUseDisclaimer size="sm" className="mt-1" />
              <div className="space-y-3">
                <Input
                  id="file-input"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileSelect}
                  className="bg-background border-border text-foreground text-base h-12 file:bg-muted file:text-foreground file:border-0 file:rounded file:px-4 file:py-2 file:mr-4"
                />
                {selectedFile && (
                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-foreground font-medium">{selectedFile.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={extractTextFromFile}
                        disabled={extractingText}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        {extractingText ? "Extracting..." : "Extract Text"}
                      </Button>
                      <Button
                        onClick={clearFile}
                        variant="outline"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center py-4 border-t border-border">
                <p className="text-muted-foreground mb-3">
                  If the upload script does not give a good outcome use this advanced button to upload your scene.
                </p>
                <Button
                  onClick={handleGeminiOcr}
                  disabled={isOcrProcessing}
                  variant="outline"
                  size="lg"
                  className="text-base"
                >
                  <Scan className="w-5 h-5 mr-2" />
                  {isOcrProcessing ? 'Processing...' : 'Advanced OCR'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel 2: Edit Script */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-6">
            <CardTitle className="text-foreground flex items-center gap-3 text-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-primary" />
              </div>
              Edit Script
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base leading-relaxed">
              Write or paste your script content with larger, easier-to-read text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-foreground text-base font-medium">Script Content</Label>
                {content && !selectedFile && (
                  <Button
                    onClick={scanContentForCharacters}
                    variant="outline"
                    size="sm"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    Detect Characters
                  </Button>
                )}
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Paste your script content here or upload a file from the first panel..."
                className="bg-background border-border text-foreground min-h-[400px] text-lg leading-relaxed font-mono resize-none"
                style={{ fontSize: '18px', lineHeight: '1.6' }}
              />
            </div>

            {detectedCharacters.length > 0 && (
              <div className="bg-muted/50 p-6 rounded-lg border">
                <h4 className="text-foreground font-semibold mb-4 flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  Detected Characters ({detectedCharacters.length})
                </h4>
                <div className="flex flex-wrap gap-3">
                  {detectedCharacters.map((character, index) => (
                    <span 
                      key={index}
                      className="bg-primary/10 text-primary px-3 py-2 rounded-lg text-base font-medium"
                    >
                      {character}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={uploadScript}
              disabled={uploading || !content.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg h-14"
            >
              {uploading ? "Saving Script..." : "Save & Continue to Analysis"}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ScriptUpload;