import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Volume2, Mic, MicOff, Headphones } from 'lucide-react';
import TopBarControls from './TopBarControls';
import BottomSettingsPanel, { TeleprompterSettings } from './BottomSettingsPanel';
import { parseScript } from '@/utils/scriptParser';
import { formatDialogueForTeleprompter, renderFormattedText } from '@/utils/textFormatter';
import { useGoogleTTS } from '@/hooks/useGoogleTTS';
import '../SmoothScrollStyles.css';
import { PrivacyInfo } from './PrivacyInfo';
import ScriptEditor from './ScriptEditor';

interface Script {
  id: string;
  title: string;
  content: string;
}

interface EnhancedProTeleprompterProps {
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

const EnhancedProTeleprompter: React.FC<EnhancedProTeleprompterProps> = ({
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
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [currentScript, setCurrentScript] = useState(script);

  // Pro mode specific state
  const [selectedActor, setSelectedActor] = useState<string>('none');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [characterVoices, setCharacterVoices] = useState<Record<string, string>>({});
  const [ttsVolume, setTtsVolume] = useState(0.7);
  
  // Playback session management
  const [sessionId, setSessionId] = useState<string>(Date.now().toString());
  const playingLineRef = useRef<number>(-1);
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [microphoneDeviceId, setMicrophoneDeviceId] = useState<string>('default');
  const [microphoneDevices, setMicrophoneDevices] = useState<MediaDeviceInfo[]>([]);
  const [vadThreshold, setVadThreshold] = useState(0.3); // Voice activity detection threshold
  const [isVoiceDetected, setIsVoiceDetected] = useState(false);
  const [speechError, setSpeechError] = useState<string>('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const vadCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // TTS hook
  const { speak, stop: stopTTS, isPlaying: isTTSPlaying } = useGoogleTTS();

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

  // Initialize speech recognition and microphone devices
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          // User finished speaking, advance to next line
          handleSpeechComplete();
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        if (isPlaying && isListening) {
          // Restart recognition if still playing
          recognition.start();
        }
      };
      
      setRecognition(recognition);
    }

    // Get microphone devices
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const mics = devices.filter(device => device.kind === 'audioinput');
        setMicrophoneDevices(mics);
      })
      .catch(console.error);

    return () => {
      if (vadCheckIntervalRef.current) {
        clearInterval(vadCheckIntervalRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('teleprompter-pro-enhanced-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }

    const actorSaved = localStorage.getItem('teleprompter-pro-selected-actor');
    if (actorSaved) setSelectedActor(actorSaved);
    
    const voicesSaved = localStorage.getItem('teleprompter-pro-character-voices');
    if (voicesSaved) {
      try {
        setCharacterVoices(JSON.parse(voicesSaved));
      } catch (error) {
        console.error('Failed to parse character voices:', error);
      }
    }

    const micSaved = localStorage.getItem('teleprompter-pro-microphone-device');
    if (micSaved) setMicrophoneDeviceId(micSaved);

    const vadSaved = localStorage.getItem('teleprompter-pro-vad-threshold');
    if (vadSaved) setVadThreshold(parseFloat(vadSaved));
  }, []);

  // Auto-assign voices to characters
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
      localStorage.setItem('teleprompter-pro-character-voices', JSON.stringify(newVoices));
    }
  }, [characters]);

  // Setup microphone for VAD when playing
  useEffect(() => {
    if (isPlaying && selectedActor !== 'none') {
      setupMicrophone();
    } else {
      cleanupMicrophone();
    }
  }, [isPlaying, selectedActor, microphoneDeviceId]);

  const setupMicrophone = async () => {
    try {
      const constraints = {
        audio: {
          deviceId: microphoneDeviceId === 'default' ? undefined : { exact: microphoneDeviceId }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      
      startVAD();
      
    } catch (error) {
      console.error('Microphone setup error:', error);
      setSpeechError('Microphone access denied or not available');
    }
  };

  const cleanupMicrophone = () => {
    if (vadCheckIntervalRef.current) {
      clearInterval(vadCheckIntervalRef.current);
      vadCheckIntervalRef.current = null;
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsVoiceDetected(false);
  };

  const startVAD = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    vadCheckIntervalRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedVolume = average / 255;
      
      const wasDetected = isVoiceDetected;
      const isDetected = normalizedVolume > vadThreshold;
      
      setIsVoiceDetected(isDetected);
      
      // If voice was detected and now stopped, consider speech complete
      if (wasDetected && !isDetected && isListening) {
        setTimeout(() => {
          if (!isVoiceDetected) {
            handleSpeechComplete();
          }
        }, 1000); // 1 second delay to avoid false positives
      }
    }, 100);
  };

  const handleSpeechComplete = () => {
    if (selectedActor !== 'none' && currentLineIndex < dialogues.length) {
      const currentDialogue = dialogues[currentLineIndex];
      if (currentDialogue.character === selectedActor) {
        setCurrentLineIndex(prev => prev + 1);
        setIsListening(false);
        
        // Start listening for next actor line
        setTimeout(() => {
          if (isPlaying) {
            const nextDialogue = dialogues[currentLineIndex + 1];
            if (nextDialogue && nextDialogue.character === selectedActor) {
              setIsListening(true);
              if (recognition) {
                recognition.start();
              }
            }
          }
        }, 500);
      }
    }
  };

  // Save settings
  const handleSettingsChange = (newSettings: Partial<TeleprompterSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('teleprompter-pro-enhanced-settings', JSON.stringify(updatedSettings));
  };

  const handleActorChange = (actor: string) => {
    setSelectedActor(actor);
    localStorage.setItem('teleprompter-pro-selected-actor', actor);
    setCurrentLineIndex(0);
  };

  const handleCharacterVoiceChange = (character: string, voiceId: string) => {
    const updated = { ...characterVoices, [character]: voiceId };
    setCharacterVoices(updated);
    localStorage.setItem('teleprompter-pro-character-voices', JSON.stringify(updated));
  };

  const handleMicrophoneChange = (deviceId: string) => {
    setMicrophoneDeviceId(deviceId);
    localStorage.setItem('teleprompter-pro-microphone-device', deviceId);
  };

  const handleVADThresholdChange = (threshold: number) => {
    setVadThreshold(threshold);
    localStorage.setItem('teleprompter-pro-vad-threshold', threshold.toString());
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('teleprompter-pro-enhanced-settings');
  };

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  // Auto-scroll to current line
  const scrollToCurrentLine = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const currentLineRef = lineRefs.current[currentLineIndex];
    if (currentLineRef) {
      const container = scrollContainerRef.current;
      const lineRect = currentLineRef.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const targetScroll = container.scrollTop + lineRect.top - containerRect.top - containerRect.height / 2;
      container.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [currentLineIndex]);

  // Play current line audio and handle speech recognition
  const playCurrentLineAudio = useCallback(async () => {
    const currentSession = sessionId;
    const lineIndex = currentLineIndex;
    
    // Prevent duplicate calls for the same line
    if (playingLineRef.current === lineIndex) {
      return;
    }
    
    if (lineIndex >= dialogues.length) {
      setIsPlaying(false);
      return;
    }

    playingLineRef.current = lineIndex;
    const currentDialogue = dialogues[lineIndex];
    
    // If it's the actor's line, start speech recognition
    if (selectedActor !== 'none' && currentDialogue.character === selectedActor) {
      setIsListening(true);
      if (recognition) {
        try {
          recognition.start();
        } catch (error) {
          console.warn('Speech recognition already started or failed to start');
        }
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
  }, [currentLineIndex, dialogues, selectedActor, characterVoices, speed, ttsVolume, sessionId, isPlaying, recognition, speak]);

  // Manual navigation
  const goToNextLine = () => {
    stopTTS();
    clearAllTimers();
    playingLineRef.current = -1;
    setIsListening(false);
    if (recognition) {
      recognition.stop();
    }
    setCurrentLineIndex((prev) => Math.min(dialogues.length - 1, prev + 1));
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
      setSpeechError('');
      setSessionId(Date.now().toString()); // Create new session
      startCountdown();
    } else {
      setIsPlaying(false);
      setIsCountingDown(false);
      setCountdownValue(0);
      setIsListening(false);
      clearAllTimers();
      playingLineRef.current = -1;
      stopTTS();
      if (recognition) {
        recognition.stop();
      }
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsCountingDown(false);
    setCountdownValue(0);
    setCurrentLineIndex(0);
    setIsListening(false);
    clearAllTimers();
    playingLineRef.current = -1;
    stopTTS();
    if (recognition) {
      recognition.stop();
    }
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

  // Play audio/start recognition when line changes - with stable dependencies
  useEffect(() => {
    if (isPlaying && currentLineIndex < dialogues.length) {
      scrollToCurrentLine();
      // Reset playing line ref when moving to new line
      if (playingLineRef.current !== currentLineIndex) {
        playingLineRef.current = -1;
      }
      playCurrentLineAudio();
    } else if (currentLineIndex >= dialogues.length) {
      setIsPlaying(false);
    }
  }, [currentLineIndex, isPlaying, dialogues.length, scrollToCurrentLine, playCurrentLineAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      stopTTS();
      if (recognition) {
        recognition.stop();
      }
    };
  }, [clearAllTimers, stopTTS, recognition]);

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
        case 'KeyS':
          event.preventDefault();
          goToNextLine();
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
    return dialogues.map((dialogue, index) => {
      const isCurrent = index === currentLineIndex;
      const isActor = selectedActor !== 'none' && dialogue.character === selectedActor;
      const hasVoice = characterVoices[dialogue.character];
      
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
            opacity: index < currentLineIndex ? 0.5 : 1,
            border: (isCurrent && isListening) ? '2px solid #ff6b6b' : 'none',
          }}
        >
          <div className="font-bold mb-2 text-primary flex items-center gap-2">
            {dialogue.character}:
            {hasVoice && !isActor && (
              <Volume2 className="w-4 h-4 text-green-500" />
            )}
            {isActor && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                {isListening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                You
              </Badge>
            )}
            {isActor && isCurrent && isVoiceDetected && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
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
  };

  const proSettings = (
    <Card className="bg-card border-border h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm text-foreground flex items-center gap-2">
          <Headphones className="w-4 h-4" />
          Pro Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {speechError && (
          <Alert className="mb-4">
            <AlertDescription className="text-xs">
              {speechError}
            </AlertDescription>
          </Alert>
        )}

        <div>
          <label className="text-xs font-medium text-foreground mb-2 block">
            Your Character
          </label>
          <Select value={selectedActor} onValueChange={handleActorChange}>
            <SelectTrigger className="h-8">
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

        <div>
          <label className="text-xs font-medium text-foreground mb-2 block">
            Microphone Device
          </label>
          <Select value={microphoneDeviceId} onValueChange={handleMicrophoneChange}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Microphone</SelectItem>
              {microphoneDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-2 block">
            Voice Detection Sensitivity: {Math.round(vadThreshold * 100)}%
          </label>
          <Slider
            value={[vadThreshold]}
            onValueChange={(value) => handleVADThresholdChange(value[0])}
            min={0.1}
            max={0.8}
            step={0.1}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-2 block">
            AI Voice Volume: {Math.round(ttsVolume * 100)}%
          </label>
          <Slider
            value={[ttsVolume]}
            onValueChange={(value) => {
              setTtsVolume(value[0]);
              localStorage.setItem('teleprompter-pro-tts-volume', value[0].toString());
            }}
            min={0}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="text-center pt-2 border-t border-border">
          <Badge variant="outline" className="mb-2 flex items-center gap-2 w-fit mx-auto">
            Line {currentLineIndex + 1} of {dialogues.length}
            {isListening && <Mic className="w-3 h-3 text-red-500" />}
            {isVoiceDetected && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextLine}
            disabled={!isPlaying}
            className="w-full h-8"
          >
            Skip Line
          </Button>
        </div>

        {/* Character Voice Settings */}
        {characters.length > 0 && (
          <div className="pt-2 border-t border-border">
            <h4 className="text-xs font-medium text-foreground mb-2">Character Voices</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {characters.slice(0, 4).map((character) => (
                <div key={character}>
                  <label className="text-xs text-foreground block mb-1">{character}</label>
                  <Select 
                    value={characterVoices[character] || voiceOptions[0].id} 
                    onValueChange={(value) => handleCharacterVoiceChange(character, value)}
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceOptions.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id} className="text-xs">
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
          onEdit={() => setIsEditingScript(true)}
          title={`Pro Mode - ${currentScript.title}`}
          status={`Line ${currentLineIndex + 1} of ${dialogues.length} • ${
            isListening ? 'Listening...' : isTTSPlaying ? 'Playing Audio' : 'Ready'
          }`}
          rightExtra={<PrivacyInfo />}
        />
      )}

      {/* Main Teleprompter Display */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{ 
          backgroundColor: settings.backgroundColor,
          transform: settings.mirrorMode ? 'scaleX(-1)' : 'none',
          paddingBottom: showSettings ? '0' : '60px',
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
                onClick={goToNextLine}
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
              onClick={goToNextLine}
              className="bg-black/50 border-white/20 text-white"
            >
              Skip Line
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

      {/* Bottom Settings Panel */}
      {!isFullscreen && (
        <BottomSettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onResetSettings={resetSettings}
          isExpanded={showSettings}
          onToggle={() => setShowSettings(!showSettings)}
        >
          {proSettings}
        </BottomSettingsPanel>
      )}

      {/* Keyboard shortcuts help */}
      {!isFullscreen && !showSettings && (
        <div className="bg-muted/50 border-t border-border px-4 py-2 absolute bottom-0 left-0 right-0">
          <p className="text-xs text-muted-foreground text-center">
            <kbd className="bg-background border border-border px-1 rounded">Space</kbd> Play/Pause • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">S</kbd> Skip Line • 
            <kbd className="bg-background border border-border px-1 rounded ml-1">F</kbd> Fullscreen • 
            <span className="text-green-500">🎤 Auto-Skip on Speech</span>
          </p>
        </div>
      )}
      
      {/* Script Editor */}
      <ScriptEditor
        script={isEditingScript ? currentScript : null}
        isOpen={isEditingScript}
        onClose={() => setIsEditingScript(false)}
        onScriptUpdated={handleScriptUpdated}
      />
    </div>
  );
};

export default EnhancedProTeleprompter;