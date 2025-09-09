
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, MessageSquare, Video, CheckCircle } from 'lucide-react';
import { useAIUsageLimit } from '@/hooks/useAIUsageLimit';

const AIUsageIndicator: React.FC = () => {
  const { usage } = useAIUsageLimit();

  const usageItems = [
    {
      icon: Brain,
      label: 'Script Analyses',
      used: usage.scriptAnalyses,
      color: 'text-yellow-400',
    },
    {
      icon: MessageSquare,
      label: 'Coaching Messages',
      used: usage.coachingMessages,
      color: 'text-purple-400',
    },
    {
      icon: Video,
      label: 'Video Evaluations',
      used: usage.videoEvaluations,
      color: 'text-red-400',
    },
  ];

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Usage (Unlimited)
          <Badge variant="outline" className="text-xs border-green-500 text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            No Limits
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {usageItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-gray-300 text-sm">{item.label}</span>
                </div>
                <span className="text-gray-400 text-sm">
                  {item.used} used
                </span>
              </div>
              <div className="text-xs text-green-400">
                Unlimited usage available
              </div>
            </div>
          );
        })}
        
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 mt-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
            <div>
              <p className="text-green-300 text-sm font-medium">Unlimited Access</p>
              <p className="text-green-400 text-xs mt-1">
                Enjoy unlimited AI assistance for all your acting needs.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIUsageIndicator;
