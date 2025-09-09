import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickSceneSummaryProps {
  onSummaryGenerated?: (summary: string) => void;
}

const QuickSceneSummary: React.FC<QuickSceneSummaryProps> = ({ 
  onSummaryGenerated 
}) => {
  const [scriptText, setScriptText] = useState('');
  const [summary, setSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    if (!scriptText.trim()) {
      toast({
        title: "Missing Script",
        description: "Please paste your script content first.",
        variant: "destructive"
      });
      return;
    }

    if (scriptText.trim().length < 50) {
      toast({
        title: "Script Too Short",
        description: "Please provide a longer script excerpt for better analysis.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingSummary(true);
    
    try {
      console.log('Generating scene summary for pasted text...');
      
      const { data, error } = await supabase.functions.invoke('summarize-scene', {
        body: {
          scriptTitle: 'Pasted Script',
          scriptContent: scriptText
        }
      });

      if (error) {
        console.error('Summary generation error:', error);
        throw error;
      }

      if (!data?.summary) {
        throw new Error('No summary returned from the service');
      }

      setSummary(data.summary);
      onSummaryGenerated?.(data.summary);
      
      toast({
        title: "Summary Generated!",
        description: "Your scene summary has been created successfully."
      });

      console.log('Scene summary generated successfully');

    } catch (error: any) {
      console.error('Error generating summary:', error);
      
      let errorMessage = "Failed to generate scene summary. Please try again.";
      
      if (error.message?.includes('429') || error.message?.includes('quota exceeded')) {
        errorMessage = "🚨 API quota exceeded. Please try again later.";
      } else if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        errorMessage = "⏳ Service temporarily overloaded. Please try again in a few moments.";
      } else if (error.message?.includes('400')) {
        errorMessage = "❌ Invalid script content. Please check your text and try again.";
      } else if (error.message?.includes('timeout')) {
        errorMessage = "⏱️ Request timed out. Your script might be too long.";
      }

      toast({
        title: "Summary Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
    
    setGeneratingSummary(false);
  };

  const clearAll = () => {
    setScriptText('');
    setSummary('');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-6">
        <CardTitle className="text-foreground flex items-center gap-3 text-xl">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          Quick Scene Summary
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base leading-relaxed">
          Paste any script text below and get an instant AI-powered summary of the scene
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Script Input */}
        <div className="space-y-3">
          <Label htmlFor="script-text" className="text-foreground text-base font-medium">
            Paste Script Content
          </Label>
          <Textarea
            id="script-text"
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="Paste your script text here... (minimum 50 characters for meaningful analysis)"
            className="min-h-[200px] bg-background border-border text-foreground resize-y text-base"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{scriptText.length} characters</span>
            {scriptText.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateSummary} 
          disabled={!scriptText.trim() || scriptText.trim().length < 50 || generatingSummary}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base h-12"
        >
          {generatingSummary ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Generating Summary...
            </>
          ) : (
            <>
              <Sparkles className="mr-3 h-5 w-5" />
              Summarize Scene
            </>
          )}
        </Button>

        {/* Summary Output */}
        {summary && (
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-foreground text-base font-medium">
              Generated Summary
            </Label>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-foreground leading-relaxed text-base">
                {summary}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickSceneSummary;