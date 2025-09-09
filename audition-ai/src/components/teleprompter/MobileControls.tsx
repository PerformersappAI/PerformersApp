import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward,
  Volume2,
  Users,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

interface MobileControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onSkip: () => void;
  onBack: () => void;
  // Character settings
  characters: string[];
  selectedActor: string;
  onActorChange: (actor: string) => void;
  // Volume settings
  ttsVolume: number;
  onTtsVolumeChange: (volume: number) => void;
  // Settings
  onOpenSettings: () => void;
  // Status
  currentLineIndex: number;
  totalLines: number;
  isCountingDown: boolean;
  countdownValue: number;
}

const MobileControls: React.FC<MobileControlsProps> = ({
  isPlaying,
  onPlayPause,
  onStop,
  onSkip,
  onBack,
  characters,
  selectedActor,
  onActorChange,
  ttsVolume,
  onTtsVolumeChange,
  onOpenSettings,
  currentLineIndex,
  totalLines,
  isCountingDown,
  countdownValue,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 space-y-4 md:hidden">
      {/* Top row - character and volume controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Your Character</Label>
          <Select value={selectedActor} onValueChange={onActorChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select" />
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

        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span className="text-xs">{Math.round(ttsVolume * 100)}%</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>AI Voice Volume</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <Slider
                value={[ttsVolume]}
                onValueChange={(value) => onTtsVolumeChange(value[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <div className="text-center mt-2 text-sm text-muted-foreground">
                {Math.round(ttsVolume * 100)}%
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Line {currentLineIndex + 1} of {totalLines}
        </div>
        {isCountingDown && (
          <Badge variant="secondary">
            Starting in {countdownValue}s
          </Badge>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onStop}>
            <Square className="w-4 h-4" />
          </Button>
          
          <Button 
            size="lg"
            onClick={onPlayPause}
            disabled={isCountingDown}
            className="rounded-full h-12 w-12"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={onSkip}>
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={onOpenSettings}>
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default MobileControls;