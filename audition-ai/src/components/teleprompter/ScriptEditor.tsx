import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, X } from 'lucide-react';

interface Script {
  id: string;
  title: string;
  content: string;
}

interface ScriptEditorProps {
  script: Script | null;
  isOpen: boolean;
  onClose: () => void;
  onScriptUpdated?: (updatedScript: Script) => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  isOpen,
  onClose,
  onScriptUpdated
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (script) {
      setTitle(script.title);
      setContent(script.content);
    }
  }, [script]);

  const handleSave = async () => {
    if (!script || !title.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const { data, error } = await supabase
        .from('scripts')
        .update({
          title: title.trim(),
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', script.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Script Updated",
        description: `"${title}" has been successfully updated.`,
      });

      // Call the callback with updated script
      if (onScriptUpdated && data) {
        onScriptUpdated(data);
      }

      onClose();
    } catch (error: any) {
      console.error('Error updating script:', error);
      toast({
        title: "Error",
        description: "Failed to update script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (script) {
      setTitle(script.title);
      setContent(script.content);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Script
          </DialogTitle>
          <DialogDescription>
            Make changes to your script. Your changes will be saved and reflected in the teleprompter.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="script-title">Script Title</Label>
            <Input
              id="script-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter script title..."
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2 flex-1">
            <Label htmlFor="script-content">Script Content</Label>
            <Textarea
              id="script-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your script content here..."
              className="min-h-[400px] font-mono text-sm resize-none"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Character count: {content.length}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScriptEditor;