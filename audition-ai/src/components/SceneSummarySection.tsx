import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SceneSummarySectionProps {
  script: {
    id: string;
    title: string;
    content: string;
    scene_summary?: string;
  };
  onSummaryGenerated: (summary: string) => void;
}

export const SceneSummarySection: React.FC<SceneSummarySectionProps> = ({
  script,
  onSummaryGenerated
}) => {
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const { toast } = useToast();

  const generateSceneSummary = async () => {
    if (!script) return;
    
    console.log('Starting scene summary generation for script:', script.id);
    setGeneratingSummary(true);
    
    try {
      console.log('Invoking summarize-scene function...');
      const { data, error } = await supabase.functions.invoke('summarize-scene', {
        body: {
          scriptTitle: script.title,
          scriptContent: script.content
        }
      });

      console.log('Summary function response:', { data, error });

      if (error) {
        console.error('Summary function error:', error);
        throw error;
      }

      if (!data?.summary) {
        console.error('No summary in response:', data);
        throw new Error('No summary generated');
      }

      console.log('Generated summary:', data.summary);

      // Update the script in the database with the new summary
      console.log('Updating script in database...');
      const { error: updateError } = await supabase
        .from('scripts')
        .update({ scene_summary: data.summary })
        .eq('id', script.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('Script updated successfully');
      
      // Notify parent component
      onSummaryGenerated(data.summary);

      toast({
        title: "Summary Generated!",
        description: "Scene summary has been created successfully."
      });
    } catch (error: any) {
      console.error('Complete summary generation error:', error);
      
      let errorMessage = "Failed to generate scene summary. Please try again.";
      
      if (error.message?.includes('AI service not configured')) {
        errorMessage = "AI service is not properly configured. Please contact support.";
      } else if (error.message?.includes('429') || error.message?.includes('quota')) {
        errorMessage = "API quota exceeded. Please try again later.";
      } else if (error.message?.includes('Network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Summary Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
    setGeneratingSummary(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground flex items-center justify-between text-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            Scene Summary
          </div>
          {script.scene_summary && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateSceneSummary}
              disabled={generatingSummary}
              className="h-8 px-3"
            >
              {generatingSummary ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {generatingSummary ? 'Generating...' : 'Regenerate'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {script.scene_summary ? (
          <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
            <p className="text-foreground text-base leading-relaxed font-medium">
              {script.scene_summary}
            </p>
          </div>
        ) : (
          <div className="bg-muted/20 rounded-lg p-6 text-center border-2 border-dashed border-muted-foreground/20">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-base mb-4">
              No scene summary available yet. Generate one to get AI insights about what's happening in this scene.
            </p>
            <Button
              variant="outline"
              onClick={generateSceneSummary}
              disabled={generatingSummary}
              className="mx-auto"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Scene Summary
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};