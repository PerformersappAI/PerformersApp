import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Target, Heart, Zap, MessageSquare, Lightbulb, CheckCircle } from 'lucide-react';
import { SceneSummarySection } from '@/components/SceneSummarySection';
import { supabase } from '@/integrations/supabase/client';
import { DataUseDisclaimer } from '@/components/DataUseDisclaimer';

interface AnalysisResultsProps {
  analysis: any;
  onStartCoaching: () => void;
}

// Helper function to parse markdown-style bold text and create readable content
const parseText = (text: string) => {
  if (!text) return null;
  
  // Split text into sentences for better readability
  const sentences = text.split(/(?<=\.)\s+/).filter(sentence => sentence.trim().length > 0);
  
  return sentences.map((sentence, index) => {
    // Handle bold text formatting
    const parts = sentence.split('**');
    const formattedSentence = parts.map((part, partIndex) => {
      if (partIndex % 2 === 1) {
        return <strong key={`${index}-${partIndex}`} className="font-semibold text-foreground">{part}</strong>;
      }
      return part;
    });
    
    return (
      <p key={index} className="mb-3 text-muted-foreground leading-relaxed text-sm">
        {formattedSentence}
      </p>
    );
  });
};

// Helper function to format content as structured list
const formatContent = (text: string) => {
  if (!text) return null;
  
  // Check if text contains multiple distinct points (sentences ending with periods)
  const points = text.split(/[.!?]\s+/).filter(point => point.trim().length > 10);
  
  if (points.length <= 1) {
    return (
      <div className="space-y-2">
        {parseText(text)}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {points.map((point, index) => {
        const trimmedPoint = point.trim();
        if (!trimmedPoint) return null;
        
        // Add period if missing
        const formattedPoint = trimmedPoint.endsWith('.') || trimmedPoint.endsWith('!') || trimmedPoint.endsWith('?') 
          ? trimmedPoint 
          : trimmedPoint + '.';
        
        return (
          <div key={index} className="flex items-start gap-3 bg-muted/20 rounded-lg p-3">
            <div className="w-2 h-2 bg-brand-yellow rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1">
              {parseText(formattedPoint)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  onStartCoaching
}) => {
  const [script, setScript] = useState<any>(null);

  useEffect(() => {
    const fetchScript = async () => {
      if (analysis?.script_id) {
        try {
          const { data } = await supabase
            .from('scripts')
            .select('*')
            .eq('id', analysis.script_id)
            .single();
          
          if (data) {
            setScript(data);
          }
        } catch (error) {
          console.error('Failed to fetch script:', error);
        }
      }
    };

    fetchScript();
  }, [analysis?.script_id]);

  const handleSummaryGenerated = (summary: string) => {
    setScript((prev: any) => prev ? { ...prev, scene_summary: summary } : null);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Character Analysis Complete
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Your script has been analyzed using the {analysis.acting_method} method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              Character: {analysis.selected_character}
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Method: {analysis.acting_method}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Scene Summary Section */}
      {script && (
        <SceneSummarySection 
          script={script}
          onSummaryGenerated={handleSummaryGenerated}
        />
      )}

      {/* Start Coaching Button at Top */}
      <div className="flex justify-center">
        <Button onClick={onStartCoaching} size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg">
          <MessageSquare className="w-5 h-5 mr-2" />
          Start Coaching Session
        </Button>
      </div>

      <div className="space-y-4">
        <Accordion type="multiple" defaultValue={["objectives", "obstacles", "tactics", "insights"]} className="space-y-4">
          <AccordionItem value="objectives" className="border-0">
            <Card className="bg-card border-border">
              <AccordionTrigger className="hover:no-underline p-0">
                <CardHeader className="flex-row items-center space-y-0 pb-4 w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground text-xl">Objectives</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        What your character wants to achieve
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {analysis.objectives?.map((objective: string, index: number) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-5 border-l-4 border-brand-yellow">
                        <div className="flex items-start gap-4">
                          <span className="text-brand-yellow font-bold text-lg mt-1 flex-shrink-0 bg-brand-yellow/20 w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            {formatContent(objective)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="obstacles" className="border-0">
            <Card className="bg-card border-border">
              <AccordionTrigger className="hover:no-underline p-0">
                <CardHeader className="flex-row items-center space-y-0 pb-4 w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Zap className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground text-xl">Obstacles</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        What stands in your character's way
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {analysis.obstacles?.map((obstacle: string, index: number) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-5 border-l-4 border-red-400">
                        <div className="flex items-start gap-4">
                          <span className="text-red-400 font-bold text-lg mt-1 flex-shrink-0 bg-red-400/20 w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            {formatContent(obstacle)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="tactics" className="border-0">
            <Card className="bg-card border-border">
              <AccordionTrigger className="hover:no-underline p-0">
                <CardHeader className="flex-row items-center space-y-0 pb-4 w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Heart className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground text-xl">Tactics</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        How your character tries to achieve their goals
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {analysis.tactics?.map((tactic: string, index: number) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-5 border-l-4 border-green-400">
                        <div className="flex items-start gap-4">
                          <span className="text-green-400 font-bold text-lg mt-1 flex-shrink-0 bg-green-400/20 w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            {formatContent(tactic)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="insights" className="border-0">
            <Card className="bg-card border-border">
              <AccordionTrigger className="hover:no-underline p-0">
                <CardHeader className="flex-row items-center space-y-0 pb-4 w-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground text-xl">Key Insights</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Important observations about your character
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {analysis.analysis_data?.character_analysis && (
                      <div className="bg-muted/30 rounded-lg p-5 border-l-4 border-purple-400">
                        <h4 className="text-purple-400 font-semibold mb-4 text-lg flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-400/20 rounded-full flex items-center justify-center">
                            <span className="text-xs">1</span>
                          </div>
                          Character Analysis
                        </h4>
                        <div className="ml-8">
                          {formatContent(analysis.analysis_data.character_analysis)}
                        </div>
                      </div>
                    )}
                    {analysis.analysis_data?.emotional_journey && (
                      <div className="bg-muted/30 rounded-lg p-5 border-l-4 border-purple-400">
                        <h4 className="text-purple-400 font-semibold mb-4 text-lg flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-400/20 rounded-full flex items-center justify-center">
                            <span className="text-xs">2</span>
                          </div>
                          Emotional Journey
                        </h4>
                        <div className="ml-8">
                          {formatContent(analysis.analysis_data.emotional_journey)}
                        </div>
                      </div>
                    )}
                    {analysis.analysis_data?.method_application && (
                      <div className="bg-muted/30 rounded-lg p-5 border-l-4 border-purple-400">
                        <h4 className="text-purple-400 font-semibold mb-4 text-lg flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-400/20 rounded-full flex items-center justify-center">
                            <span className="text-xs">3</span>
                          </div>
                          Method Application
                        </h4>
                        <div className="ml-8">
                          {formatContent(analysis.analysis_data.method_application)}
                        </div>
                      </div>
                    )}
                    {analysis.analysis_data?.scene_work && (
                      <div className="bg-muted/30 rounded-lg p-5 border-l-4 border-purple-400">
                        <h4 className="text-purple-400 font-semibold mb-4 text-lg flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-400/20 rounded-full flex items-center justify-center">
                            <span className="text-xs">4</span>
                          </div>
                          Scene Work
                        </h4>
                        <div className="ml-8">
                          {formatContent(analysis.analysis_data.scene_work)}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Ready for Personalized Coaching?</h3>
            <p className="text-muted-foreground mb-4">
              Start a guided coaching session based on your scene analysis
            </p>
            <Button onClick={onStartCoaching} className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-yellow-foreground font-bold px-8 py-3">
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Coaching Session
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <DataUseDisclaimer className="mt-6" />
    </div>
  );
};

export default AnalysisResults;
