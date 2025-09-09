import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import TopBarControls from './TopBarControls';
import SettingsPanel, { TeleprompterSettings } from './SettingsPanel';
import '../SmoothScrollStyles.css';

interface Script {
  id: string;
  title: string;
  content: string;
}

interface BasicTeleprompterProps {
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

const BasicTeleprompter: React.FC<BasicTeleprompterProps> = ({
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teleprompter-basic-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const handleSettingsChange = (newSettings: Partial<TeleprompterSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('teleprompter-basic-settings', JSON.stringify(updatedSettings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('teleprompter-basic-settings');
  };

  // Smooth scrolling animation
  const scroll = useCallback((currentTime: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    const scrollAmount = (deltaTime * speed * 0.5); // Adjust multiplier for scroll speed

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
          if (event.ctrlKey || event.metaKey) return; // Allow Ctrl+F
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

  // Format script content
  const formatScriptLines = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div
        key={index}
        className="dialogue-line mb-4 px-4"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          color: settings.textColor,
        }}
      >
        {line || '\u00A0'} {/* Non-breaking space for empty lines */}
      </div>
    ));
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
          onSpeedChange={handleSpeedChange}
          onToggleFullscreen={toggleFullscreen}
          onToggleSettings={() => setShowSettings(!showSettings)}
          onBack={onBack}
          title={`Basic Mode - ${script.title}`}
          status={isPlaying ? `Playing at ${speed.toFixed(1)}x` : 'Paused'}
        />
      )}

      <div className="flex-1 flex">
        {/* Settings Panel */}
        {showSettings && !isFullscreen && (
          <div className="w-80 border-r border-border">
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onResetSettings={resetSettings}
            />
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
          {/* Fullscreen controls overlay */}
          {isFullscreen && (
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
              <div className="text-white bg-black/50 px-3 py-1 rounded">
                {script.title} - {speed.toFixed(1)}x
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
                  onClick={() => document.exitFullscreen?.()}
                  className="bg-black/50 border-white/20 text-white"
                >
                  Exit Fullscreen
                </Button>
              </div>
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
              {formatScriptLines(script.content)}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      {!isFullscreen && (
        <div className="bg-muted/50 border-t border-border px-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            <kbd className="bg-background border border-border px-1 rounded">Space</kbd> Play/Pause • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">↑/↓</kbd> Speed • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">+/-</kbd> Font Size • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">F</kbd> Fullscreen
          </p>
        </div>
      )}
    </div>
  );
};

export default BasicTeleprompter;