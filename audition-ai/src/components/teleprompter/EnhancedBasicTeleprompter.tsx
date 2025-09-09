import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Users } from 'lucide-react';
import TopBarControls from './TopBarControls';
import BottomSettingsPanel, { TeleprompterSettings } from './BottomSettingsPanel';
import { parseScript } from '@/utils/scriptParser';
import { formatDialogueForTeleprompter, renderFormattedText } from '@/utils/textFormatter';
import '../SmoothScrollStyles.css';
import { PrivacyInfo } from './PrivacyInfo';
import ScriptEditor from './ScriptEditor';

interface Script {
  id: string;
  title: string;
  content: string;
}

interface EnhancedBasicTeleprompterProps {
  script: Script;
  onBack: () => void;
  onScriptUpdated?: (updatedScript: Script) => void;
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

const EnhancedBasicTeleprompter: React.FC<EnhancedBasicTeleprompterProps> = ({
  script,
  onBack,
  onScriptUpdated
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<TeleprompterSettings>(defaultSettings);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('none');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [currentScript, setCurrentScript] = useState(script);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Parse script into dialogue lines
  const parsedScript = parseScript(currentScript.content);
  const dialogues = parsedScript.dialogues;
  const characters = parsedScript.characters;

  // Update currentScript when script prop changes
  useEffect(() => {
    setCurrentScript(script);
  }, [script]);

  const handleScriptUpdated = (updatedScript: Script) => {
    setCurrentScript(updatedScript);
    if (onScriptUpdated) {
      onScriptUpdated(updatedScript);
    }
  };

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teleprompter-basic-enhanced-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }

    const characterSaved = localStorage.getItem('teleprompter-basic-selected-character');
    if (characterSaved) setSelectedCharacter(characterSaved);

    const colorSaved = localStorage.getItem('teleprompter-basic-highlight-color');
    if (colorSaved) setHighlightColor(colorSaved);
  }, []);

  // Save settings to localStorage
  const handleSettingsChange = (newSettings: Partial<TeleprompterSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('teleprompter-basic-enhanced-settings', JSON.stringify(updatedSettings));
  };

  const handleCharacterChange = (character: string) => {
    setSelectedCharacter(character);
    localStorage.setItem('teleprompter-basic-selected-character', character);
  };

  const handleHighlightColorChange = (color: string) => {
    setHighlightColor(color);
    localStorage.setItem('teleprompter-basic-highlight-color', color);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('teleprompter-basic-enhanced-settings');
    localStorage.removeItem('teleprompter-basic-selected-character');
    localStorage.removeItem('teleprompter-basic-highlight-color');
    setSelectedCharacter('none');
    setHighlightColor('#ffff00');
  };

  // Smooth scrolling animation
  const scroll = useCallback((currentTime: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    const scrollAmount = (deltaTime * speed * 0.5);

    if (scrollContainerRef.current && isPlaying) {
      scrollContainerRef.current.scrollTop += scrollAmount;
    }

    lastTimeRef.current = currentTime;
    animationIdRef.current = requestAnimationFrame(scroll);
  }, [speed, isPlaying]);

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
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    lastTimeRef.current = 0;
  };

  const handleSkip = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += window.innerHeight * 0.5;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Fullscreen event listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationIdRef.current = requestAnimationFrame(scroll);
    } else {
      cancelAnimationFrame(animationIdRef.current);
    }

    return () => {
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [isPlaying, scroll]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handlePlayPause();
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
        case 'KeyS':
          event.preventDefault();
          handleSkip();
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

  // Format script content with character highlighting
  const formatScriptLines = (content: string) => {
    if (dialogues.length > 0) {
      // Use parsed dialogues for character highlighting
      return dialogues.map((dialogue, index) => {
        const isHighlighted = selectedCharacter !== 'none' && dialogue.character === selectedCharacter;
        
        return (
          <div
            key={index}
            className="mb-4 p-4 rounded-lg transition-all duration-300"
            style={{
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              backgroundColor: 'transparent',
              padding: '12px',
              borderRadius: '8px',
              transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
              transition: 'all 0.3s ease',
              border: isHighlighted ? '2px solid #ef4444' : '1px solid transparent',
            }}
          >
            <div 
              className="font-bold mb-2" 
              style={{ color: 'hsl(var(--teleprompter-text-yellow))' }}
            >
              {dialogue.character}:
            </div>
            <div style={{ color: 'hsl(var(--teleprompter-text-white))' }}>
              {renderFormattedText(
                formatDialogueForTeleprompter(dialogue.text),
                settings.fontSize,
                settings.lineHeight,
                'hsl(var(--teleprompter-text-white))'
              )}
            </div>
          </div>
        );
      });
    } else {
      // Fallback to simple line-by-line rendering
      return content.split('\n').map((line, index) => (
        <div
          key={index}
          className="dialogue-line mb-4"
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            color: settings.textColor,
          }}
        >
          {line || '\u00A0'}
        </div>
      ));
    }
  };

  const characterSettings = (
    <Card className="bg-card border-border h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm text-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          Character Highlighting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs font-medium text-foreground mb-2 block">
            Highlight Character
          </label>
          <Select value={selectedCharacter} onValueChange={handleCharacterChange}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Highlighting</SelectItem>
              {characters.map((character) => (
                <SelectItem key={character} value={character}>
                  {character}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCharacter !== 'none' && (
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Highlight Color
            </label>
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => handleHighlightColorChange(e.target.value)}
              className="w-full h-8 rounded border border-border"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-foreground mb-2 block">
            Scroll Speed: {speed.toFixed(1)}x
          </label>
          <Slider
            value={[speed]}
            onValueChange={(value) => setSpeed(value[0])}
            min={0.1}
            max={3.0}
            step={0.1}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Top Controls */}
      {!isFullscreen && (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
          <TopBarControls
            isPlaying={isPlaying}
            speed={speed}
            isFullscreen={isFullscreen}
            isCountingDown={isCountingDown}
            countdownValue={countdownValue}
            showSettings={showSettings}
            onPlayPause={handlePlayPause}
            onStop={handleStop}
            onSpeedChange={handleSpeedChange}
            onToggleFullscreen={toggleFullscreen}
            onToggleSettings={() => setShowSettings(!showSettings)}
            onBack={onBack}
            onEdit={() => setIsEditingScript(true)}
            title={`Basic Mode - ${currentScript.title}`}
            status={isPlaying ? `Playing at ${speed.toFixed(1)}x` : 'Paused'}
            rightExtra={<PrivacyInfo />}
          />
        </div>
      )}

      {/* Main teleprompter area with padding */}
      <div 
        className="relative flex-1 overflow-hidden px-4 sm:px-8 lg:px-12"
        style={{ 
          backgroundColor: settings.backgroundColor,
          color: settings.textColor,
          transform: settings.mirrorMode ? 'scaleX(-1)' : 'none'
        }}
      >
        {/* Fullscreen controls overlay */}
        {isFullscreen && (
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
            <div className="text-white bg-black/50 px-3 py-1 rounded">
              {currentScript.title} - {speed.toFixed(1)}x
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="bg-black/50 border-white/20 text-white"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                className="bg-black/50 border-white/20 text-white"
              >
                Skip
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.exitFullscreen?.()}
                className="bg-black/50 border-white/20 text-white"
              >
                Exit Fullscreen
              </Button>
            </div>
          </div>
        )}

        {/* Skip Button at Bottom in Fullscreen */}
        {isFullscreen && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <Button
              variant="outline"
              size="default"
              onClick={handleSkip}
              className="bg-black/50 border-white/20 text-white"
            >
              Skip Section
            </Button>
          </div>
        )}

        {/* Countdown Overlay */}
        {isCountingDown && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-8xl font-bold text-white bg-black/70 rounded-full w-32 h-32 flex items-center justify-center animate-pulse">
              {countdownValue}
            </div>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto scrollbar-hide smooth-scroll-container"
          style={{
            paddingTop: `${settings.marginTop}vh`,
            paddingBottom: `${settings.marginBottom}vh`,
          }}
        >
          <div className="min-h-full">
            {formatScriptLines(currentScript.content)}
          </div>
        </div>
      </div>

      {/* Script Editor */}
      <ScriptEditor
        script={isEditingScript ? currentScript : null}
        isOpen={isEditingScript}
        onClose={() => setIsEditingScript(false)}
        onScriptUpdated={handleScriptUpdated}
      />

      {/* Bottom Settings Panel */}
      {!isFullscreen && (
        <BottomSettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onResetSettings={resetSettings}
          isExpanded={showSettings}
          onToggle={() => setShowSettings(!showSettings)}
        >
          {characterSettings}
        </BottomSettingsPanel>
      )}

      {/* Keyboard shortcuts help */}
      {!isFullscreen && !showSettings && (
        <div className="bg-muted/50 border-t border-border px-4 py-2 absolute bottom-0 left-0 right-0">
          <p className="text-xs text-muted-foreground text-center">
            <kbd className="bg-background border border-border px-1 rounded">Space</kbd> Play/Pause • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">S</kbd> Skip • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">↑/↓</kbd> Speed • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">+/-</kbd> Font Size • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">F</kbd> Fullscreen
          </p>
        </div>
      )}
      
      
    </div>
  );
};

export default EnhancedBasicTeleprompter;