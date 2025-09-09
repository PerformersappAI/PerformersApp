
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DataUseDisclaimer } from '@/components/DataUseDisclaimer';

interface ScriptTextEditorProps {
  scriptId: string;
  onScriptUpdated?: () => void;
  onContentChange?: (content: string) => void;
}

const ScriptTextEditor: React.FC<ScriptTextEditorProps> = ({ scriptId, onScriptUpdated, onContentChange }) => {
  const [script, setScript] = useState<any>(null);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const fetchedScriptId = useRef<string>('');

  useEffect(() => {
    console.log('[ScriptTextEditor] Component mounted/updated with scriptId:', scriptId);
    
    // Only fetch if we haven't fetched this script yet or if it's a different script
    if (!scriptId || fetchedScriptId.current === scriptId) {
      return;
    }
    
    const fetchScript = async () => {
      console.log('[ScriptTextEditor] Fetching script data for ID:', scriptId);
      
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();

      if (error) {
        console.error('[ScriptTextEditor] Error fetching script:', error);
        toast({
          title: "Error",
          description: "Failed to load script.",
          variant: "destructive",
        });
        return;
      }

      console.log('[ScriptTextEditor] Script fetched successfully:', {
        id: data.id,
        title: data.title,
        contentLength: data.content?.length,
        updated_at: data.updated_at
      });

      setScript(data);
      setEditedContent(data.content);
      setIsInitialLoad(false);
      fetchedScriptId.current = scriptId;
      
      // Notify parent of initial content
      if (onContentChange) {
        onContentChange(data.content);
      }
    };

    fetchScript();
  }, [scriptId]); // Only depend on scriptId, not onContentChange

  const handleContentChange = (newContent: string) => {
    console.log('[ScriptTextEditor] Content changed, length:', newContent.length);
    setEditedContent(newContent);
    
    // Notify parent component of content changes immediately
    if (onContentChange) {
      onContentChange(newContent);
    }
  };


  const saveScript = async () => {
    if (!user || !script) {
      console.warn('[ScriptTextEditor] Save blocked - missing user or script:', { user: !!user, script: !!script });
      return;
    }

    console.log('[ScriptTextEditor] Starting save process...', {
      scriptId,
      originalContentLength: script.content?.length,
      editedContentLength: editedContent.length,
      hasChanges: editedContent !== script.content
    });

    setSaving(true);
    const saveTimestamp = new Date().toISOString();
    
    try {
      const { data, error } = await supabase
        .from('scripts')
        .update({ 
          content: editedContent,
          updated_at: saveTimestamp
        })
        .eq('id', scriptId)
        .select('*')
        .single();

      if (error) {
        console.error('[ScriptTextEditor] Database save error:', error);
        throw error;
      }

      console.log('[ScriptTextEditor] Save successful:', {
        id: data.id,
        contentLength: data.content?.length,
        updated_at: data.updated_at
      });

      // Update local state to prevent re-fetch
      const updatedScript = { ...script, content: editedContent, updated_at: saveTimestamp };
      setScript(updatedScript);
      setLastSaveTime(saveTimestamp);
      
      toast({
        title: "Script Updated",
        description: "Your script has been saved successfully.",
      });

      if (onScriptUpdated) {
        onScriptUpdated();
      }
    } catch (error: any) {
      console.error('[ScriptTextEditor] Save failed:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to save script.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const resetContent = () => {
    if (script) {
      console.log('[ScriptTextEditor] Resetting content to original');
      setEditedContent(script.content);
      setLastSaveTime(''); // Clear save timestamp to allow re-fetch if needed
      
      // Notify parent of reset content
      if (onContentChange) {
        onContentChange(script.content);
      }
      
      toast({
        title: "Reset Complete", 
        description: "Script content has been reset to original.",
      });
    }
  };

  if (!script) {
    return <div className="text-muted-foreground">Loading script...</div>;
  }

  const hasChanges = editedContent !== script.content;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-6">
        <CardTitle className="text-foreground flex items-center gap-3 text-xl">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          Script Text Editor
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base leading-relaxed">
          Edit your script text for {script.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Script Content Editor */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-foreground text-base font-medium">Script Content</label>
            <div className="flex gap-2">
              {hasChanges && (
                <Button
                  onClick={resetContent}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button
                onClick={saveScript}
                disabled={saving || !hasChanges}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <Textarea
            id="script-content"
            value={editedContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Edit your script content here..."
            className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[400px] font-mono text-base"
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{editedContent.length} characters</span>
            <div className="flex gap-4">
              {hasChanges && (
                <span className="text-amber-500">⚠️ Unsaved changes</span>
              )}
              {lastSaveTime && (
                <span className="text-emerald-500">✓ Last saved: {new Date(lastSaveTime).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-muted/50 p-4 rounded-lg border">
          <h4 className="text-foreground font-medium mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="text-muted-foreground border-border">
              Ctrl+F to find text
            </Badge>
            <Badge variant="outline" className="text-muted-foreground border-border">
              Changes auto-saved when you click Save
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <DataUseDisclaimer className="mt-4" />
    </Card>
  );
};

export default ScriptTextEditor;
