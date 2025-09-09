import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Gauge, Mic, Clock, Settings, Users, Volume2 } from 'lucide-react';

type TeleprompterMode = 'basic' | 'advanced' | 'pro';

interface TeleprompterModeSelectionProps {
  onModeSelected: (mode: TeleprompterMode) => void;
}

const TeleprompterModeSelection: React.FC<TeleprompterModeSelectionProps> = ({
  onModeSelected
}) => {
  const [lastUsedMode, setLastUsedMode] = useState<TeleprompterMode>('basic');

  useEffect(() => {
    const saved = localStorage.getItem('teleprompter-last-mode') as TeleprompterMode;
    if (saved) {
      setLastUsedMode(saved);
    }
  }, []);

  const handleModeSelection = (mode: TeleprompterMode) => {
    localStorage.setItem('teleprompter-last-mode', mode);
    onModeSelected(mode);
  };

  const modes = [
    {
      id: 'basic' as TeleprompterMode,
      title: 'Basic Teleprompter',
      description: 'Classic scrolling teleprompter with essential controls',
      icon: Monitor,
      features: [
        'Smooth auto-scroll',
        'Speed control (0.5x - 3x)',
        'Font size & spacing',
        'Color themes',
        'Mirror flip',
        'Countdown timer',
        'Fullscreen mode',
        'Keyboard shortcuts'
      ],
      recommended: false
    },
    {
      id: 'advanced' as TeleprompterMode,
      title: 'Advanced Teleprompter',
      description: 'Dialogue-aware teleprompter with character features',
      icon: Users,
      features: [
        'All Basic features',
        'Character recognition',
        'Actor line selection',
        'Hide/show actor lines',
        'Current line highlighting',
        'Manual line navigation',
        'Auto-advance options',
        'Extended shortcuts (n/p)'
      ],
      recommended: true
    },
    {
      id: 'pro' as TeleprompterMode,
      title: 'Pro Teleprompter',
      description: 'Professional mode with AI-powered partner audio',
      icon: Volume2,
      features: [
        'All Advanced features',
        'Pre-rendered partner audio',
        'Per-character voice mapping',
        'TTS caching system',
        'Audio-sync playback',
        'Real-time progress tracking',
        'Professional workflow',
        'Studio-grade precision'
      ],
      recommended: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-muted-foreground">
          Choose the teleprompter mode that best fits your needs
        </p>
        {lastUsedMode && (
          <Badge variant="outline" className="mt-2">
            Last used: {modes.find(m => m.id === lastUsedMode)?.title}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {modes.map((mode) => {
          const IconComponent = mode.icon;
          const isLastUsed = mode.id === lastUsedMode;

          return (
            <Card 
              key={mode.id} 
              className={`relative transition-all duration-200 hover:shadow-lg ${
                mode.recommended ? 'ring-2 ring-primary/20 bg-primary/5' : ''
              } ${isLastUsed ? 'ring-2 ring-accent/50' : ''}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    {mode.recommended && (
                      <Badge className="bg-primary text-primary-foreground">
                        Recommended
                      </Badge>
                    )}
                    {isLastUsed && (
                      <Badge variant="outline" className="text-accent-foreground">
                        Last Used
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl text-foreground">
                  {mode.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {mode.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Features:</h4>
                  <ul className="space-y-1">
                    {mode.features.map((feature, index) => (
                      <li 
                        key={index}
                        className="text-sm text-muted-foreground flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={() => handleModeSelection(mode.id)}
                  className={`w-full ${
                    mode.recommended 
                      ? 'bg-primary hover:bg-primary/90' 
                      : isLastUsed
                      ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
                      : 'bg-secondary hover:bg-secondary/90'
                  }`}
                  size="lg"
                >
                  {isLastUsed ? 'Continue with ' : 'Select '}
                  {mode.title.replace(' Teleprompter', '')}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You can always switch modes later from within the teleprompter
        </p>
      </div>
    </div>
  );
};

export default TeleprompterModeSelection;