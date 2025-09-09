import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Volume2, ChevronUp, ChevronDown, Download, X, Loader2 } from 'lucide-react';
import TopBarControls from './TopBarControls';
import SettingsPanel, { TeleprompterSettings } from './SettingsPanel';
import { parseScript } from '@/utils/scriptParser';
import { usePreRenderedTTS } from '@/hooks/usePreRenderedTTS';
import '../SmoothScrollStyles.css';

interface Script {
  id: string;
  title: string;
  content: string;
  characters?: string[];
}

interface ProTeleprompterProps {
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

// Available voices for TTS
const voices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River' },
];

const ProTeleprompter: React.FC<ProTeleprompterProps> = ({
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

  // Pro mode specific state
  const [defaultVoice, setDefaultVoice] = useState('9BWtsMINqrJLrRacOk9x');
  const [characterVoices, setCharacterVoices] = useState<Record<string, string>>({});
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Parse script into dialogue lines
  const parsedScript = parseScript(script.content);
  const dialogues = parsedScript.dialogues;
  const characters = parsedScript.characters;

  // Initialize TTS hook
  const {
    status: ttsStatus,
    progress: ttsProgress,
    total: ttsTotal,
    failures: ttsFailures,
    lastError: ttsError,
    audioMap,
    cacheStats,
    isRunning: isTTSRunning,
    startPreRender,
    cancelPreRender,
    reset: resetTTS
  } = usePreRenderedTTS();

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teleprompter-pro-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }

    // Load pro-specific settings
    const actorSaved = localStorage.getItem('teleprompter-selected-actor');
    if (actorSaved) setSelectedActor(actorSaved);
    
    const voiceSaved = localStorage.getItem('teleprompter-default-voice');
    if (voiceSaved) setDefaultVoice(voiceSaved);
    
    const characterVoicesSaved = localStorage.getItem('teleprompter-character-voices');
    if (characterVoicesSaved) {
      try {
        setCharacterVoices(JSON.parse(characterVoicesSaved));
      } catch (error) {
        console.error('Failed to parse character voices:', error);
      }
    }
  }, []);

  // Save settings
  const handleSettingsChange = (newSettings: Partial<TeleprompterSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('teleprompter-pro-settings', JSON.stringify(updatedSettings));
  };

  const handleActorChange = (actor: string) => {
    setSelectedActor(actor);
    localStorage.setItem('teleprompter-selected-actor', actor);
    setCurrentLineIndex(0);
  };

  const handleDefaultVoiceChange = (voice: string) => {
    setDefaultVoice(voice);
    localStorage.setItem('teleprompter-default-voice', voice);
  };

  const handleCharacterVoiceChange = (character: string, voice: string) => {
    const updated = { ...characterVoices, [character]: voice };
    setCharacterVoices(updated);
    localStorage.setItem('teleprompter-character-voices', JSON.stringify(updated));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('teleprompter-pro-settings');
  };

  // Get filtered dialogues
  const getFilteredDialogues = () => {
    if (!hideActorLines || selectedActor === 'none') {
      return dialogues;
    }
    return dialogues.filter(dialogue => dialogue.character !== selectedActor);
  };

  const filteredDialogues = getFilteredDialogues();

  // Pre-render TTS
  const handlePreRenderTTS = async () => {
    if (isTTSRunning) {
      cancelPreRender();
      return;
    }

    await startPreRender({
      dialogues: dialogues,
      actorCharacter: selectedActor,
      voiceId: defaultVoice,
      speed: speechRate,
      characterVoiceMap: characterVoices,
      scriptId: script.id
    });
  };

  // Play audio for current line
  const playCurrentLineAudio = useCallback(() => {
    if (!isPlaying || selectedActor === 'none') return;
    
    const currentDialogue = filteredDialogues[currentLineIndex];
    if (!currentDialogue || currentDialogue.character === selectedActor) return;

    // Find the original dialogue index in the full dialogues array
    const originalIndex = dialogues.findIndex(d => 
      d.character === currentDialogue.character && 
      d.text === currentDialogue.text
    );

    if (originalIndex === -1 || !audioMap[originalIndex]) return;

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    // Create and play new audio
    const audio = new Audio(audioMap[originalIndex]);
    audio.playbackRate = speechRate;
    
    setCurrentAudio(audio);
    setIsPlayingAudio(true);

    audio.onended = () => {
      setIsPlayingAudio(false);
      setCurrentAudio(null);
      
      // Auto-advance to next line after audio completes
      if (autoAdvance) {
        setCurrentLineIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= filteredDialogues.length) {
            setIsPlaying(false);
            return prevIndex;
          }
          return nextIndex;
        });
      }
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      setCurrentAudio(null);
    };

    audio.play().catch(console.error);
  }, [currentLineIndex, filteredDialogues, dialogues, audioMap, currentAudio, speechRate, autoAdvance, selectedActor, isPlaying]);

  // Auto-advance logic (when not using audio sync)
  const autoAdvanceLines = useCallback((currentTime: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = currentTime;
    }

    const deltaTime = currentTime - lastTimeRef.current;
    const advanceInterval = 3000 / speed;

    if (deltaTime >= advanceInterval) {
      setCurrentLineIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= filteredDialogues.length) {
          setIsPlaying(false);
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
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlayingAudio(false);
    }
    setCurrentLineIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextLine = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlayingAudio(false);
    }
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
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setIsPlayingAudio(false);
      }
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsCountingDown(false);
    setCountdownValue(0);
    setCurrentLineIndex(0);
    lastTimeRef.current = 0;
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlayingAudio(false);
    }
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

  // Play audio when line changes (Pro mode feature)
  useEffect(() => {
    if (isPlaying && Object.keys(audioMap).length > 0) {
      playCurrentLineAudio();
    }
  }, [currentLineIndex, isPlaying, playCurrentLineAudio]);

  // Animation loop for non-audio auto-advance
  useEffect(() => {
    if (isPlaying && autoAdvance && Object.keys(audioMap).length === 0) {
      lastTimeRef.current = 0;
      animationIdRef.current = requestAnimationFrame(autoAdvanceLines);
    } else {
      cancelAnimationFrame(animationIdRef.current);
    }

    return () => {
      cancelAnimationFrame(animationIdRef.current);
    };
  }, [isPlaying, autoAdvance, autoAdvanceLines, audioMap]);

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
  }, [isPlaying, isCountingDown, isFullscreen]);

  // Format dialogue lines
  const formatDialogueLines = () => {
    return filteredDialogues.map((dialogue, index) => {
      const isCurrent = index === currentLineIndex;
      const isActor = selectedActor !== 'none' && dialogue.character === selectedActor;
      const hasAudio = Object.keys(audioMap).length > 0;
      
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
            border: (isCurrent && isPlayingAudio) ? '2px solid #00ff00' : 'none',
          }}
        >
          <div className="font-bold mb-2 text-primary flex items-center gap-2">
            {dialogue.character}:
            {hasAudio && !isActor && (
              <Volume2 className="w-4 h-4 text-green-500" />
            )}
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
          title={`Pro Mode - ${script.title}`}
          status={`Line ${currentLineIndex + 1} of ${filteredDialogues.length} • ${isPlayingAudio ? 'Playing Audio' : 'Ready'}`}
        />
      )}

      <div className="flex-1 flex">
        {/* Settings Panel */}
        {showSettings && !isFullscreen && (
          <div className="w-96 border-r border-border overflow-y-auto">
            <SettingsPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              onResetSettings={resetSettings}
            />
            
            {/* Character Settings */}
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
                    onCheckedChange={setHideActorLines}
                    disabled={selectedActor === 'none'}
                  />
                </div>
              </CardContent>
            </Card>

            {/* TTS Settings */}
            <Card className="m-4 bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Voice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Default Voice
                  </label>
                  <Select value={defaultVoice} onValueChange={handleDefaultVoiceChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Speech Rate: {speechRate.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Character Voice Mapping */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Character Voices
                  </label>
                  {characters.filter(char => char !== selectedActor).map((character) => (
                    <div key={character} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 truncate">
                        {character}:
                      </span>
                      <Select 
                        value={characterVoices[character] || defaultVoice} 
                        onValueChange={(voice) => handleCharacterVoiceChange(character, voice)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {/* Pre-render Controls */}
                <div className="pt-4 border-t border-border">
                  <Button 
                    onClick={handlePreRenderTTS}
                    disabled={isTTSRunning}
                    className="w-full mb-3"
                    variant={Object.keys(audioMap).length > 0 ? "default" : "outline"}
                  >
                    {isTTSRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancel Pre-render
                      </>
                    ) : Object.keys(audioMap).length > 0 ? (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Re-generate Audio
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Pre-render Partner Audio
                      </>
                    )}
                  </Button>

                  {/* TTS Progress */}
                  {(isTTSRunning || ttsStatus === 'completed') && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progress: {ttsProgress}/{ttsTotal}</span>
                        <span>Status: {ttsStatus}</span>
                      </div>
                      <Progress value={(ttsProgress / ttsTotal) * 100} />
                      
                      {cacheStats.fromCache > 0 || cacheStats.generated > 0 ? (
                        <div className="flex gap-2 text-xs">
                          <Badge variant="outline">
                            Cached: {cacheStats.fromCache}
                          </Badge>
                          <Badge variant="outline">
                            New: {cacheStats.generated}
                          </Badge>
                        </div>
                      ) : null}
                      
                      {ttsFailures > 0 && (
                        <Alert>
                          <AlertDescription className="text-xs">
                            {ttsFailures} lines failed. Last error: {ttsError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Controls */}
            <Card className="m-4 bg-card border-border">
              <CardContent className="p-4 text-center">
                <Badge variant="outline" className="mb-3">
                  Line {currentLineIndex + 1} of {filteredDialogues.length}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousLine}
                    disabled={currentLineIndex === 0}
                    className="flex-1"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextLine}
                    disabled={currentLineIndex >= filteredDialogues.length - 1}
                    className="flex-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Next
                  </Button>
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
            <kbd className="bg-background border border-border px-1 rounded ml-1">F</kbd> Fullscreen •
            <span className="ml-1 text-green-600">🔊 AI Partner Audio Enabled</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ProTeleprompter;