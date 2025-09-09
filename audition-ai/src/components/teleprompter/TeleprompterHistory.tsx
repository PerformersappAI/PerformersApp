import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Calendar, Users, Play, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ScriptEditor from './ScriptEditor';

interface Script {
  id: string;
  title: string;
  content: string;
  characters: string[];
  created_at: string;
  updated_at: string;
}

interface TeleprompterHistoryProps {
  onScriptSelected: (scriptId: string) => void;
}

const TeleprompterHistory: React.FC<TeleprompterHistoryProps> = ({ 
  onScriptSelected 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingScript, setEditingScript] = useState<Script | null>(null);

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['teleprompter-scripts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('scripts')
        .select('id, title, content, characters, created_at, updated_at')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(15);

      if (error) throw error;
      return data as Script[];
    },
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleScriptSelect = (scriptId: string) => {
    onScriptSelected(scriptId);
  };

  const handleDeleteScript = async (scriptId: string, scriptTitle: string) => {
    try {
      // Use the database function to safely soft-delete the script
      const { data, error } = await supabase.rpc('soft_delete_script', {
        p_script_id: scriptId
      });

      if (error) throw error;

      if (!data) {
        throw new Error('Script not found or you do not have permission to delete it');
      }

      // Invalidate and refetch the scripts query
      queryClient.invalidateQueries({ queryKey: ['teleprompter-scripts', user?.id] });

      toast({
        title: "Script Deleted",
        description: `"${scriptTitle}" has been removed from your scripts.`,
      });
    } catch (error: any) {
      console.error('Error deleting script:', error);
      toast({
        title: "Error",
        description: "Failed to delete script. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditScript = (script: Script) => {
    setEditingScript(script);
  };

  const handleScriptUpdated = (updatedScript: Script) => {
    // Invalidate and refetch the scripts query to reflect changes
    queryClient.invalidateQueries({ queryKey: ['teleprompter-scripts', user?.id] });
    setEditingScript(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Scripts Yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload your first script to get started with the teleprompter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Your Scripts</h3>
          <Badge variant="outline" className="text-muted-foreground">
            {scripts.length} / 15
          </Badge>
        </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {scripts.map((script) => (
          <Card 
            key={script.id} 
            className="hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => handleScriptSelect(script.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <h4 className="font-medium text-foreground truncate">
                      {script.title}
                    </h4>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {script.content.length > 100 
                      ? `${script.content.substring(0, 100)}...` 
                      : script.content}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {script.characters && script.characters.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {script.characters.length} character{script.characters.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(script.updated_at)}
                    </Badge>
                  </div>
                </div>

                <div className="ml-3 flex-shrink-0 flex gap-2" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditScript(script);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Script</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{script.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteScript(script.id, script.title)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScriptSelect(script.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Use
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Maximum 15 scripts saved. Oldest scripts are automatically removed.
          </p>
        </div>
      </div>

      <ScriptEditor
        script={editingScript}
        isOpen={!!editingScript}
        onClose={() => setEditingScript(null)}
        onScriptUpdated={handleScriptUpdated}
      />
    </>
  );
};

export default TeleprompterHistory;