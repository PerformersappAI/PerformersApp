
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Users, Mic, MicOff, Volume2, ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react';
import { parseScript, DialogueLine, ScriptParsing } from '@/utils/scriptParser';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useToast } from '@/hooks/use-toast';
import FloatingSpeedControl from '@/components/FloatingSpeedControl';

interface DialogueModeProps {
  script: string;
  onBack: () => void;
}

const DialogueMode: React.FC<DialogueModeProps> = ({ script, onBack }) => {
  const [parsedScript, setParsedScript] = useState<ScriptParsing | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [userTurn, setUserTurn] = useState(false);
  const [pauseTimeout, setPauseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [speed, setSpeed] = useState(3); // Default to normal speed
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, stop, isPlaying } = useTextToSpeech();
  const { toast } = useToast();

  // Speed labels for dialogue context
  const speedLabels: {[key: number]: string} = {
    1: 'Very Slow',
    2: 'Slow', 
    3: 'Normal',
    4: 'Fast',
    5: 'Very Fast'
  };

  // Speed multipliers for timing calculations
  const getSpeedMultiplier = useCallback((currentSpeed: number) => {
    const multipliers = {
      1: 2.0,    // Very slow - 2x longer pauses
      2: 1.5,    // Slow - 1.5x longer pauses
      3: 1.0,    // Normal - standard timing
      4: 0.7,    // Fast - 0.7x pauses
      5: 0.5     // Very fast - 0.5x pauses
    };
    return multipliers[currentSpeed as keyof typeof multipliers] || 1.0;
  }, []);

  // Get speech rate based on speed
  const getSpeechRate = useCallback((currentSpeed: number) => {
    const rates = {
      1: 0.7,    // Very slow speech
      2: 0.85,   // Slow speech
      3: 1.0,    // Normal speech
      4: 1.2,    // Fast speech
      5: 1.4     // Very fast speech
    };
    return rates[currentSpeed as keyof typeof rates] || 1.0;
  }, []);

  // Handle speed changes
  const handleSpeedChange = useCallback((newSpeed: number) => {
    const clampedSpeed = Math.max(1, Math.min(5, newSpeed));
    setSpeed(clampedSpeed);
    toast({
      title: "Speed Changed",
      description: `Dialogue speed set to ${speedLabels[clampedSpeed]}`,
    });
  }, [speedLabels, toast]);

  // Parse script on mount
  useEffect(() => {
    if (script) {
      const parsed = parseScript(script);
      setParsedScript(parsed);
      
      if (parsed.characters.length === 0 || parsed.isPlainText) {
        toast({
          title: "No Dialogue Characters Found",
          description: "This appears to be plain text. Dialogue mode requires character names in CAPS followed by dialogue.",
          variant: "destructive"
        });
      }
    }
  }, [script, toast]);

  // Keyboard navigation for dialogue mode
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      
      switch (e.code) {
        case 'ArrowUp':
          e.preventDefault();
          goToPreviousLine();
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToNextLine();
          break;
        case 'Space':
          e.preventDefault();
          if (isActive && userTurn) {
            handleUserFinished();
          } else if (!isActive) {
            startDialogue();
          }
          break;
        case 'Digit1':
          e.preventDefault();
          handleSpeedChange(1);
          break;
        case 'Digit2':
          e.preventDefault();
          handleSpeedChange(2);
          break;
        case 'Digit3':
          e.preventDefault();
          handleSpeedChange(3);
          break;
        case 'Digit4':
          e.preventDefault();
          handleSpeedChange(4);
          break;
        case 'Digit5':
          e.preventDefault();
          handleSpeedChange(5);
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          handleSpeedChange(speed + 1);
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          handleSpeedChange(speed - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, userTurn, currentLineIndex, speed, handleSpeedChange]);

  // Mouse wheel navigation for dialogue mode
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!scrollRef.current?.contains(e.target as Node)) return;
      
      e.preventDefault();
      if (e.deltaY > 0) {
        goToNextLine();
      } else {
        goToPreviousLine();
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        scrollElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentLineIndex]);

  const currentLine = parsedScript?.dialogues[currentLineIndex];
  const isMyTurn = currentLine && currentLine.character === selectedCharacter;
  const totalLines = parsedScript?.dialogues.length || 0;

  const goToNextLine = useCallback(() => {
    if (currentLineIndex < totalLines - 1) {
      setCurrentLineIndex(prev => prev + 1);
      if (isActive) {
        // Pause auto-play when manually navigating
        setIsActive(false);
        stop();
        if (pauseTimeout) {
          clearTimeout(pauseTimeout);
          setPauseTimeout(null);
        }
      }
    }
  }, [currentLineIndex, totalLines, isActive, stop, pauseTimeout]);

  const goToPreviousLine = useCallback(() => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(prev => prev - 1);
      if (isActive) {
        // Pause auto-play when manually navigating
        setIsActive(false);
        stop();
        if (pauseTimeout) {
          clearTimeout(pauseTimeout);
          setPauseTimeout(null);
        }
      }
    }
  }, [currentLineIndex, isActive, stop, pauseTimeout]);

  const nextLine = useCallback(() => {
    if (currentLineIndex < totalLines - 1) {
      setCurrentLineIndex(prev => prev + 1);
    } else {
      setIsActive(false);
      toast({
        title: "Scene Complete",
        description: "You've reached the end of the script!"
      });
    }
  }, [currentLineIndex, totalLines, toast]);

  // Calculate automatic pause based on text length and speed
  const calculatePauseTime = useCallback((text: string) => {
    const wordsPerMinute = 150; // Average reading speed
    const words = text.split(' ').length;
    const readingTimeMs = (words / wordsPerMinute) * 60 * 1000;
    // Apply speed multiplier
    const speedMultiplier = getSpeedMultiplier(speed);
    // Add extra buffer time for user to process and respond
    const baseTime = Math.max(readingTimeMs + 2000, 3000); // Minimum 3 seconds
    return baseTime * speedMultiplier;
  }, [speed, getSpeedMultiplier]);

  const speakCurrentLine = useCallback(async () => {
    if (!currentLine || isMyTurn) return;

    try {
      // Choose voice based on character
      const voiceMap: {[key: string]: string} = {
        default: 'english',
        // Add more character-specific voices as needed
      };
      
      const voice = voiceMap[currentLine.character] || 'english';
      const speechRate = getSpeechRate(speed);
      
      await speak(currentLine.text, { voice, speed: speechRate });
      
      // Calculate automatic pause based on sentence length and speed
      const pauseTime = calculatePauseTime(currentLine.text);
      
      // After AI speaks, wait for calculated pause then move to next line
      const timeout = setTimeout(() => {
        nextLine();
      }, pauseTime);
      
      setPauseTimeout(timeout);
      
    } catch (error) {
      console.error('Error speaking line:', error);
      toast({
        title: "Speech Error",
        description: "Failed to play AI dialogue. Moving to next line.",
        variant: "destructive"
      });
      nextLine();
    }
  }, [currentLine, isMyTurn, speak, calculatePauseTime, nextLine, toast, getSpeechRate, speed]);

  // Auto-scroll to current line
  useEffect(() => {
    if (scrollRef.current && currentLineIndex >= 0) {
      const currentElement = scrollRef.current.querySelector(`[data-line-index="${currentLineIndex}"]`);
      if (currentElement) {
        currentElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentLineIndex]);

  // Auto-play AI lines and manage user turns
  useEffect(() => {
    if (isActive && currentLine) {
      if (isMyTurn) {
        // It's user's turn - set user turn flag
        setUserTurn(true);
      } else {
        // It's AI's turn - speak after small delay (adjusted by speed)
        const delayMultiplier = getSpeedMultiplier(speed);
        const delay = 1000 * delayMultiplier;
        
        const timer = setTimeout(() => {
          speakCurrentLine();
        }, delay);

        return () => clearTimeout(timer);
      }
    }
  }, [isActive, currentLine, isMyTurn, speakCurrentLine, speed, getSpeedMultiplier]);

  const startDialogue = () => {
    if (!selectedCharacter) {
      toast({
        title: "Select Character",
        description: "Please select your character first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsActive(true);
    setUserTurn(false);
  };

  const pauseDialogue = () => {
    setIsActive(false);
    stop();
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      setPauseTimeout(null);
    }
  };

  const resetDialogue = () => {
    setIsActive(false);
    setCurrentLineIndex(0);
    setUserTurn(false);
    stop();
    if (pauseTimeout) {
      clearTimeout(pauseTimeout);
      setPauseTimeout(null);
    }
  };

  const handleUserFinished = () => {
    setUserTurn(false);
    // Automatically advance after user finishes speaking (adjusted by speed)
    const delayMultiplier = getSpeedMultiplier(speed);
    const delay = 1000 * delayMultiplier;
    
    const timeout = setTimeout(() => {
      nextLine();
    }, delay);
    setPauseTimeout(timeout);
  };

  if (!parsedScript) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p>Loading dialogue mode...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (parsedScript.characters.length === 0 || parsedScript.isPlainText) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">No Dialogue Characters Detected</h3>
              <p className="text-muted-foreground">
                This appears to be plain text or doesn't contain dialogue in the expected format. 
                For dialogue mode, format your script with character names in ALL CAPS followed by their dialogue:
              </p>
              <div className="bg-muted p-4 rounded-lg text-left">
                <pre className="text-sm">
{`JOHN: Hello, how are you today?
MARY: I'm doing great, thanks for asking!
JOHN: That's wonderful to hear.`}
                </pre>
              </div>
              <p className="text-sm text-muted-foreground">
                You can still use the regular script editor for plain text scripts.
              </p>
              <Button onClick={onBack}>Back to Script</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Settings Panel */}
      <div className="w-80 border-r border-border bg-card p-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Dialogue Mode</h2>
            <Users className="w-5 h-5" />
          </div>

          {/* Character Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Your Character</Label>
                <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your character" />
                  </SelectTrigger>
                  <SelectContent>
                    {parsedScript.characters.map(character => (
                      <SelectItem key={character} value={character}>
                        {character}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={startDialogue} 
                  disabled={!selectedCharacter || isActive}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Scene
                </Button>
                
                <Button 
                  onClick={pauseDialogue} 
                  disabled={!isActive}
                  variant="outline"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                
                <Button 
                  onClick={resetDialogue}
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>

              {/* Manual Navigation Controls */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPreviousLine}
                  disabled={currentLineIndex === 0}
                  className="flex-1"
                >
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextLine}
                  disabled={currentLineIndex >= totalLines - 1}
                  className="flex-1"
                >
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Next
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Found {parsedScript.characters.length} characters: {parsedScript.characters.join(', ')}
              </div>
            </CardContent>
          </Card>

          {/* Speed Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dialogue Speed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpeedChange(speed - 1)}
                  disabled={speed <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <div className="flex flex-col items-center flex-1">
                  <Badge variant="secondary" className="text-xs">
                    {speed}x
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {speedLabels[speed]}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSpeedChange(speed + 1)}
                  disabled={speed >= 5}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Keys: 1-5 for presets, +/- to adjust
              </div>
            </CardContent>
          </Card>

          {/* Navigation Help */}
          <Card>
            <CardContent className="p-4">
              <div className="text-xs space-y-1">
                <div><strong>Navigation:</strong></div>
                <div>↑/↓ arrows: Navigate lines</div>
                <div>Mouse wheel: Navigate lines</div>
                <div>Space: Continue/Start scene</div>
                <div>1-5: Speed presets</div>
                <div>+/-: Adjust speed</div>
              </div>
            </CardContent>
          </Card>

          {/* Current Line Status */}
          {currentLine && (
            <Card className={`border-2 ${isMyTurn ? 'border-primary' : 'border-secondary'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isMyTurn ? 'default' : 'secondary'}>
                      {currentLine.character}
                    </Badge>
                    {isMyTurn ? (
                      <Mic className="w-4 h-4 text-primary" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-secondary" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Line {currentLineIndex + 1} of {totalLines}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isActive && isMyTurn && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Your turn to speak</span>
                      <Button 
                        onClick={handleUserFinished}
                        size="sm"
                        variant="outline"
                      >
                        I'm finished
                      </Button>
                    </div>
                  </div>
                )}
                
                {isActive && !isMyTurn && isPlaying && (
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">AI is speaking...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Script Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Scene Progress</span>
                <span className="text-sm font-mono">
                  {Math.round(((currentLineIndex + 1) / totalLines) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentLineIndex + 1) / totalLines) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <Button variant="outline" onClick={onBack} className="w-full">
            Back to Script
          </Button>
        </div>
      </div>

      {/* Script Display */}
      <div className="flex-1 bg-black relative overflow-hidden">
        {/* Floating Speed Control */}
        <FloatingSpeedControl
          speed={speed}
          onSpeedChange={handleSpeedChange}
          speedLabels={speedLabels}
          className="absolute top-4 right-4 z-10"
        />
        
        <div 
          className="h-full overflow-y-auto scrollbar-hide"
          ref={scrollRef}
          style={{
            scrollBehavior: 'smooth'
          }}
        >
          <div className="min-h-screen py-8 px-8">
            <div className="text-center leading-relaxed tracking-wide text-2xl font-sans text-white whitespace-pre-wrap">
              {parsedScript.dialogues.map((line, index) => {
                const isCurrentLine = index === currentLineIndex;
                const isMyLine = line.character === selectedCharacter;
                const isPastLine = index < currentLineIndex;
                
                return (
                  <div 
                    key={index} 
                    data-line-index={index}
                    className={`mb-6 transition-all duration-500 cursor-pointer ${
                      isCurrentLine 
                        ? isMyLine 
                          ? 'text-yellow-400 font-bold scale-105 bg-yellow-400/10 p-4 rounded-lg border-2 border-yellow-400' 
                          : 'text-blue-400 font-bold scale-105 bg-blue-400/10 p-4 rounded-lg border-2 border-blue-400'
                        : isPastLine 
                          ? 'text-gray-500 opacity-50'
                          : 'text-white hover:text-gray-300'
                    }`}
                    onClick={() => setCurrentLineIndex(index)}
                  >
                    <div className="font-bold text-lg mb-2">{line.character}:</div>
                    <div>{line.text}</div>
                  </div>
                );
              })}
              <div className="h-screen"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialogueMode;
