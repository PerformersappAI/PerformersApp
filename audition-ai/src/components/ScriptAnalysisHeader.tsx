
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, FileText, MessageSquare } from 'lucide-react';

interface ScriptAnalysisHeaderProps {
  onSignOut: () => void;
  onResetWorkflow: () => void;
  scriptTitle?: string;
  showCoachingButton?: boolean;
  onStartCoaching?: () => void;
}

const ScriptAnalysisHeader: React.FC<ScriptAnalysisHeaderProps> = ({
  onSignOut,
  onResetWorkflow,
  scriptTitle,
  showCoachingButton = false,
  onStartCoaching
}) => {
  return (
    <Card className="bg-gray-900/50 border-gray-700 mb-8">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Scene Analysis
            </h1>
            {scriptTitle && (
              <p className="text-gray-400 text-lg">
                Working on: <span className="text-white font-medium">{scriptTitle}</span>
              </p>
            )}
            {!scriptTitle && (
              <p className="text-gray-400">
                Analyze your scene with AI-powered acting techniques
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {showCoachingButton && onStartCoaching && (
              <Button 
                onClick={onStartCoaching}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Coaching Session
              </Button>
            )}
            <Button 
              onClick={onResetWorkflow}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 border-0 shadow-lg transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScriptAnalysisHeader;
