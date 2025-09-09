
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, Download, FileText, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateAnalysisPDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

interface VideoAnalysisReportProps {
  analysis: any;
  videoSubmission: any;
  onViewObjectives?: () => void;
}

const VideoAnalysisReport: React.FC<VideoAnalysisReportProps> = ({
  analysis,
  videoSubmission,
  onViewObjectives
}) => {
  const { toast } = useToast();
  
  const aiAnalysis = videoSubmission.ai_analysis;
  const overallScore = videoSubmission.evaluation_score;
  const technicalScore = aiAnalysis?.technical_score;
  const performanceScore = aiAnalysis?.performance_score;

  // Get feedback arrays safely
  const sceneNotes = aiAnalysis?.performance_feedback || [];
  const technicalNotes = aiAnalysis?.technical_feedback || [];
  const keyInsights = aiAnalysis?.key_insights || [];

  // Determine if objective was achieved based on performance score
  const objectiveAchieved = performanceScore >= 75;

  const handleDownloadPDF = () => {
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
  };

  const handleViewObjectives = () => {
    if (onViewObjectives) {
      onViewObjectives();
    } else {
      toast({
        title: "Scene Objectives",
        description: `Objectives: ${analysis.objectives?.join(', ') || 'None specified'}`,
      });
    }
  };

  const handleViewGuidelines = () => {
    toast({
      title: "Acting Style Guidelines",
      description: `Method: ${analysis.acting_method} - Focus on truthful reactions and authentic character choices.`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-card text-foreground p-8 space-y-8 print:shadow-none">
      {/* Header */}
      <div className="text-center border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">🎭 Actor App – Video Analysis Report</h1>
        <p className="text-muted-foreground">Professional Self-Tape Evaluation</p>
      </div>

      {/* Key Insights - Now populated */}
      {keyInsights.length > 0 && (
        <Card className="border-brand-yellow/50 bg-brand-yellow/10">
          <CardHeader className="bg-brand-yellow/20">
            <CardTitle className="text-xl text-foreground flex items-center gap-2">
              💡 Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-2">
              {keyInsights.map((insight: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-foreground">
                  <span className="text-brand-yellow mt-1">•</span>
                  <span className="font-medium">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Scene Performance Summary */}
      <Card className="border-border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-xl text-foreground flex items-center gap-2">
            🎬 Scene Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div>
                <span className="font-medium text-muted-foreground">Actor Name:</span>
                <span className="ml-2 text-foreground">[Auto-filled from profile]</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Character Name:</span>
                <span className="ml-2 text-foreground">{analysis.selected_character}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-muted-foreground">Acting Method:</span>
                <span className="ml-2 text-foreground">{analysis.acting_method}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Overall Score:</span>
                <span className="ml-2 font-bold text-foreground">{overallScore}/100</span>
              </div>
            </div>
          </div>

          {/* Script Match Analysis */}
          {aiAnalysis?.script_match_analysis && (
            <div className="mb-6 p-4 bg-blue-500/10 rounded-lg">
              <h4 className="font-medium text-muted-foreground mb-2">📋 Script Match Analysis:</h4>
              <p className="text-foreground">{aiAnalysis.script_match_analysis}</p>
            </div>
          )}

          {/* Scene Notes */}
          <div className="mb-6">
            <h4 className="font-medium text-muted-foreground mb-3">📝 Performance Notes:</h4>
            <ul className="space-y-2">
              {sceneNotes.length > 0 ? sceneNotes.slice(0, 5).map((note: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-foreground">
                  <span className="text-brand-yellow mt-1">•</span>
                  <span>{note}</span>
                </li>
              )) : (
                <li className="text-muted-foreground italic">Performance feedback will appear here after evaluation</li>
              )}
            </ul>
          </div>

          {/* Objective Status */}
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <span className="font-medium text-muted-foreground">Objective Status:</span>
            {objectiveAchieved ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Achieved
              </Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
                <X className="w-4 h-4" />
                Not Achieved
              </Badge>
            )}
            <span className="text-sm text-muted-foreground ml-2">
              (Based on scene analysis and performance match)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Technical Self-Tape Review */}
      <Card className="border-border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-xl text-foreground flex items-center gap-2">
            🎥 Technical Self-Tape Review
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {technicalNotes.length > 0 ? technicalNotes.map((note: string, index: number) => {
              // Categorize notes based on content
              let category = 'General';
              let icon = '📋';
              
              if (note.toLowerCase().includes('lighting')) {
                category = 'Lighting';
                icon = '💡';
              } else if (note.toLowerCase().includes('audio') || note.toLowerCase().includes('sound')) {
                category = 'Audio';
                icon = '🎤';
              } else if (note.toLowerCase().includes('camera') || note.toLowerCase().includes('framing')) {
                category = 'Framing';
                icon = '📷';
              } else if (note.toLowerCase().includes('background')) {
                category = 'Background';
                icon = '🖼️';
              }

              return (
                <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b border-border last:border-b-0">
                  <div className="font-medium text-muted-foreground flex items-center gap-2">
                    <span>{icon}</span>
                    {category}
                  </div>
                  <div className="col-span-3 text-foreground">
                    {note}
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-muted-foreground italic">
                Technical feedback will appear here after video evaluation
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scores Summary */}
      <Card className="border-border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-xl text-foreground">📊 Performance Scores</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{overallScore || 'N/A'}</div>
              <div className="text-sm text-muted-foreground mt-1">Overall Performance</div>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{technicalScore || 'N/A'}</div>
              <div className="text-sm text-muted-foreground mt-1">Technical Quality</div>
            </div>
            <div className="p-4 bg-brand-yellow/10 rounded-lg">
              <div className="text-3xl font-bold text-brand-yellow">{performanceScore || 'N/A'}</div>
              <div className="text-sm text-muted-foreground mt-1">Acting Performance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add-Ons Section */}
      <Card className="border-border">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-xl text-foreground flex items-center gap-2">
            📎 Additional Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF Summary
            </Button>
            <Button 
              variant="outline" 
              onClick={handleViewObjectives}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Scene Objectives
            </Button>
            <Button 
              variant="outline" 
              onClick={handleViewGuidelines}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Acting Style Guidelines
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
        Generated by AI Actor • {new Date().toLocaleDateString()} • Professional Self-Tape Analysis
      </div>
    </div>
  );
};

export default VideoAnalysisReport;
