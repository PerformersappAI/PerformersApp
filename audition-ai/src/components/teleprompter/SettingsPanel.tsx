import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Palette, Type, RotateCcw } from 'lucide-react';

export interface TeleprompterSettings {
  fontSize: number;
  lineHeight: number;
  marginTop: number;
  marginBottom: number;
  backgroundColor: string;
  textColor: string;
  mirrorMode: boolean;
  countdownTime: number;
}

interface SettingsPanelProps {
  settings: TeleprompterSettings;
  onSettingsChange: (settings: Partial<TeleprompterSettings>) => void;
  onResetSettings?: () => void;
}

const colorPresets = [
  { id: 'black-white', bg: 'hsl(var(--teleprompter-black))', text: 'hsl(var(--teleprompter-text-white))', label: 'Black & White' },
  { id: 'white-black', bg: 'hsl(var(--teleprompter-white))', text: 'hsl(var(--teleprompter-text-black))', label: 'White & Black' },
  { id: 'green-yellow', bg: 'hsl(var(--teleprompter-green))', text: 'hsl(var(--teleprompter-text-yellow))', label: 'Green & Yellow' },
  { id: 'blue-white', bg: 'hsl(var(--teleprompter-blue))', text: 'hsl(var(--teleprompter-text-white))', label: 'Blue & White' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onResetSettings
}) => {
  const handleColorPresetChange = (presetId: string) => {
    const preset = colorPresets.find(p => p.id === presetId);
    if (preset) {
      onSettingsChange({
        backgroundColor: preset.bg,
        textColor: preset.text
      });
    }
  };

  const getCurrentPreset = () => {
    return colorPresets.find(preset => 
      preset.bg === settings.backgroundColor && 
      preset.text === settings.textColor
    )?.id || 'custom';
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Teleprompter Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-foreground">Text Settings</h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Font Size: {settings.fontSize}px
              </label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={(value) => onSettingsChange({ fontSize: value[0] })}
                min={16}
                max={120}
                step={2}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Line Height: {settings.lineHeight}
              </label>
              <Slider
                value={[settings.lineHeight]}
                onValueChange={(value) => onSettingsChange({ lineHeight: value[0] })}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Layout Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Layout</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Top Margin: {settings.marginTop}%
              </label>
              <Slider
                value={[settings.marginTop]}
                onValueChange={(value) => onSettingsChange({ marginTop: value[0] })}
                min={0}
                max={40}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Bottom Margin: {settings.marginBottom}%
              </label>
              <Slider
                value={[settings.marginBottom]}
                onValueChange={(value) => onSettingsChange({ marginBottom: value[0] })}
                min={0}
                max={40}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Color Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-foreground">Colors</h4>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Color Theme
            </label>
            <Select value={getCurrentPreset()} onValueChange={handleColorPresetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorPresets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: preset.bg }}
                      />
                      <div 
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: preset.text }}
                      />
                      {preset.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Options</h4>

          <div className="flex items-center justify-between">
            <label className="text-sm text-foreground">Mirror Mode</label>
            <Button
              variant={settings.mirrorMode ? "default" : "outline"}
              size="sm"
              onClick={() => onSettingsChange({ mirrorMode: !settings.mirrorMode })}
            >
              {settings.mirrorMode ? 'On' : 'Off'}
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Countdown Time: {settings.countdownTime}s
            </label>
            <Select 
              value={settings.countdownTime.toString()} 
              onValueChange={(value) => onSettingsChange({ countdownTime: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Countdown</SelectItem>
                <SelectItem value="3">3 seconds</SelectItem>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset Button */}
        {onResetSettings && (
          <div className="pt-4 border-t border-border">
            <Button 
              variant="outline" 
              onClick={onResetSettings}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;