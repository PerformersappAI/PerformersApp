
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Star, ArrowLeft, RotateCcw, AlertTriangle, CheckCircle, FileText, BarChart3, FileCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAIUsageLimit } from '@/hooks/useAIUsageLimit';
import VideoAnalysisReport from './VideoAnalysisReport';
import { generateAnalysisPDF } from '@/utils/pdfGenerator';
import { DataUseDisclaimer } from '@/components/DataUseDisclaimer';

interface VideoEvaluationProps {
  videoId: string;
  analysis: any;
  onBackToUpload: () => void;
  onStartNewAnalysis: () => void;
}

interface VideoSubmission {
  id: string;
  video_url: string;
  video_title: string;
  evaluation_status: string;
  evaluation_score: number | null;
  evaluation_notes: string | null;
  created_at: string;
  ai_analysis: any;
  coaching_session_id: string;
  storage_file_path?: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

const VideoEvaluation: React.FC<VideoEvaluationProps> = ({ 
  videoId, 
  analysis, 
  onBackToUpload, 
  onStartNewAnalysis 
}) => {
  const [videoSubmission, setVideoSubmission] = useState<VideoSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkLimit, updateUsage, showLimitNotification, getRemainingUses } = useAIUsageLimit();

  useEffect(() => {
    fetchVideoSubmission();
  }, [videoId]);

