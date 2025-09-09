import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScriptAnalysisHeader from "@/components/ScriptAnalysisHeader";
import ScriptAnalysisWorkflowSteps from "@/components/ScriptAnalysisWorkflowSteps";
import ScriptTextEditor from "@/components/ScriptTextEditor";
import ScriptAnalyzer from "@/components/ScriptAnalyzer";
import AnalysisResults from "@/components/AnalysisResults";
import CoachingSession from "@/components/CoachingSession";
import VideoUpload from "@/components/VideoUpload";
import VideoEvaluation from "@/components/VideoEvaluation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, AlertCircle, Edit } from "lucide-react";

type AnalysisStep = 'upload' | 'analyze' | 'results' | 'coaching' | 'video-upload' | 'video-evaluation';

const IndividualScriptAnalysis = () => {
  const { scriptId } = useParams<{ scriptId: string }>();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('analyze');
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string>('');
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [currentCoachingSessionId, setCurrentCoachingSessionId] = useState<string>('');
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [currentScriptContent, setCurrentScriptContent] = useState<string>('');

  // Fetch script data and verify ownership
  const { data: script, isLoading: scriptLoading, error: scriptError } = useQuery({
    queryKey: ['script', scriptId, user?.id],
    queryFn: async () => {
      if (!user || !scriptId) return null;
      
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!scriptId,
  });

  // Fetch existing analysis for this script
  const { data: existingAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['script-analysis', scriptId, user?.id],
    queryFn: async () => {
      if (!user || !scriptId) return null;
      
      const { data, error } = await supabase
        .from('script_analyses')
        .select('*')
        .eq('script_id', scriptId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user && !!scriptId,
  });

  // Set up the analysis state when data is loaded
  useEffect(() => {
    if (existingAnalysis) {
      setCurrentAnalysisId(existingAnalysis.id);
      setCurrentAnalysis(existingAnalysis);
      
      // Check for step parameter in URL
      const stepParam = searchParams.get('step') as AnalysisStep;
      if (stepParam && ['analyze', 'results', 'coaching', 'video-upload', 'video-evaluation'].includes(stepParam)) {
        setCurrentStep(stepParam);
      } else {
        setCurrentStep('results');
      }
    }
  }, [existingAnalysis, searchParams]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate('/');
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    }
  };

  const resetWorkflow = () => {
    navigate('/analysis');
  };

  const handleAnalysisComplete = async (analysisId: string) => {
    setCurrentAnalysisId(analysisId);
    
    try {
      const { data: analysisData, error } = await supabase
        .from('script_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
        toast({
          title: "Error",
          description: "Failed to load analysis results.",
          variant: "destructive",
        });
        return;
      }

      setCurrentAnalysis(analysisData);
      setCurrentStep('results');
      toast({
        title: "Analysis complete!",
        description: "Your scene analysis is ready.",
      });
    } catch (error) {
      console.error('Error in handleAnalysisComplete:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis results.",
        variant: "destructive",
      });
    }
  };

  const handleStartCoaching = () => {
    setCurrentStep('coaching');
    toast({
      title: "Starting coaching session!",
      description: "Your personalized coaching session is ready.",
    });
  };

  const handleCoachingSessionCreated = (coachingSessionId: string) => {
    setCurrentCoachingSessionId(coachingSessionId);
  };

  const handleStartVideoUpload = () => {
    setCurrentStep('video-upload');
    toast({
      title: "Ready for video upload!",
      description: "Upload your audition video for evaluation.",
    });
  };

  const handleVideoUploaded = (videoId: string) => {
    setCurrentVideoId(videoId);
    setCurrentStep('video-evaluation');
    toast({
      title: "Video uploaded successfully!",
      description: "Your audition video is being evaluated.",
    });
  };

  const handleScriptContentChange = async (content: string) => {
    setCurrentScriptContent(content);
    
    // If we have content but no script in database, create one
    if (content && content.trim() && !script && scriptId && user) {
      try {
        const { data, error } = await supabase
          .from('scripts')
          .insert({
            id: scriptId,
            user_id: user.id,
            title: 'Uploaded Script',
            content: content,
            characters: extractCharactersFromContent(content)
          })
          .select()
          .single();

        if (error) throw error;
        
        toast({
          title: "Script Saved",
          description: "Your script has been saved to the database.",
        });
        
        // Refetch the script data
        window.location.reload();
      } catch (error: any) {
        console.error('Error saving script:', error);
        toast({
          title: "Error",
          description: "Failed to save script to database.",
          variant: "destructive",
        });
      }
    }
  };

  // Helper function to extract characters from content
  const extractCharactersFromContent = (text: string): string[] => {
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
    
    // Method 2: Names at the beginning of lines (screenplay format)
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
    
    return Array.from(characterSet).slice(0, 10);
  };

  if (scriptLoading || analysisLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-black text-white">
          <Navigation />
          <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-800 rounded w-1/3"></div>
                <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                <div className="h-32 bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (scriptError || !script) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-black text-white">
          <Navigation />
          <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Script Not Found</h3>
                  <p className="text-gray-400 mb-6">
                    The script you're looking for doesn't exist or you don't have permission to access it.
                  </p>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                  >
                    Back to Dashboard
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <ScriptAnalysisHeader 
              onSignOut={handleSignOut}
              onResetWorkflow={resetWorkflow}
              scriptTitle={script.title}
              showCoachingButton={currentStep === 'results' && !!currentAnalysis}
              onStartCoaching={handleStartCoaching}
            />

            {/* Workflow Steps - hide during coaching, video upload, and evaluation */}
            {!['coaching', 'video-upload', 'video-evaluation'].includes(currentStep) && (
              <ScriptAnalysisWorkflowSteps currentStep={currentStep} />
            )}

            {/* Step Content */}
            {currentStep === 'analyze' && (
              <div className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {script.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure your analysis settings for this script
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <ScriptTextEditor 
                  scriptId={scriptId!}
                  onScriptUpdated={() => {
                    toast({
                      title: "Script Updated",
                      description: "Character detection will be refreshed with your changes.",
                    });
                  }}
                  onContentChange={handleScriptContentChange}
                />
                <ScriptAnalyzer 
                  scriptId={scriptId!} 
                  onAnalysisComplete={handleAnalysisComplete} 
                />
              </div>
            )}

            {currentStep === 'results' && currentAnalysis && (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep('analyze')}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Script Text
                  </Button>
                </div>
                <AnalysisResults 
                  analysis={currentAnalysis} 
                  onStartCoaching={handleStartCoaching} 
                />
              </div>
            )}

            {currentStep === 'coaching' && currentAnalysis && (
              <CoachingSession 
                analysis={{
                  ...currentAnalysis,
                  // Use the current script content if it has been edited
                  analysis_data: {
                    ...currentAnalysis.analysis_data,
                    script_content: currentScriptContent || currentAnalysis.analysis_data?.script_content
                  }
                }}
                onBackToResults={() => setCurrentStep('results')}
                onStartVideoUpload={handleStartVideoUpload}
                onCoachingSessionCreated={handleCoachingSessionCreated}
              />
            )}

            {currentStep === 'video-upload' && currentAnalysis && currentCoachingSessionId && (
              <VideoUpload 
                analysis={currentAnalysis}
                coachingSessionId={currentCoachingSessionId}
                onVideoUploaded={handleVideoUploaded}
                onBackToCoaching={() => setCurrentStep('coaching')}
              />
            )}

            {currentStep === 'video-evaluation' && currentVideoId && currentAnalysis && (
              <VideoEvaluation 
                videoId={currentVideoId}
                analysis={currentAnalysis}
                onBackToUpload={() => setCurrentStep('video-upload')}
                onStartNewAnalysis={resetWorkflow}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default IndividualScriptAnalysis;
