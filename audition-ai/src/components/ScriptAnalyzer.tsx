import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAIUsageLimit } from '@/hooks/useAIUsageLimit';
import { SceneSummarySection } from '@/components/SceneSummarySection';
import QuickSceneSummary from '@/components/QuickSceneSummary';
import { DataUseDisclaimer } from '@/components/DataUseDisclaimer';
interface ScriptAnalyzerProps {
  scriptId: string;
  onAnalysisComplete: (analysisId: string) => void;
}
interface Script {
  id: string;
  title: string;
  content: string;
  characters: string[];
  scene_summary?: string;
}
const ScriptAnalyzer: React.FC<ScriptAnalyzerProps> = ({
  scriptId,
  onAnalysisComplete
}) => {
  const [script, setScript] = useState<Script | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [actingMethod, setActingMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    checkLimit,
    updateUsage,
    showLimitNotification
  } = useAIUsageLimit();
  const actingMethods = [{
    value: 'meisner',
    label: 'Meisner Technique',
    description: 'Focus on truthful reactions and living truthfully under imaginary circumstances'
  }, {
    value: 'stanislavski',
    label: 'Stanislavski System',
    description: 'Emotional memory, given circumstances, and the magic if'
  }, {
    value: 'method',
    label: 'Method Acting',
    description: 'Drawing from personal experiences and emotions'
  }, {
    value: 'hagen',
    label: 'Hagen Technique',
    description: 'Substitution and emotional memory work'
  }, {
    value: 'none',
    label: 'None (Natural Analysis)',
    description: 'Analyze performance based on natural observation and general acting principles'
  }];
  useEffect(() => {
    fetchScript();
  }, [scriptId]);
  const fetchScript = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('scripts').select('*').eq('id', scriptId).single();
      if (error) throw error;
      setScript(data as Script);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load script.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleSummaryGenerated = (summary: string) => {
    setScript(prev => prev ? { ...prev, scene_summary: summary } : null);
  };
  const handleAnalyze = async () => {
    if (!selectedCharacter || !actingMethod) {
      toast({
        title: "Missing Information",
        description: "Please select a character and acting method.",
        variant: "destructive"
      });
      return;
    }

    // Validate character exists in script and is not malformed
    if (!script?.characters?.includes(selectedCharacter)) {
      toast({
        title: "Invalid Character",
        description: "Selected character is not found in the script. Please choose a valid character.",
        variant: "destructive"
      });
      return;
    }

    // Check for malformed character names (likely dialogue fragments)
    if (selectedCharacter.length > 30 || selectedCharacter.split(' ').length > 3) {
      toast({
        title: "Invalid Character Selection",
        description: "The selected character appears to be malformed. Please upload the script again or choose a different character.",
        variant: "destructive"
      });
      return;
    }

    // Validate script content
    if (!script?.content || script.content.trim().length < 50) {
      toast({
        title: "Invalid Script",
        description: "Script content is too short or empty. Please upload a valid script.",
        variant: "destructive"
      });
      return;
    }
    if (!checkLimit('script_analyses')) {
      showLimitNotification('Script Analyses');
      return;
    }
    setAnalyzing(true);
    try {
      // Auto-generate scene summary if missing
      if (!script.scene_summary) {
        console.log('No scene summary found, generating one...');
        try {
          const { data: summaryData, error: summaryError } = await supabase.functions.invoke('summarize-scene', {
            body: {
              scriptTitle: script.title,
              scriptContent: script.content
            }
          });

          if (!summaryError && summaryData?.summary) {
            // Update the script in the database with the new summary
            const { error: updateError } = await supabase
              .from('scripts')
              .update({ scene_summary: summaryData.summary })
              .eq('id', scriptId);

            if (!updateError) {
              // Update local state
              setScript(prev => prev ? { ...prev, scene_summary: summaryData.summary } : null);
              console.log('Scene summary generated and saved successfully');
            }
          }
        } catch (summaryError) {
          console.log('Failed to generate scene summary, continuing with analysis:', summaryError);
          // Don't block the analysis if summary generation fails
        }
      }

      console.log('Starting analysis with:', {
        scriptTitle: script?.title,
        selectedCharacter,
        actingMethod,
        scriptLength: script?.content?.length,
        charactersCount: script?.characters?.length
      });
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-script', {
        body: {
          scriptContent: script?.content,
          scriptTitle: script?.title,
          selectedCharacter,
          actingMethod
        }
      });
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      if (!data) {
        throw new Error('No data returned from analysis function');
      }
      await updateUsage('script_analyses');

      // Store the analysis in the database
      const {
        data: analysisData,
        error: analysisError
      } = await supabase.from('script_analyses').insert({
        script_id: scriptId,
        user_id: user?.id,
        selected_character: selectedCharacter,
        acting_method: actingMethod,
        analysis_data: data.analysis_data,
        objectives: data.objectives,
        obstacles: data.obstacles,
        tactics: data.tactics
      }).select().single();
      if (analysisError) throw analysisError;
      toast({
        title: "Analysis Complete!",
        description: `Your ${selectedCharacter} analysis using ${actingMethods.find(m => m.value === actingMethod)?.label} is ready.`
      });
      onAnalysisComplete(analysisData.id);
    } catch (error: any) {
      console.error('Analysis error:', error);
      let errorMessage = "Failed to analyze script. Please try again.";
      let showRetry = true;

      // Parse different error types for better user experience
      if (error.message?.includes('429') || error.message?.includes('quota exceeded')) {
        errorMessage = "🚨 API quota exceeded. Your Google AI plan has reached its daily limit. Please upgrade your Google AI API plan or wait until tomorrow.";
        showRetry = false;
      } else if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        errorMessage = "⏳ Google AI service is temporarily overloaded. Please try again in a few moments.";
      } else if (error.message?.includes('400') || error.message?.includes('Invalid request')) {
        errorMessage = "❌ Invalid script format. Please check your script content and character selection.";
      } else if (error.message?.includes('403') || error.message?.includes('access denied')) {
        errorMessage = "🔑 API access denied. Please check your Google AI API key configuration.";
        showRetry = false;
      } else if (error.message?.includes('API key')) {
        errorMessage = "🔧 AI service configuration error. Please contact support.";
        showRetry = false;
      } else if (error.message?.includes('timeout')) {
        errorMessage = "⏱️ Analysis timed out. Your script might be too long. Try with a shorter script.";
      } else if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        errorMessage = "🌐 Network connection error. Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
        duration: showRetry ? 5000 : 8000
      });
    }
    setAnalyzing(false);
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <span className="ml-2 text-foreground">Loading script...</span>
      </div>;
  }
  if (!script) return null;
  return <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Configure Your Analysis</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Choose your character and acting method to get personalized analysis for <strong>"{script.title}"</strong>
        </p>
      </div>

      {/* Scene Summary */}
      <SceneSummarySection 
        script={script}
        onSummaryGenerated={handleSummaryGenerated}
      />

      {/* Two-Column Layout */}
      <div className="space-y-8">
        
        {/* Left: Configuration */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-6">
            <CardTitle className="text-foreground flex items-center gap-3 text-xl">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              Analysis Configuration
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base leading-relaxed">
              Select the character and method for your personalized scene analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Character Selection */}
            <div className="space-y-4">
              <Label htmlFor="character" className="text-foreground flex items-center gap-3 text-lg font-medium">
                <User className="h-5 w-5 text-primary" />
                Select Character to Analyze
              </Label>
              <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                <SelectTrigger className="bg-background border-border text-foreground h-14 text-base">
                  <SelectValue placeholder="Choose a character from your script..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {script.characters && script.characters.length > 0 ? script.characters.filter(character => character.length <= 30 && character.split(' ').length <= 3 && !/\b(READY|WINNER|ORDERS|CONGRATULATIONS|INCREDIBLE|HAVOC|CRIMSON)\b/i.test(character)).map(character => <SelectItem key={character} value={character} className="text-foreground hover:bg-muted text-base py-3">
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{character}</span>
                            {character.length > 20 && <span className="text-xs text-muted-foreground ml-2">(Verify if valid)</span>}
                          </div>
                        </SelectItem>) : <SelectItem value="no-characters" disabled className="text-muted-foreground">
                      No valid characters found in script
                    </SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Acting Method Selection */}
            <div className="space-y-4">
              <Label htmlFor="method" className="text-foreground text-lg font-medium">
                Acting Method/Technique
              </Label>
              <Select value={actingMethod} onValueChange={setActingMethod}>
                <SelectTrigger className="bg-background border-border text-foreground h-14 text-base">
                  <SelectValue placeholder="Choose your preferred acting method..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {actingMethods.map(method => <SelectItem key={method.value} value={method.value} className="text-foreground hover:bg-muted py-4">
                      <div className="space-y-1">
                        <div className="font-medium text-base">{method.label}</div>
                        <div className="text-sm text-muted-foreground leading-relaxed">{method.description}</div>
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
              {actingMethod && <div className="mt-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary px-4 py-2 text-base">
                    {actingMethods.find(m => m.value === actingMethod)?.label}
                  </Badge>
                </div>}
            </div>

            {/* Analyze Button */}
            <Button onClick={handleAnalyze} disabled={!selectedCharacter || !actingMethod || analyzing} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg h-16">
              {analyzing ? <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Analyzing Character...
                </> : 'Start Character Analysis'}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Scene Summary */}
        <QuickSceneSummary onSummaryGenerated={handleSummaryGenerated} />
        
        <DataUseDisclaimer className="mt-6" />
      </div>
    </div>;
};
export default ScriptAnalyzer;