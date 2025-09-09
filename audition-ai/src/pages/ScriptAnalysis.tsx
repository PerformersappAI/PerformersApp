import Navigation from "@/components/Navigation";
import AuthModal from "@/components/AuthModal";
import ScriptUpload from "@/components/ScriptUpload";
import ScriptAnalyzer from "@/components/ScriptAnalyzer";
import ScriptTextEditor from "@/components/ScriptTextEditor";
import AnalysisResults from "@/components/AnalysisResults";
import CoachingSession from "@/components/CoachingSession";
import VideoUpload from "@/components/VideoUpload";
import VideoEvaluation from "@/components/VideoEvaluation";
import ScriptAnalysisMarketing from "@/components/ScriptAnalysisMarketing";
import ScriptStepsNav from "@/components/analysis/ScriptStepsNav";
import ScriptAnalysisHeader from "@/components/ScriptAnalysisHeader";
import ScriptAnalysisHistory from "@/components/ScriptAnalysisHistory";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
type AnalysisStep = 'upload' | 'analyze' | 'results' | 'coaching' | 'video-upload' | 'video-evaluation';
const ScriptAnalysis = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [currentScriptId, setCurrentScriptId] = useState<string>('');
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string>('');
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [currentCoachingSessionId, setCurrentCoachingSessionId] = useState<string>('');
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [currentScriptContent, setCurrentScriptContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState('analysis');
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const handleStartAnalysisClick = () => {
    if (user) {
      setCurrentStep('upload');
    } else {
      setIsAuthModalOpen(true);
    }
  };
  const handleScriptUploaded = (scriptId: string) => {
    console.log('[ScriptAnalysis] Script uploaded, transitioning to analyze step. ScriptId:', scriptId);
    setCurrentScriptId(scriptId);
    setCurrentStep('analyze');
    toast({
      title: "Script uploaded!",
      description: "Now configure your analysis settings."
    });
  };
  const handleAnalysisComplete = async (analysisId: string) => {
    console.log('[ScriptAnalysis] Analysis complete, fetching results. AnalysisId:', analysisId);
    setCurrentAnalysisId(analysisId);
    try {
      // Fetch the actual analysis data from the database
      const {
        data: analysisData,
        error
      } = await supabase.from('script_analyses').select('*').eq('id', analysisId).single();
      if (error) {
        console.error('Error fetching analysis:', error);
        toast({
          title: "Error",
          description: "Failed to load analysis results.",
          variant: "destructive"
        });
        return;
      }
      console.log('[ScriptAnalysis] Analysis data fetched:', analysisData);
      setCurrentAnalysis(analysisData);
      setCurrentStep('results');
      toast({
        title: "Analysis complete!",
        description: "Your scene analysis is ready."
      });
    } catch (error) {
      console.error('Error in handleAnalysisComplete:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis results.",
        variant: "destructive"
      });
    }
  };
  const handleStartCoaching = () => {
    console.log('[ScriptAnalysis] Starting coaching session...');
    setCurrentStep('coaching');
    toast({
      title: "Starting coaching session!",
      description: "Your personalized coaching session is ready."
    });
  };
  const handleCoachingSessionCreated = (coachingSessionId: string) => {
    setCurrentCoachingSessionId(coachingSessionId);
  };
  const handleStartVideoUpload = () => {
    setCurrentStep('video-upload');
    toast({
      title: "Ready for video upload!",
      description: "Upload your audition video for evaluation."
    });
  };
  const handleVideoUploaded = (videoId: string) => {
    setCurrentVideoId(videoId);
    setCurrentStep('video-evaluation');
    toast({
      title: "Video uploaded successfully!",
      description: "Your audition video is being evaluated."
    });
  };
  const handleSignOut = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setCurrentStep('upload');
      setCurrentScriptId('');
      setCurrentAnalysisId('');
      setCurrentAnalysis(null);
      setCurrentCoachingSessionId('');
      setCurrentVideoId('');
      setCurrentScriptContent('');
      toast({
        title: "Signed out",
        description: "You've been signed out successfully."
      });
    }
  };
  const resetWorkflow = () => {
    setCurrentStep('upload');
    setCurrentScriptId('');
    setCurrentAnalysisId('');
    setCurrentAnalysis(null);
    setCurrentCoachingSessionId('');
    setCurrentVideoId('');
    setCurrentScriptContent('');
  };
  const handleScriptContentChange = (content: string) => {
    setCurrentScriptContent(content);
  };
  const handleContinueFromHistory = (scriptId: string) => {
    navigate(`/analysis/${scriptId}`);
  };
  if (user) {
    return <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="pt-16">
          {/* Hero Header */}
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Scene Analysis</h1>
                  <p className="mt-2 text-muted-foreground">Analyze scenes with AI-powered insights and coaching</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={resetWorkflow} variant="outline" size="sm">
                    New Analysis
                  </Button>
                  
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Tabs Navigation */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="analysis" className="text-sm font-medium">
                      Current Analysis
                    </TabsTrigger>
                    <TabsTrigger 
                      value="history" 
                      className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-yellow-500 data-[state=active]:text-black data-[state=inactive]:text-yellow-600 data-[state=inactive]:hover:text-yellow-500 font-semibold"
                    >
                      Analysis History
                    </TabsTrigger>
                  </TabsList>
                  {/* Blinking Arrow */}
                  <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-yellow-500 animate-pulse">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Guidance Text */}
              <div className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
                <p>If you go away from this screen and lose your scene, you can find all your scenes in "Analysis History"</p>
              </div>

              {/* Analysis Tab */}
              <TabsContent value="analysis" className="space-y-8">
                {/* Progress Steps */}
                <ScriptStepsNav currentStep={currentStep} />

                {/* Content Area */}
                 <div className="space-y-6">
                   {currentStep === 'upload' && (
                     <div className="bg-card border border-border rounded-lg p-8">
                       <ScriptUpload onScriptUploaded={handleScriptUploaded} />
                     </div>
                   )}

                  {currentStep === 'analyze' && currentScriptId && (
                    <div className="space-y-6">
                      <div className="bg-card border border-border rounded-lg p-8">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-semibold text-foreground mb-2">Configure Analysis</h2>
                          <p className="text-muted-foreground">Edit your script and select character and method for analysis</p>
                        </div>
                        <ScriptTextEditor 
                          scriptId={currentScriptId} 
                          onScriptUpdated={() => {
                            toast({
                              title: "Script Updated",
                              description: "Character detection will be refreshed with your changes."
                            });
                          }} 
                          onContentChange={handleScriptContentChange} 
                        />
                      </div>
                      
                      <div className="bg-card border border-border rounded-lg p-8">
                        <ScriptAnalyzer 
                          scriptId={currentScriptId} 
                          onAnalysisComplete={handleAnalysisComplete} 
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 'results' && currentAnalysis && (
                    <div className="bg-card border border-border rounded-lg p-8">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-2">Analysis Results</h2>
                        <p className="text-muted-foreground">Review your character analysis and insights</p>
                      </div>
                      <AnalysisResults analysis={currentAnalysis} onStartCoaching={handleStartCoaching} />
                    </div>
                  )}

                  {currentStep === 'coaching' && currentAnalysis && (
                    <div className="bg-card border border-border rounded-lg p-8">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-2">Coaching Session</h2>
                        <p className="text-muted-foreground">Get personalized coaching based on your analysis</p>
                      </div>
                      <CoachingSession 
                        analysis={{
                          ...currentAnalysis,
                          analysis_data: {
                            ...currentAnalysis.analysis_data,
                            script_content: currentScriptContent || currentAnalysis.analysis_data?.script_content
                          }
                        }} 
                        onBackToResults={() => setCurrentStep('results')} 
                        onStartVideoUpload={handleStartVideoUpload} 
                        onCoachingSessionCreated={handleCoachingSessionCreated} 
                      />
                    </div>
                  )}

                  {currentStep === 'video-upload' && currentAnalysis && currentCoachingSessionId && (
                    <div className="bg-card border border-border rounded-lg p-8">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-2">Upload Audition Video</h2>
                        <p className="text-muted-foreground">Upload your performance for evaluation</p>
                      </div>
                      <VideoUpload 
                        analysis={currentAnalysis} 
                        coachingSessionId={currentCoachingSessionId} 
                        onVideoUploaded={handleVideoUploaded} 
                        onBackToCoaching={() => setCurrentStep('coaching')} 
                      />
                    </div>
                  )}

                  {currentStep === 'video-evaluation' && currentVideoId && currentAnalysis && (
                    <div className="bg-card border border-border rounded-lg p-8">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-2">Video Evaluation</h2>
                        <p className="text-muted-foreground">Review your performance analysis</p>
                      </div>
                      <VideoEvaluation 
                        videoId={currentVideoId} 
                        analysis={currentAnalysis} 
                        onBackToUpload={() => setCurrentStep('video-upload')} 
                        onStartNewAnalysis={resetWorkflow} 
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <ScriptAnalysisHistory onContinueAnalysis={handleContinueFromHistory} onStartFirstAnalysis={() => setActiveTab('analysis')} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>;
  }

  // Marketing page for non-authenticated users
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <ScriptAnalysisMarketing onStartAnalysisClick={handleStartAnalysisClick} />
        </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>;
};
export default ScriptAnalysis;