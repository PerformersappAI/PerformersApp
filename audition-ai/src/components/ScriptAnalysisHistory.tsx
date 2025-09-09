import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Users, ArrowRight, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ScriptWithAnalysis {
  id: string;
  title: string;
  content: string;
  characters: string[];
  genre: string | null;
  created_at: string;
  updated_at: string;
  script_analyses: Array<{
    id: string;
    created_at: string;
    selected_character: string;
    acting_method: string;
  }>;
}

interface ScriptAnalysisHistoryProps {
  onContinueAnalysis?: (scriptId: string) => void;
  onStartFirstAnalysis?: () => void;
}

const ScriptAnalysisHistory = ({ onContinueAnalysis, onStartFirstAnalysis }: ScriptAnalysisHistoryProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scriptsWithAnalyses = [], isLoading } = useQuery({
    queryKey: ['scripts-with-analyses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('scripts')
        .select(`
          *,
          script_analyses(
            id,
            created_at,
            selected_character,
            acting_method
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Filter to only show scripts that have analyses and limit to 15
      const scriptsWithExistingAnalyses = data
        .filter(script => script.script_analyses && script.script_analyses.length > 0)
        .slice(0, 15);
      
      return scriptsWithExistingAnalyses as ScriptWithAnalysis[];
    },
    enabled: !!user,
  });

  const deleteScriptMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      // Delete script analyses first (due to foreign key constraint)
      const { error: analysisError } = await supabase
        .from('script_analyses')
        .delete()
        .eq('script_id', scriptId);

      if (analysisError) throw analysisError;

      // Delete the script itself
      const { error: scriptError } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId)
        .eq('user_id', user?.id);

      if (scriptError) throw scriptError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts-with-analyses', user?.id] });
      toast({
        title: "Script deleted",
        description: "The script and its analysis have been removed from your history.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting script:', error);
      toast({
        title: "Error",
        description: "Failed to delete script. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContinueAnalysis = (scriptId: string) => {
    if (onContinueAnalysis) {
      onContinueAnalysis(scriptId);
    } else {
      navigate(`/analysis/${scriptId}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (scriptsWithAnalyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No script analyses yet</h3>
          <p className="text-muted-foreground mb-6">Start by analyzing your first script to see your analysis history here.</p>
          <Button 
            onClick={() => onStartFirstAnalysis ? onStartFirstAnalysis() : navigate('/analysis')}
            className="bg-primary hover:bg-primary/90"
          >
            <FileText className="w-4 h-4 mr-2" />
            Start First Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Scene Analysis History</h2>
            <p className="text-muted-foreground">Continue working on your analyzed scenes</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-muted-foreground border-border">
              {scriptsWithAnalyses.length} / 15 scripts
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Maximum 15 scripts saved</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {scriptsWithAnalyses.map((script) => {
          const latestAnalysis = script.script_analyses[0]; // Assuming they're ordered by date
          
          return (
            <Card key={script.id} className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {script.title}
                      <Badge variant="secondary" className="bg-accent/30 text-accent-foreground border-accent ml-2">
                        Analyzed
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">
                      {script.content.length > 150 
                        ? `${script.content.substring(0, 150)}...` 
                        : script.content}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => navigate(`/analysis/${script.id}?step=results`)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 font-medium px-4 py-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Analysis
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Delete Scene Analysis</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete "{script.title}" and all its analyses? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteScriptMutation.mutate(script.id)}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            disabled={deleteScriptMutation.isPending}
                          >
                            {deleteScriptMutation.isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {script.genre && (
                    <Badge variant="secondary" className="bg-secondary/30 text-secondary-foreground border-secondary">
                      {script.genre}
                    </Badge>
                  )}
                  {script.characters && script.characters.length > 0 && (
                    <Badge variant="secondary" className="bg-accent/30 text-accent-foreground border-accent">
                      <Users className="w-3 h-3 mr-1" />
                      {script.characters.length} character{script.characters.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-muted-foreground border-border">
                    <Calendar className="w-3 h-3 mr-1" />
                    Last analyzed: {formatDate(latestAnalysis.created_at)}
                  </Badge>
                </div>

                {latestAnalysis && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Latest Analysis:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs text-primary border-primary">
                        Character: {latestAnalysis.selected_character}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-secondary-foreground border-secondary">
                        Method: {latestAnalysis.acting_method}
                      </Badge>
                    </div>
                  </div>
                )}

                {script.characters && script.characters.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">All Characters:</p>
                    <div className="flex flex-wrap gap-1">
                      {script.characters.slice(0, 5).map((character, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-muted-foreground border-border">
                          {character}
                        </Badge>
                      ))}
                      {script.characters.length > 5 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                          +{script.characters.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ScriptAnalysisHistory;