  const fetchVideoSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('video_submissions')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) throw error;
      setVideoSubmission(data as VideoSubmission);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load video submission.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const cleanupVideoFile = async (filePath: string) => {
    try {
      console.log('Cleaning up video file:', filePath);
      const { error } = await supabase.storage
        .from('videos')
        .remove([filePath]);
      
      if (error) {
        console.error('Error deleting video file:', error);
      } else {
        console.log('Video file deleted successfully');
      }
    } catch (error) {
      console.error('Error during file cleanup:', error);
    }
  };

  const startAIEvaluation = async (submission: VideoSubmission) => {
    console.log('Starting AI evaluation for submission:', submission.id);
    
    if (!checkLimit('video_verifications')) {
      console.log('Usage limit reached for video verifications');
      showLimitNotification('Video Evaluations');
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your daily video evaluation limit. Please upgrade your plan or try again tomorrow.",
        variant: "destructive",
      });
      return;
    }

    setEvaluating(true);

    try {
      console.log('Updating video status to in_progress');
      await supabase
        .from('video_submissions')
        .update({ evaluation_status: 'in_progress' })
        .eq('id', submission.id);

      console.log('Fetching coaching session data for context');
      const { data: coachingData } = await supabase
        .from('coaching_sessions')
        .select('chat_history')
        .eq('id', submission.coaching_session_id)
        .single();

      let coachingNotes = 'Standard coaching session completed';
      
      if (coachingData?.chat_history && Array.isArray(coachingData.chat_history)) {
        const chatHistory = coachingData.chat_history as unknown as ChatMessage[];
        coachingNotes = chatHistory
          .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
          .join('\n')
          .slice(0, 1000);
      }

      console.log('Calling evaluate-video edge function');
      const { data: evaluationData, error: evalError } = await supabase.functions.invoke('evaluate-video', {
        body: {
          videoUrl: submission.video_url,
          analysis: analysis,
          coachingNotes: coachingNotes
        }
      });

      if (evalError) {
        console.error('Edge function error:', evalError);
        throw evalError;
      }

      console.log('Evaluation data received:', evaluationData);

      await updateUsage('video_verifications');

      const { error: updateError } = await supabase
        .from('video_submissions')
        .update({
          evaluation_status: 'completed',
          evaluation_score: evaluationData.overall_score,
          evaluation_notes: evaluationData.notes,
          evaluated_at: new Date().toISOString(),
          ai_analysis: {
            ...evaluationData.analysis,
            technical_score: evaluationData.technical_score,
            performance_score: evaluationData.performance_score,
            overall_score: evaluationData.overall_score
          }
        })
        .eq('id', submission.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      // Clean up the video file after successful analysis
      if (submission.storage_file_path) {
        await cleanupVideoFile(submission.storage_file_path);
        
        // Update the database to remove the video URL and file path since file is deleted
        await supabase
          .from('video_submissions')
          .update({
            video_url: null,
            storage_file_path: null
          })
          .eq('id', submission.id);
      }

      console.log('Evaluation completed successfully');
      await fetchVideoSubmission();

      toast({
        title: "AI Evaluation Complete!",
        description: `Your performance as ${analysis.selected_character} has been analyzed. Video file has been removed to save space.`,
      });

    } catch (error: any) {
      console.error('Evaluation error:', error);
      toast({
        title: "Evaluation Failed",
        description: error.message || "Failed to evaluate video. Please try again.",
        variant: "destructive",
      });
      
      await supabase
        .from('video_submissions')
        .update({ evaluation_status: 'pending' })
        .eq('id', submission.id);
    }
    
    setEvaluating(false);
  };

  const handleDownloadPDF = () => {
    if (videoSubmission) {
      try {
        generateAnalysisPDF({ analysis, videoSubmission });
        toast({
          title: "PDF Generated",
          description: "Your analysis report has been downloaded successfully!",
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewObjectives = () => {
    toast({
      title: "Scene Objectives",
      description: `Objectives: ${analysis.objectives?.join(', ') || 'None specified'}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground">Loading video evaluation...</div>
      </div>
    );
  }

  if (!videoSubmission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground">Video submission not found.</div>
      </div>
    );
  }

  const canEvaluate = checkLimit('video_verifications');
  const remainingEvaluations = getRemainingUses('video_verifications');
  const videoDeleted = !videoSubmission.video_url;

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">AI Video Evaluation</h2>
        <div className="flex gap-4">
          {videoSubmission.evaluation_status === 'completed' && (
            <Button
              onClick={handleDownloadPDF}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}
          <Button
            onClick={onStartNewAnalysis}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
          <Button
            variant="ghost"
            onClick={onBackToUpload}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>

      {/* Script Context Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-brand-yellow" />
            Performance Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Badge variant="secondary" className="bg-brand-yellow/20 text-brand-yellow mb-2">
                Character: {analysis.selected_character}
              </Badge>
            </div>
            <div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 mb-2">
                Method: {analysis.acting_method}
              </Badge>
            </div>
            <div>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 mb-2">
                Script-Based Analysis
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {!canEvaluate && videoSubmission.evaluation_status === 'pending' && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Daily Evaluation Limit Reached</p>
              <p className="text-red-400 text-sm mt-1">
                AI Actor is now under high usage - please come back in 5 minutes or tomorrow for video evaluation.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Video className="w-5 h-5" />
              Your Audition Video
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {videoSubmission.video_title}
              {canEvaluate && remainingEvaluations <= 1 && videoSubmission.evaluation_status === 'pending' && (
                <span className="text-brand-yellow block mt-1">
                  ⚠️ {remainingEvaluations} evaluation remaining today
                </span>
              )}
              {videoDeleted && (
                <span className="text-blue-400 block mt-1">
                  📁 Video removed after analysis to save storage space
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {videoDeleted ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-medium">Video Analyzed & Removed</p>
                  <p className="text-sm mt-1">File deleted to save storage space</p>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full"
                  src={videoSubmission.video_url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              <Badge 
                variant={
                  videoSubmission.evaluation_status === 'completed' ? 'default' :
                  videoSubmission.evaluation_status === 'in_progress' ? 'secondary' : 'outline'
                }
              >
                {videoSubmission.evaluation_status.replace('_', ' ')}
              </Badge>
              <span className="text-muted-foreground text-sm">
                Uploaded {new Date(videoSubmission.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI Evaluation - Shows button or progress */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Star className="w-5 h-5" />
              AI Performance Evaluation
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Technical & Performance Analysis for {analysis.selected_character}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoSubmission.evaluation_status === 'pending' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-foreground mb-4">Ready for comprehensive AI evaluation</p>
                  <Button
                    onClick={() => startAIEvaluation(videoSubmission)}
                    disabled={!canEvaluate || evaluating}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                  >
                    {evaluating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Analyzing Performance...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Evaluate Performance
                      </>
                    )}
                  </Button>
                  {!canEvaluate && (
                    <p className="text-red-400 text-sm mt-2">
                      Daily evaluation limit reached. Please upgrade or try again tomorrow.
                    </p>
                  )}
                </div>
              </div>
            )}

            {(evaluating || videoSubmission.evaluation_status === 'in_progress') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent"></div>
                  <span className="text-foreground">Analyzing technical quality and performance...</span>
                </div>
                <Progress value={75} className="w-full" />
                <p className="text-muted-foreground text-sm">
                  Evaluating lighting, audio, camera work, and acting performance. Video will be removed after analysis.
                </p>
              </div>
            )}

            {videoSubmission.evaluation_status === 'completed' && (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-brand-yellow">
                  {videoSubmission.evaluation_score}/100
                </div>
                <p className="text-foreground text-lg leading-relaxed">
                  {videoSubmission.ai_analysis?.overall_performance || 'Analysis completed'}
                </p>
                <p className="text-muted-foreground text-sm">
                  Comprehensive evaluation complete - view detailed analysis below
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Show analysis results with tabs when evaluation is completed */}
      {videoSubmission.evaluation_status === 'completed' && videoSubmission.ai_analysis && (
        <div className="mt-8">
          <Tabs defaultValue="detailed" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted border-border">
              <TabsTrigger 
                value="detailed" 
                className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <BarChart3 className="w-4 h-4" />
                Detailed Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="report" 
                className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <FileCheck className="w-4 h-4" />
                Professional Report
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="detailed" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Technical Analysis */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Technical Analysis</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Video quality and production assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Technical Score</span>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                          {videoSubmission.ai_analysis?.technical_score || 'N/A'}/100
                        </Badge>
                      </div>
                      
                      {videoSubmission.ai_analysis?.technical_feedback && videoSubmission.ai_analysis.technical_feedback.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-foreground font-medium">Feedback:</h4>
                          <ul className="space-y-1">
                            {videoSubmission.ai_analysis.technical_feedback.map((feedback: string, index: number) => (
                              <li key={index} className="text-foreground text-sm flex items-start gap-2 leading-relaxed">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>{feedback}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Analysis */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Performance Analysis</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Acting technique and character portrayal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Performance Score</span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          {videoSubmission.ai_analysis?.performance_score || 'N/A'}/100
                        </Badge>
                      </div>
                      
                      {videoSubmission.ai_analysis?.performance_feedback && videoSubmission.ai_analysis.performance_feedback.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-foreground font-medium">Feedback:</h4>
                          <ul className="space-y-1">
                            {videoSubmission.ai_analysis.performance_feedback.map((feedback: string, index: number) => (
                              <li key={index} className="text-foreground text-sm flex items-start gap-2 leading-relaxed">
                                <span className="text-green-400 mt-1">•</span>
                                <span>{feedback}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="report" className="mt-6">
              <VideoAnalysisReport 
                analysis={analysis}
                videoSubmission={videoSubmission}
                onViewObjectives={handleViewObjectives}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      <DataUseDisclaimer className="mt-6" />
    </div>
  );
};

export default VideoEvaluation;
