
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Calendar, Users, ArrowRight, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import AdminScriptsManager from "@/components/admin/AdminScriptsManager";

interface Script {
  id: string;
  title: string;
  content: string;
  characters: string[];
  genre: string | null;
  created_at: string;
  updated_at: string;
}

const ScriptsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingScriptId, setDeletingScriptId] = useState<string | null>(null);

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['scripts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('scripts')
        .select(`
          *,
          script_analyses!inner(id, created_at)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as (Script & { script_analyses: Array<{ id: string; created_at: string }> })[];
    },
    enabled: !!user,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      if (error) return false;
      return (data || []).some((r: { role: string }) => r.role === 'admin');
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (scriptId: string) => {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts', user?.id] });
      toast({
        title: "Script deleted",
        description: "Script has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error('Error deleting script:', error);
      toast({
        title: "Error deleting script",
        description: "Failed to delete script. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingScriptId(null);
    },
  });

  const handleAnalyzeScript = (scriptId: string) => {
    navigate(`/analysis/${scriptId}`);
  };

  const handleDeleteScript = (scriptId: string) => {
    setDeletingScriptId(scriptId);
    deleteMutation.mutate(scriptId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Admin section (only visible for admins) */}
        <AdminScriptsManager />
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gray-900/50 border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <div className="space-y-4">
        {/* Admin section (only visible for admins) */}
        <AdminScriptsManager />
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No scripts yet</h3>
            <p className="text-gray-400 mb-6">Upload your first script to get started with analysis and coaching.</p>
            <Button 
              onClick={() => navigate('/analysis')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Script
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Admin section (only visible for admins) */}
      <AdminScriptsManager />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Scripts</h2>
          <p className="text-gray-400">Continue working on your uploaded scripts</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" asChild className="border-gray-600 text-gray-200 hover:bg-gray-800/50">
              <Link to="/admin/scripts">Admin Scripts</Link>
            </Button>
          )}
          <Button 
            onClick={() => navigate('/analysis')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Upload New Script
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {scripts.map((script) => {
          const hasAnalysis = script.script_analyses && script.script_analyses.length > 0;
          const buttonText = hasAnalysis ? "Continue Work" : "Start Analysis";
          
          return (
            <Card key={script.id} className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {script.title}
                      {hasAnalysis && (
                        <Badge variant="secondary" className="bg-green-900/30 text-green-300 border-green-700 ml-2">
                          Analyzed
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-2">
                      {script.content.length > 150 
                        ? `${script.content.substring(0, 150)}...` 
                        : script.content}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          disabled={deletingScriptId === script.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Script</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{script.title}"? This action cannot be undone and will also delete any related script analyses.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteScript(script.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Script
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      onClick={() => handleAnalyzeScript(script.id)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 font-medium px-4 py-2 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      {buttonText}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {script.genre && (
                    <Badge variant="secondary" className="bg-blue-900/30 text-blue-300 border-blue-700">
                      {script.genre}
                    </Badge>
                  )}
                  {script.characters && script.characters.length > 0 && (
                    <Badge variant="secondary" className="bg-green-900/30 text-green-300 border-green-700">
                      <Users className="w-3 h-3 mr-1" />
                      {script.characters.length} character{script.characters.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-gray-300 border-gray-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(script.updated_at)}
                  </Badge>
                </div>

                {script.characters && script.characters.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Characters:</p>
                    <div className="flex flex-wrap gap-1">
                      {script.characters.slice(0, 5).map((character, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-gray-300 border-gray-600">
                          {character}
                        </Badge>
                      ))}
                      {script.characters.length > 5 && (
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
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

export default ScriptsList;
