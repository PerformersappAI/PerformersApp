
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus } from 'lucide-react';

interface FloatingSpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  speedLabels: {[key: number]: string};
  className?: string;
}

const FloatingSpeedControl: React.FC<FloatingSpeedControlProps> = ({
  speed,
  onSpeedChange,
  speedLabels,
  className = ""
}) => {
  const handleSpeedChange = (newSpeed: number) => {
    const clampedSpeed = Math.max(1, Math.min(5, newSpeed));
    onSpeedChange(clampedSpeed);
  };

  return (
    <div className={`flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white p-2 rounded-lg ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSpeedChange(speed - 1)}
        disabled={speed <= 1}
        className="h-8 w-8 p-0 text-white hover:bg-white/20"
      >
        <Minus className="w-4 h-4" />
      </Button>
      
      <div className="flex flex-col items-center min-w-16">
        <Badge variant="secondary" className="text-xs bg-white/20 text-white">
          {speed}x
        </Badge>
        <span className="text-xs text-white/80">
          {speedLabels[speed]}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSpeedChange(speed + 1)}
        disabled={speed >= 5}
        className="h-8 w-8 p-0 text-white hover:bg-white/20"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default FloatingSpeedControl;
