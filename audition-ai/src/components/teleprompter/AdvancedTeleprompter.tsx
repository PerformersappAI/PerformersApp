import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ChevronUp, ChevronDown } from 'lucide-react';
import TopBarControls from './TopBarControls';
import SettingsPanel, { TeleprompterSettings } from './SettingsPanel';
import { parseScript } from '@/utils/scriptParser';
import '../SmoothScrollStyles.css';

interface Script {
  id: string;
  title: string;
  content: string;
  characters?: string[];
}

interface AdvancedTeleprompterProps {
  script: Script;
  onBack: () => void;
}

const defaultSettings: TeleprompterSettings = {
  fontSize: 48,
  lineHeight: 1.6,
  marginTop: 25,
  marginBottom: 25,
  backgroundColor: 'hsl(var(--teleprompter-black))',
  textColor: 'hsl(var(--teleprompter-text-white))',
  mirrorMode: false,
  countdownTime: 5,
};

const AdvancedTeleprompter: React.FC<AdvancedTeleprompterProps> = ({
  script,
  onBack
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TeleprompterSettings>(defaultSettings);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);

  // Advanced mode specific state
  const [selectedActor, setSelectedActor] = useState<string>('none');
  const [hideActorLines, setHideActorLines] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [highlightColor, setHighlightColor] = useState('#ffff00');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Parse script into dialogue lines
  const parsedScript = parseScript(script.content);
  const dialogues = parsedScript.dialogues;
  const characters = parsedScript.characters;

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teleprompter-advanced-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }

    // Load advanced-specific settings
    const actorSaved = localStorage.getItem('teleprompter-selected-actor');
    if (actorSaved) setSelectedActor(actorSaved);
    
    const hideLinesSaved = localStorage.getItem('teleprompter-hide-actor-lines');
    if (hideLinesSaved) setHideActorLines(JSON.parse(hideLinesSaved));
  }, []);

  // Save settings
  const handleSettingsChange = (newSettings: Partial<TeleprompterSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('teleprompter-advanced-settings', JSON.stringify(updatedSettings));
  };

  const handleActorChange = (actor: string) => {
    setSelectedActor(actor);
    localStorage.setItem('teleprompter-selected-actor', actor);
    setCurrentLineIndex(0); // Reset to first line when actor changes
  };

  const handleHideActorLinesChange = (hide: boolean) => {
    setHideActorLines(hide);
    localStorage.setItem('teleprompter-hide-actor-lines', JSON.stringify(hide));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('teleprompter-advanced-settings');
  };

  // Get filtered dialogues based on settings
  const getFilteredDialogues = () => {
    if (!hideActorLines || selectedActor === 'none') {
      return dialogues;
    }
    return dialogues.filter(dialogue => dialogue.character !== selectedActor);
  };

  const filteredDialogues = getFilteredDialogues();

  // Auto-scroll to current line
  const scrollToCurrentLine = useCallback(() => {
    if (!autoAdvance || !scrollContainerRef.current) return;

    const currentLineRef = lineRefs.current[currentLineIndex];
    if (currentLineRef) {
      const container = scrollContainerRef.current;
      const lineRect = currentLineRef.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Scroll to center the current line
      const targetScroll = container.scrollTop + lineRect.top - containerRect.top - containerRect.height / 2;
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [currentLineIndex, autoAdvance]);

  // Auto-advance logic
  const autoAdvanceLines = useCallback((currentTime: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    const advanceInterval = 3000 / speed; // 3 seconds per line, adjusted by speed

    if (deltaTime >= advanceInterval) {
      setCurrentLineIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= filteredDialogues.length) {
          setIsPlaying(false); // Stop at end
          return prevIndex;
        }
        return nextIndex;
      });
      lastTimeRef.current = currentTime;
    }

    animationIdRef.current = requestAnimationFrame(autoAdvanceLines);
  }, [speed, filteredDialogues.length]);

  // Manual navigation
  const goToPreviousLine = () => {
    setCurrentLineIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextLine = () => {
    setCurrentLineIndex((prev) => Math.min(filteredDialogues.length - 1, prev + 1));
  };

  // Start countdown
  const startCountdown = useCallback(() => {
    if (settings.countdownTime === 0) {
      setIsPlaying(true);
      return;
    }

    setIsCountingDown(true);
    setCountdownValue(settings.countdownTime);

    const countdownInterval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsCountingDown(false);
          setIsPlaying(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings.countdownTime]);

  // Control functions
  const handlePlayPause = () => {
    if (isCountingDown) return;

    if (!isPlaying) {
      startCountdown();
    } else {
      setIsPlaying(false);
      setIsCountingDown(false);
      setCountdownValue(0);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsCountingDown(false);
    setCountdownValue(0);
    setCurrentLineIndex(0);
    lastTimeRef.current = 0;
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Effects
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Animation loop for auto-advance
  useEffect(() => {
    if (isPlaying && autoAdvance) {
      lastTimeRef.current = 0;
      animationIdRef.current = requestAnimationFrame(autoAdvanceLines);
    } else {
      cancelAnimationFrame(animationIdRef.current);
    }

    return () => {
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [isPlaying, autoAdvance, autoAdvanceLines]);

  // Scroll to current line when it changes
  useEffect(() => {
    if (isPlaying) {
      scrollToCurrentLine();
    }
  }, [currentLineIndex, scrollToCurrentLine, isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handlePlayPause();
          break;
        case 'KeyN':
          event.preventDefault();
          goToNextLine();
          break;
        case 'KeyP':
          event.preventDefault();
          goToPreviousLine();
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSpeed((prev) => Math.min(3, prev + 0.1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSpeed((prev) => Math.max(0.5, prev - 0.1));
          break;
        case 'Equal':
        case 'NumpadAdd':
          event.preventDefault();
          handleSettingsChange({ fontSize: Math.min(120, settings.fontSize + 2) });
          break;
        case 'Minus':
        case 'NumpadSubtract':
          event.preventDefault();
          handleSettingsChange({ fontSize: Math.max(16, settings.fontSize - 2) });
          break;
        case 'KeyF':
          if (event.ctrlKey || event.metaKey) return;
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen?.();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPlaying, isCountingDown, isFullscreen, settings.fontSize]);

  // Format dialogue lines
  const formatDialogueLines = () => {
    return filteredDialogues.map((dialogue, index) => {
      const isCurrent = index === currentLineIndex;
      const isActor = selectedActor !== 'none' && dialogue.character === selectedActor;
      
      return (
        <div
          key={index}
          ref={(el) => { lineRefs.current[index] = el; }}
          className={`dialogue-line mb-6 px-4 transition-all duration-300 ${
            isCurrent ? 'current' : index < currentLineIndex ? 'past' : 'upcoming'
          }`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            color: isCurrent ? highlightColor : settings.textColor,
            backgroundColor: isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            padding: isCurrent ? '12px' : '8px',
            borderRadius: '8px',
            transform: isCurrent ? 'scale(1.02)' : 'scale(1)',
            opacity: isActor ? 0.6 : 1,
          }}
        >
          <div className="font-bold mb-2 text-primary">
            {dialogue.character}:
          </div>
          <div>
            {dialogue.text}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top Controls */}
      {!isFullscreen && (
        <TopBarControls
          isPlaying={isPlaying}
          speed={speed}
          isFullscreen={isFullscreen}
          isCountingDown={isCountingDown}
          countdownValue={countdownValue}
          showSettings={showSettings}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onSpeedChange={setSpeed}
          onToggleFullscreen={toggleFullscreen}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onBack={onBack}
          title={`Advanced Mode - ${script.title}`}
          status={`Line ${currentLineIndex + 1} of ${filteredDialogues.length} • Actor: ${selectedActor === 'none' ? 'All' : selectedActor}`}
        />
      )}

      <div className="flex-1 flex">
        {/* Settings Panel */}
        {showSettings && !isFullscreen && (
          <div className="w-80 border-r border-border overflow-y-auto">
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onResetSettings={resetSettings}
            />
            
            {/* Advanced Settings */}
            <Card className="m-4 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Character Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Your Role
                  </label>
                  <Select value={selectedActor} onValueChange={handleActorChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Characters</SelectItem>
                      {characters.map((character) => (
                        <SelectItem key={character} value={character}>
                          {character}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Hide Your Lines
                  </label>
                  <Switch
                    checked={hideActorLines && selectedActor !== 'none'}
                    onCheckedChange={handleHideActorLinesChange}
                    disabled={selectedActor === 'none'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Auto Advance
                  </label>
                  <Switch
                    checked={autoAdvance}
                    onCheckedChange={setAutoAdvance}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Highlight Color
                  </label>
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="w-full h-8 rounded border border-border"
                  />
                </div>

                <div className="text-center pt-4 border-t border-border">
                  <Badge variant="outline" className="mb-2">
                    Line {currentLineIndex + 1} of {filteredDialogues.length}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousLine}
                      disabled={currentLineIndex === 0}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextLine}
                      disabled={currentLineIndex >= filteredDialogues.length - 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Teleprompter Display */}
        <div 
          className="flex-1 relative overflow-hidden"
          style={{ 
            backgroundColor: settings.backgroundColor,
            transform: settings.mirrorMode ? 'scaleX(-1)' : 'none',
          }}
        >
          {/* Countdown Overlay */}
          {isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="text-8xl font-bold text-white bg-black/70 rounded-full w-32 h-32 flex items-center justify-center animate-pulse">
                {countdownValue}
              </div>
            </div>
          )}

          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="h-full overflow-y-auto scrollbar-hide smooth-scroll-container"
            style={{
              paddingTop: `${settings.marginTop}vh`,
              paddingBottom: `${settings.marginBottom}vh`,
            }}
          >
            <div className="min-h-full">
              {formatDialogueLines()}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {!isFullscreen && (
        <div className="bg-muted/50 border-t border-border px-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            <kbd className="bg-background border border-border px-1 rounded">Space</kbd> Play/Pause • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">N/P</kbd> Next/Prev Line • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">↑/↓</kbd> Speed • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">+/-</kbd> Font Size • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">F</kbd> Fullscreen
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedTeleprompter;