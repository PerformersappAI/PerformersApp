import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Users, Volume2, ChevronUp, ChevronDown, SkipForward } from 'lucide-react';
import TopBarControls from './TopBarControls';
import RightSideSettings, { TeleprompterSettings } from './RightSideSettings';
import MobileControls from './MobileControls';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSimpleTTS } from '@/hooks/useSimpleTTS';
import { parseScript } from '@/utils/scriptParser';
import { formatDialogueForTeleprompter, renderFormattedText } from '@/utils/textFormatter';
import type { DialogueLine } from '@/utils/scriptParser';
import { PrivacyInfo } from './PrivacyInfo';
import ScriptEditor from './ScriptEditor';

interface Script {
  id: string;
  title: string;
  content: string;
}

interface EnhancedAdvancedTeleprompterProps {
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

// Voice options for Google TTS (mixed male/female)
const voiceOptions = [
  { id: 'en-US-Journey-F', name: 'Journey F (Female)', gender: 'female' },
  { id: 'en-US-Studio-O', name: 'Studio O (Female)', gender: 'female' },
  { id: 'en-US-Standard-C', name: 'Standard C (Female)', gender: 'female' },
  { id: 'en-US-Standard-E', name: 'Standard E (Female)', gender: 'female' },
  { id: 'en-US-Standard-F', name: 'Standard F (Female)', gender: 'female' },
  { id: 'en-US-Wavenet-A', name: 'Wavenet A (Female)', gender: 'female' },
  { id: 'en-US-Wavenet-C', name: 'Wavenet C (Female)', gender: 'female' },
  { id: 'en-US-Journey-D', name: 'Journey D (Male)', gender: 'male' },
  { id: 'en-US-Studio-M', name: 'Studio M (Male)', gender: 'male' },
  { id: 'en-US-Standard-A', name: 'Standard A (Male)', gender: 'male' },
  { id: 'en-US-Standard-B', name: 'Standard B (Male)', gender: 'male' },
  { id: 'en-US-Standard-D', name: 'Standard D (Male)', gender: 'male' },
  { id: 'en-US-Wavenet-B', name: 'Wavenet B (Male)', gender: 'male' },
  { id: 'en-US-Wavenet-D', name: 'Wavenet D (Male)', gender: 'male' },
];

const EnhancedAdvancedTeleprompter: React.FC<EnhancedAdvancedTeleprompterProps> = ({
  script,
  onBack,
  onScriptUpdated
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<TeleprompterSettings>(defaultSettings);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [currentScript, setCurrentScript] = useState(script);
  const isMobile = useIsMobile();

  // Advanced mode specific state
  const [selectedActor, setSelectedActor] = useState<string>('none');
  const [hideActorLines, setHideActorLines] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [skipMode, setSkipMode] = useState<'automatic' | 'manual'>('automatic');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [characterVoices, setCharacterVoices] = useState<Record<string, string>>({});
  const [ttsVolume, setTtsVolume] = useState(0.7);
  const [timePerWord, setTimePerWord] = useState(0.3); // seconds per word
  const [timePerNewLine, setTimePerNewLine] = useState(1.0); // additional seconds for new line
  
  // Voice activation state
  const [voiceActivationEnabled, setVoiceActivationEnabled] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [vadSensitivity, setVadSensitivity] = useState(0.5);
  const [isListening, setIsListening] = useState(false);
  
  // Playback session management
  const [sessionId, setSessionId] = useState<string>(Date.now().toString());
  const playingLineRef = useRef<number>(-1);
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  // Voice activation refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const preAudioRef = useRef<HTMLAudioElement | null>(null);

  // TTS hooks
  const { speak, stop: stopTTS, isPlaying: isTTSPlaying } = useSimpleTTS();

  // Parse script into dialogue lines - memoized to prevent re-parsing
  const parsedScript = React.useMemo(() => parseScript(currentScript.content), [currentScript.content]);
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

  // Get character color based on name hash
  const getCharacterColor = (character: string) => {
    const colors = [
      '#f59e0b', // amber-500
      '#ec4899', // pink-500  
      '#3b82f6', // blue-500
      '#10b981', // emerald-500
      '#8b5cf6', // violet-500
      '#f97316', // orange-500
      '#ef4444', // red-500
      '#6366f1', // indigo-500
    ];
    let hash = 0;
    for (let i = 0; i < character.length; i++) {
      hash = character.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teleprompter-advanced-enhanced-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }

    // Load advanced-specific settings
    const actorSaved = localStorage.getItem('teleprompter-advanced-selected-actor');
    if (actorSaved) setSelectedActor(actorSaved);
    
    const voicesSaved = localStorage.getItem('teleprompter-advanced-character-voices');
    if (voicesSaved) {
      try {
        setCharacterVoices(JSON.parse(voicesSaved));
      } catch (error) {
        console.error('Failed to parse character voices:', error);
      }
    }

    const skipModeSaved = localStorage.getItem('teleprompter-advanced-skip-mode');
    if (skipModeSaved) setSkipMode(skipModeSaved as 'automatic' | 'manual');

    const volumeSaved = localStorage.getItem('teleprompter-advanced-tts-volume');
    if (volumeSaved) setTtsVolume(parseFloat(volumeSaved));
    
    const voiceActivationSaved = localStorage.getItem('teleprompter-advanced-voice-activation');
    if (voiceActivationSaved) setVoiceActivationEnabled(JSON.parse(voiceActivationSaved));
    
    const vadSensitivitySaved = localStorage.getItem('teleprompter-advanced-vad-sensitivity');
    if (vadSensitivitySaved) setVadSensitivity(parseFloat(vadSensitivitySaved));
  }, []);

  // Auto-assign voices to characters based on typical naming patterns
  useEffect(() => {
    if (characters.length > 0 && Object.keys(characterVoices).length === 0) {
      const newVoices: Record<string, string> = {};
      
      characters.forEach((character, index) => {
        const lowerName = character.toLowerCase();
        
        // Enhanced gender detection
        const femaleKeywords = ['woman', 'girl', 'lady', 'mom', 'mother', 'sister', 'daughter', 'wife', 'girlfriend', 'aunt', 'grandma', 'grandmother', 'ms.', 'mrs.', 'miss'];
        const maleKeywords = ['man', 'boy', 'guy', 'dad', 'father', 'brother', 'son', 'husband', 'boyfriend', 'uncle', 'grandpa', 'grandfather', 'mr.', 'sir'];
        
        // Common female names
        const femaleNames = ['anna', 'mary', 'sarah', 'lisa', 'emma', 'olivia', 'sophia', 'emily', 'jessica', 'ashley', 'amanda', 'michelle', 'jennifer', 'stephanie', 'rachel', 'samantha', 'nicole', 'elizabeth', 'christina', 'amy', 'angela', 'melissa', 'brenda', 'marie', 'janet', 'catherine', 'frances', 'christine', 'dorothy', 'deborah', 'carolyn', 'janet', 'virginia', 'maria', 'heather', 'diane', 'ruth', 'julie', 'joyce', 'victoria', 'kelly', 'christina', 'joan', 'evelyn', 'judith', 'andrea', 'hannah', 'jacqueline', 'martha', 'gloria', 'sara', 'janice', 'julia', 'marie', 'madison', 'mackenzie', 'brooke', 'paige', 'lauren', 'chloe', 'grace', 'natalie'];
        
        // Common male names  
        const maleNames = ['james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'christopher', 'charles', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'jason', 'edward', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'frank', 'gregory', 'raymond', 'alexander', 'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'henry', 'adam', 'douglas', 'nathan', 'zachary', 'noah', 'carl', 'arthur', 'harold', 'jordan', 'lawrence', 'roger', 'keith', 'jeremy', 'sean', 'luke', 'wayne', 'phillip'];
        
        let isFemale = false;
        
        // Check for explicit keywords
        if (femaleKeywords.some(keyword => lowerName.includes(keyword))) {
          isFemale = true;
        } else if (maleKeywords.some(keyword => lowerName.includes(keyword))) {
          isFemale = false;
        } else {
          // Check for common names
          if (femaleNames.some(name => lowerName.includes(name))) {
            isFemale = true;
          } else if (maleNames.some(name => lowerName.includes(name))) {
            isFemale = false;
          } else {
            // Default fallback - alternate between genders
            isFemale = index % 2 === 0;
          }
        }
        
        const availableVoices = voiceOptions.filter(v => v.gender === (isFemale ? 'female' : 'male'));
        const voiceIndex = index % availableVoices.length;
        newVoices[character] = availableVoices[voiceIndex].id;
      });
      
      setCharacterVoices(newVoices);
      localStorage.setItem('teleprompter-advanced-character-voices', JSON.stringify(newVoices));
    }
  }, [characters]);

  // Save settings
  const handleSettingsChange = (newSettings: Partial<TeleprompterSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('teleprompter-advanced-enhanced-settings', JSON.stringify(updatedSettings));
  };

  const handleActorChange = (actor: string) => {
    setSelectedActor(actor);
    localStorage.setItem('teleprompter-advanced-selected-actor', actor);
    setCurrentLineIndex(0);
  };

  const handleCharacterVoiceChange = (character: string, voiceId: string) => {
    const updated = { ...characterVoices, [character]: voiceId };
    setCharacterVoices(updated);
    localStorage.setItem('teleprompter-advanced-character-voices', JSON.stringify(updated));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('teleprompter-advanced-enhanced-settings');
  };

  // Get filtered dialogues based on settings - memoized to prevent recalculation
  const filteredDialogues = React.useMemo(() => {
    if (!hideActorLines || selectedActor === 'none') {
      return dialogues;
    }
    return dialogues.filter(dialogue => dialogue.character !== selectedActor);
  }, [dialogues, hideActorLines, selectedActor]);

  // Auto-scroll to current line - enhanced for better visibility
  const scrollToCurrentLine = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const currentLineRef = lineRefs.current[currentLineIndex];
    if (currentLineRef) {
      const container = scrollContainerRef.current;
      const lineRect = currentLineRef.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Check if current line is visible
      const isVisible = lineRect.top >= containerRect.top && 
                       lineRect.bottom <= containerRect.bottom;
      
      if (!isVisible) {
        // Center the current line in the viewport
        const targetScroll = container.scrollTop + lineRect.top - containerRect.top - containerRect.height / 3;
        container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  }, [currentLineIndex]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  // Play current line audio and advance
  const playCurrentLineAudio = useCallback(async () => {
    const currentSession = sessionId;
    const lineIndex = currentLineIndex;
    
    // Prevent duplicate calls for the same line
    if (playingLineRef.current === lineIndex) {
      return;
    }
    
    if (lineIndex >= filteredDialogues.length) {
      setIsPlaying(false);
      return;
    }

    playingLineRef.current = lineIndex;
    const currentDialogue = filteredDialogues[lineIndex];
    
    // If it's the actor's line, skip TTS and wait for manual advance or timing
    if (selectedActor !== 'none' && currentDialogue.character === selectedActor) {
      if (skipMode === 'automatic') {
        // Calculate time based on word count
        const wordCount = currentDialogue.text.split(' ').length;
        const waitTime = (wordCount * timePerWord + timePerNewLine) * 1000;
        
        const timer = setTimeout(() => {
          // Only advance if session is still active and we're still on the same line
          if (currentSession === sessionId && isPlaying && currentLineIndex === lineIndex) {
            setCurrentLineIndex(prev => prev + 1);
          }
          timersRef.current.delete(timer);
        }, waitTime);
        
        timersRef.current.add(timer);
      }
      return;
    }

    // Play TTS for other characters
    const voiceId = characterVoices[currentDialogue.character] || voiceOptions[0].id;
    
    try {
      await speak(currentDialogue.text, {
        voice: voiceId,
        speed: speed,
        volume: ttsVolume,
        onComplete: () => {
          // Only advance if session is still active and we're still on the same line
          if (currentSession === sessionId && isPlaying && currentLineIndex === lineIndex) {
            setCurrentLineIndex(prev => prev + 1);
          }
        },
        onError: (error) => {
          console.error('TTS Error:', error);
          // Continue to next line even on error
          if (currentSession === sessionId && isPlaying && currentLineIndex === lineIndex) {
            setCurrentLineIndex(prev => prev + 1);
          }
        }
      });
    } catch (error) {
      console.error('TTS Error:', error);
      // Continue to next line on error
      if (currentSession === sessionId && isPlaying && currentLineIndex === lineIndex) {
        setCurrentLineIndex(prev => prev + 1);
      }
    }
  }, [currentLineIndex, filteredDialogues, selectedActor, skipMode, timePerWord, timePerNewLine, characterVoices, speed, ttsVolume, sessionId, isPlaying, speak]);

  // Manual navigation
  const goToPreviousLine = () => {
    stopTTS();
    clearAllTimers();
    playingLineRef.current = -1;
    setCurrentLineIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextLine = () => {
    stopTTS();
    clearAllTimers();
    playingLineRef.current = -1;
    setCurrentLineIndex((prev) => Math.min(filteredDialogues.length - 1, prev + 1));
  };

  // Manual skip for any mode
  const handleSkip = () => {
    stopTTS();
    clearAllTimers();
    playingLineRef.current = -1;
    setCurrentLineIndex(prev => Math.min(filteredDialogues.length - 1, prev + 1));
  };

  // Voice activation functions
  const initializeVoiceActivation = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      setMicPermission('granted');
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      
      return true;
    } catch (error) {
      console.error('Voice activation initialization failed:', error);
      setMicPermission('denied');
      return false;
    }
  }, []);

