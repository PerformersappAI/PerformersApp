import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Square, 
  Maximize, 
  Minimize, 
  ArrowLeft,
  Settings,
  Clock,
  Home,
  Edit
} from 'lucide-react';

interface TopBarControlsProps {
  isPlaying: boolean;
  speed: number;
  isFullscreen: boolean;
  isCountingDown?: boolean;
  countdownValue?: number;
  showSettings?: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  onToggleFullscreen: () => void;
  onToggleSettings?: () => void;
  onBack?: () => void;
  onEdit?: () => void;
  title?: string;
  status?: string;
  rightExtra?: React.ReactNode;
}

const TopBarControls: React.FC<TopBarControlsProps> = ({
  isPlaying,
  speed,
  isFullscreen,
  isCountingDown = false,
  countdownValue,
  showSettings = false,
  onPlayPause,
  onStop,
  onSpeedChange,
  onToggleFullscreen,
  onToggleSettings,
  onBack,
  onEdit,
  title = "Teleprompter",
  status,
  rightExtra
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Back button, Home button, Edit button, and title */}
        <div className="flex items-center gap-4">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
            aria-label="Go to homepage"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-2"
              aria-label="Edit script"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          )}
          
          <div>
            <h2 className="font-semibold text-foreground">{title}</h2>
            {status && (
              <p className="text-sm text-muted-foreground">{status}</p>
            )}
          </div>

          {/* Countdown indicator */}
          {isCountingDown && countdownValue !== undefined && (
            <Badge variant="default" className="bg-primary text-primary-foreground animate-pulse">
              <Clock className="w-3 h-3 mr-1" />
              {countdownValue}
            </Badge>
          )}
        </div>

        {/* Center - Playback controls */}
        <div className="flex items-center gap-3">
          <Button
            variant={isPlaying ? "default" : "outline"}
            size="sm"
            onClick={onPlayPause}
            className="min-w-[80px]"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onStop}
          >
            <Square className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 min-w-[120px]">
            <span className="text-sm text-muted-foreground">Speed:</span>
            <Slider
              value={[speed]}
              onValueChange={(value) => onSpeedChange(value[0])}
              min={0.5}
              max={3}
              step={0.1}
              className="w-20"
            />
            <Badge variant="outline" className="min-w-[45px] text-center">
              {speed.toFixed(1)}x
            </Badge>
          </div>
        </div>

        {/* Right side - Settings, extra content, and fullscreen */}
        <div className="flex items-center gap-2">
          {rightExtra}
          
          {onToggleSettings && (
            <Button
              variant={showSettings ? "default" : "outline"}
              size="sm"
              onClick={onToggleSettings}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopBarControls;