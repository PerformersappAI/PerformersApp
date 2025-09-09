import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Palette, Type, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface BottomSettingsPanelProps {
  settings: TeleprompterSettings;
  onSettingsChange: (settings: Partial<TeleprompterSettings>) => void;
  onResetSettings?: () => void;
  isExpanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode; // For mode-specific settings
}

const colorPresets = [
  { id: 'black-white', bg: 'hsl(var(--teleprompter-black))', text: 'hsl(var(--teleprompter-text-white))', label: 'Black & White' },
  { id: 'white-black', bg: 'hsl(var(--teleprompter-white))', text: 'hsl(var(--teleprompter-text-black))', label: 'White & Black' },
  { id: 'green-yellow', bg: 'hsl(var(--teleprompter-green))', text: 'hsl(var(--teleprompter-text-yellow))', label: 'Green & Yellow' },
  { id: 'blue-white', bg: 'hsl(var(--teleprompter-blue))', text: 'hsl(var(--teleprompter-text-white))', label: 'Blue & White' },
];

const BottomSettingsPanel: React.FC<BottomSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onResetSettings,
  isExpanded,
  onToggle,
  children
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full h-12 rounded-none border-0 justify-center gap-2 hover:bg-accent"
          >
            <Settings className="w-4 h-4" />
            Settings
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="max-h-96 overflow-y-auto bg-background">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Basic Settings */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm text-foreground flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Text & Layout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-2 block">
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
                    <label className="text-xs font-medium text-foreground mb-2 block">
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">
                        Top: {settings.marginTop}%
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
                      <label className="text-xs font-medium text-foreground mb-2 block">
                        Bottom: {settings.marginBottom}%
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
                </CardContent>
              </Card>

              {/* Color Settings */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm text-foreground flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Colors & Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-2 block">
                      Color Theme
                    </label>
                    <Select value={getCurrentPreset()} onValueChange={handleColorPresetChange}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorPresets.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded border border-border"
                                style={{ backgroundColor: preset.bg }}
                              />
                              <div 
                                className="w-3 h-3 rounded border border-border"
                                style={{ backgroundColor: preset.text }}
                              />
                              {preset.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs text-foreground">Mirror Mode</label>
                    <Switch
                      checked={settings.mirrorMode}
                      onCheckedChange={(checked) => onSettingsChange({ mirrorMode: checked })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground mb-2 block">
                      Countdown: {settings.countdownTime}s
                    </label>
                    <Select 
                      value={settings.countdownTime.toString()} 
                      onValueChange={(value) => onSettingsChange({ countdownTime: parseInt(value) })}
                    >
                      <SelectTrigger className="h-8">
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

                  {onResetSettings && (
                    <Button 
                      variant="outline" 
                      onClick={onResetSettings}
                      className="w-full h-8 text-xs"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Mode-specific Settings */}
              {children && (
                <div className="lg:col-span-1">
                  {children}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default BottomSettingsPanel;