  const startVoiceActivationDetection = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const detectVoice = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalizedLevel = average / 255;
      
      // Voice detected above threshold
      if (normalizedLevel > vadSensitivity && selectedActor !== 'none') {
        const currentDialogue = filteredDialogues[currentLineIndex];
        if (currentDialogue && currentDialogue.character === selectedActor) {
          handleSkip();
        }
      }
    };
    
    vadIntervalRef.current = setInterval(detectVoice, 100);
    setIsListening(true);
  }, [vadSensitivity, selectedActor, filteredDialogues, currentLineIndex, handleSkip]);

  const stopVoiceActivationDetection = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleVoiceActivation = useCallback(async () => {
    if (!voiceActivationEnabled) {
      const success = await initializeVoiceActivation();
      if (success) {
        setVoiceActivationEnabled(true);
        localStorage.setItem('teleprompter-advanced-voice-activation', 'true');
      }
    } else {
      setVoiceActivationEnabled(false);
      stopVoiceActivationDetection();
      localStorage.setItem('teleprompter-advanced-voice-activation', 'false');
    }
  }, [voiceActivationEnabled, initializeVoiceActivation, stopVoiceActivationDetection]);

  // Start without countdown for advanced mode
  const startCountdown = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // Control functions
  const handlePlayPause = () => {
    if (isCountingDown) return;

    if (!isPlaying) {
      setSessionId(Date.now().toString()); // Create new session
      startCountdown();
    } else {
      setIsPlaying(false);
      setIsCountingDown(false);
      setCountdownValue(0);
      clearAllTimers();
      playingLineRef.current = -1;
      stopTTS();
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsCountingDown(false);
    setCountdownValue(0);
    setCurrentLineIndex(0);
    clearAllTimers();
    playingLineRef.current = -1;
    stopTTS();
    setSessionId(Date.now().toString()); // Reset session
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

  // Play audio when line changes - with stable dependencies
  useEffect(() => {
    if (isPlaying && currentLineIndex < filteredDialogues.length) {
      scrollToCurrentLine();
      // Reset playing line ref when moving to new line
      if (playingLineRef.current !== currentLineIndex) {
        playingLineRef.current = -1;
      }
      playCurrentLineAudio();
      
      // Start voice activation for actor lines if enabled
      if (voiceActivationEnabled && selectedActor !== 'none') {
        const currentDialogue = filteredDialogues[currentLineIndex];
        if (currentDialogue && currentDialogue.character === selectedActor) {
          startVoiceActivationDetection();
        } else {
          stopVoiceActivationDetection();
        }
      }
    } else if (currentLineIndex >= filteredDialogues.length) {
      setIsPlaying(false);
      stopVoiceActivationDetection();
    }
  }, [currentLineIndex, isPlaying, filteredDialogues.length, scrollToCurrentLine, playCurrentLineAudio, voiceActivationEnabled, selectedActor, startVoiceActivationDetection, stopVoiceActivationDetection]);

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
        case 'KeyS':
          event.preventDefault();
          handleSkip();
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
  }, [isPlaying, isCountingDown, isFullscreen, skipMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      stopTTS();
      stopVoiceActivationDetection();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [clearAllTimers, stopTTS, stopVoiceActivationDetection]);


  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar Controls - Hidden on mobile when playing */}
      {!isFullscreen && !isMobile && (
        <TopBarControls
          onBack={onBack}
          onEdit={() => setIsEditingScript(true)}
          title={currentScript.title}
          status={`Line ${currentLineIndex + 1} of ${filteredDialogues.length}`}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          speed={speed}
          onSpeedChange={setSpeed}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
          isCountingDown={isCountingDown}
          countdownValue={countdownValue}
          rightExtra={<PrivacyInfo />}
        />
      )}

      {/* Desktop top controls for character and AI volume */}
      {!isFullscreen && !isMobile && (
        <div className="border-b bg-background/95 backdrop-blur-sm p-2">
          <div className="flex items-center gap-4 max-w-md">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedActor} onValueChange={handleActorChange}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue placeholder="Character" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {characters.map((character) => (
                    <SelectItem key={character} value={character}>
                      {character}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 min-w-20">
                <Slider
                  value={[ttsVolume]}
                  onValueChange={([value]) => setTtsVolume(value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-16"
                />
                <span className="text-xs text-muted-foreground min-w-8">
                  {Math.round(ttsVolume * 100)}%
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={!isPlaying}
              className="flex items-center gap-1"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Main teleprompter display */}
        <div 
          className={`flex-1 relative ${isMobile ? 'pb-32' : ''}`}
          style={{ 
            backgroundColor: settings.backgroundColor,
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

          {/* Sequential teleprompter display */}
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto smooth-scroll"
            style={{
              paddingTop: `${settings.marginTop}px`,
              paddingBottom: `${settings.marginBottom}px`,
            }}
          >
            <div className="min-h-full flex justify-center">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                  {filteredDialogues.map((dialogue, index) => {
                    const isCurrentLine = index === currentLineIndex;
                    const characterColor = getCharacterColor(dialogue.character);
                    
                    // Split long dialogues into readable chunks if needed
                    const shouldSplit = dialogue.text.length > 400;
                    const textChunks = shouldSplit ? 
                      dialogue.text.match(/.{1,400}(\s|$)/g) || [dialogue.text] : 
                      [dialogue.text];
                    
                    return (
                      <div
                        key={index}
                        ref={(el) => { lineRefs.current[index] = el; }}
                        className={`transition-all duration-300 p-6 rounded-lg ${
                          isCurrentLine 
                            ? 'ring-4 ring-yellow-400 bg-yellow-400/10 scale-105' 
                            : 'hover:bg-white/5'
                        }`}
                        style={{
                          minHeight: '120px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                      >
                        {/* Character name */}
                        <div className="mb-4 flex justify-center">
                          <Badge 
                            className="text-lg font-bold px-4 py-2"
                            style={{ 
                              backgroundColor: characterColor,
                              color: '#ffffff',
                              border: `2px solid ${characterColor}`
                            }}
                          >
                            {dialogue.character}
                          </Badge>
                        </div>
                        
                        {/* Dialogue text */}
                        <div 
                          className="text-center leading-relaxed"
                          style={{
                            fontSize: `${settings.fontSize}px`,
                            lineHeight: settings.lineHeight,
                            color: settings.textColor,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            maxWidth: '100%'
                          }}
                        >
                          {textChunks.map((chunk, chunkIndex) => (
                            <div key={chunkIndex} className={chunkIndex > 0 ? 'mt-4' : ''}>
                              {chunk.trim()}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
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

      {/* Mobile Controls */}
      {isMobile && (
        <MobileControls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onSkip={handleSkip}
          onBack={onBack}
          characters={characters}
          selectedActor={selectedActor}
          onActorChange={handleActorChange}
          ttsVolume={ttsVolume}
          onTtsVolumeChange={setTtsVolume}
          onOpenSettings={() => setShowSettings(true)}
          currentLineIndex={currentLineIndex}
          totalLines={filteredDialogues.length}
          isCountingDown={isCountingDown}
          countdownValue={countdownValue}
        />
      )}

      {/* Right Side Settings Panel */}
      <RightSideSettings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onResetSettings={resetSettings}
        isOpen={showSettings}
        onOpenChange={setShowSettings}
        characters={characters}
        selectedActor={selectedActor}
        onActorChange={handleActorChange}
        characterVoices={characterVoices}
        onCharacterVoiceChange={handleCharacterVoiceChange}
        ttsVolume={ttsVolume}
        onTtsVolumeChange={setTtsVolume}
        ttsSpeed={speed}
        onTtsSpeedChange={setSpeed}
        voiceOptions={voiceOptions}
      />

      {/* Keyboard shortcuts overlay - Desktop only */}
      {!isFullscreen && !isMobile && (
        <div className="fixed bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs text-muted-foreground border">
          <div className="space-y-1">
            <div><kbd className="bg-muted px-1 rounded">Space</kbd> Play/Pause</div>
            <div><kbd className="bg-muted px-1 rounded">S</kbd> Skip</div>
            <div><kbd className="bg-muted px-1 rounded">F</kbd> Fullscreen</div>
            <div><kbd className="bg-muted px-1 rounded">N/P</kbd> Navigate Lines</div>
          </div>
        </div>
      )}
      
      
    </div>
  );
};

export default EnhancedAdvancedTeleprompter;