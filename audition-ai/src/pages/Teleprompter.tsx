import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { FileText, Upload, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ScriptUpload from '@/components/ScriptUpload';
import ScriptTextEditor from '@/components/ScriptTextEditor';
import TeleprompterModeSelection from '@/components/TeleprompterModeSelection';
import TeleprompterHistory from '@/components/teleprompter/TeleprompterHistory';
import EnhancedBasicTeleprompter from '@/components/teleprompter/EnhancedBasicTeleprompter';
import EnhancedAdvancedTeleprompter from '@/components/teleprompter/EnhancedAdvancedTeleprompter';
import EnhancedProTeleprompter from '@/components/teleprompter/EnhancedProTeleprompter';
import { DataUseDisclaimer } from '@/components/DataUseDisclaimer';
import PageHeaderNav from '@/components/PageHeaderNav';

type TeleprompterStep = 'selection' | 'basic' | 'advanced' | 'pro';
type TeleprompterMode = 'basic' | 'advanced' | 'pro';

interface Script {
  id: string;
  title: string;
  content: string;
  characters?: string[];
}

const Teleprompter = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<TeleprompterStep>('selection');
  const [currentScript, setCurrentScript] = useState<Script | null>(null);
  const [selectedMode, setSelectedMode] = useState<TeleprompterMode>('advanced');

  const handleScriptUploaded = async (scriptId: string) => {
    try {
      // Fetch the uploaded script to get full details
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      const script = {
        id: data.id,
        title: data.title,
        content: data.content,
        characters: data.characters || []
      };
      
      setCurrentScript(script);
      setCurrentStep('advanced'); // Skip directly to advanced mode
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load uploaded script.",
        variant: "destructive",
      });
    }
  };

  const handleScriptSelected = async (scriptId: string) => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();

      if (error) throw error;

      const script = {
        id: data.id,
        title: data.title,
        content: data.content,
        characters: data.characters || []
      };
      
      setCurrentScript(script);
      setCurrentStep('advanced'); // Skip directly to advanced mode
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load script.",
        variant: "destructive",
      });
    }
  };

  const handleModeSelected = (mode: TeleprompterMode) => {
    setSelectedMode(mode);
    setCurrentStep(mode);
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
    setCurrentScript(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking session…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to use the teleprompter.</p>
            <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle script updates from teleprompter editors
  const handleScriptUpdated = useCallback((updatedScript: Script) => {
    setCurrentScript(updatedScript);
  }, []);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'selection':
        return (
          <>
            <PageHeaderNav title="Teleprompter" />
            <div className="max-w-5xl mx-auto px-4 pt-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-primary mb-4">
                  Teleprompter
                </h1>
                <p className="text-lg text-muted-foreground">
                  Upload a new script or select from your recent scripts to get started
                </p>
              </div>

            <div className="space-y-8">
              {/* Recent Scripts Section */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <History className="w-6 h-6 text-primary" />
                    Recent Scripts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TeleprompterHistory onScriptSelected={handleScriptSelected} />
                </CardContent>
              </Card>

              {/* Upload New Script Section */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Upload className="w-6 h-6 text-primary" />
                    Upload New Script
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScriptUpload onScriptUploaded={handleScriptUploaded} />
                </CardContent>
              </Card>
              
              <DataUseDisclaimer className="mt-6" />
            </div>
          </div>
          </>
        );

      case 'basic':
        return currentScript && (
          <EnhancedBasicTeleprompter 
            script={currentScript} 
            onBack={handleBackToSelection}
            onScriptUpdated={handleScriptUpdated}
          />
        );
      case 'advanced':
        return currentScript && (
          <EnhancedAdvancedTeleprompter 
            script={currentScript} 
            onBack={handleBackToSelection}
            onScriptUpdated={handleScriptUpdated}
          />
        );
      case 'pro':
        return currentScript && (
          <EnhancedProTeleprompter 
            script={currentScript} 
            onBack={handleBackToSelection}
            onScriptUpdated={handleScriptUpdated}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {currentStep === 'selection' ? (
        <div className="container max-w-7xl mx-auto px-4 pb-8" style={{ marginTop: '100px', paddingTop: '20px' }}>
          {renderCurrentStep()}
        </div>
      ) : (
        renderCurrentStep()
      )}
    </div>
  );
};

export default Teleprompter;