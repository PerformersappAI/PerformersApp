import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Palette, Type, Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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

interface RightSideSettingsProps {
  settings: TeleprompterSettings;
  onSettingsChange: (settings: Partial<TeleprompterSettings>) => void;
  onResetSettings?: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Character and TTS settings
  characters: string[];
  selectedActor: string;
  onActorChange: (actor: string) => void;
  characterVoices: Record<string, string>;
  onCharacterVoiceChange: (character: string, voiceId: string) => void;
  ttsVolume: number;
  onTtsVolumeChange: (volume: number) => void;
  ttsSpeed: number;
  onTtsSpeedChange: (speed: number) => void;
  voiceOptions: Array<{ id: string; name: string; gender: string }>;
}

const backgroundPresets = [
  { id: 'green', name: 'Green Screen', color: 'hsl(120, 100%, 25%)' },
  { id: 'yellow', name: 'Yellow', color: 'hsl(51, 100%, 50%)' },
  { id: 'white', name: 'White', color: 'hsl(0, 0%, 100%)' },
  { id: 'black', name: 'Black', color: 'hsl(0, 0%, 0%)' },
];

const textColors = [
  { id: 'white', name: 'White', color: 'hsl(0, 0%, 100%)' },
  { id: 'black', name: 'Black', color: 'hsl(0, 0%, 0%)' },
  { id: 'yellow', name: 'Yellow', color: 'hsl(51, 100%, 50%)' },
  { id: 'blue', name: 'Blue', color: 'hsl(210, 100%, 50%)' },
];

const RightSideSettings: React.FC<RightSideSettingsProps> = ({
  settings,
  onSettingsChange,
  onResetSettings,
  isOpen,
  onOpenChange,
  characters,
  selectedActor,
  onActorChange,
  characterVoices,
  onCharacterVoiceChange,
  ttsVolume,
  onTtsVolumeChange,
  ttsSpeed,
  onTtsSpeedChange,
  voiceOptions,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Teleprompter Settings
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Text Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="w-4 h-4" />
                Text Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Font Size: {settings.fontSize}px</Label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={(value) => onSettingsChange({ fontSize: value[0] })}
                  min={20}
                  max={120}
                  step={2}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label className="text-sm">Text Color</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {textColors.map((color) => (
                    <Button
                      key={color.id}
                      variant={settings.textColor === color.color ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSettingsChange({ textColor: color.color })}
                      className="justify-start"
                    >
                      <div
                        className="w-4 h-4 rounded border mr-2"
                        style={{ backgroundColor: color.color }}
                      />
                      {color.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Background Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="w-4 h-4" />
                Background Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {backgroundPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={settings.backgroundColor === preset.color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSettingsChange({ backgroundColor: preset.color })}
                    className="justify-start"
                  >
                    <div
                      className="w-4 h-4 rounded border mr-2"
                      style={{ backgroundColor: preset.color }}
                    />
                    {preset.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="w-4 h-4" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Character Selection */}
              <div>
                <Label className="text-sm">Your Character</Label>
                <Select value={selectedActor} onValueChange={onActorChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select your character" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (View All)</SelectItem>
                    {characters.map((character) => (
                      <SelectItem key={character} value={character}>
                        {character}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AI Volume */}
              <div>
                <Label className="text-sm">AI Voice Volume: {Math.round(ttsVolume * 100)}%</Label>
                <Slider
                  value={[ttsVolume]}
                  onValueChange={(value) => onTtsVolumeChange(value[0])}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              {/* AI Speed */}
              <div>
                <Label className="text-sm">AI Voice Speed: {ttsSpeed.toFixed(1)}x</Label>
                <Slider
                  value={[ttsSpeed]}
                  onValueChange={(value) => onTtsSpeedChange(value[0])}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              {/* Character Voices */}
              <div className="space-y-3">
                <Label className="text-sm">Character Voices</Label>
                {characters.map((character) => (
                  <div key={character}>
                    <Label className="text-xs text-muted-foreground">{character}</Label>
                    <Select
                      value={characterVoices[character] || voiceOptions[0]?.id}
                      onValueChange={(voiceId) => onCharacterVoiceChange(character, voiceId)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Mirror Mode */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Mirror Mode</Label>
                <Switch
                  checked={settings.mirrorMode}
                  onCheckedChange={(checked) => onSettingsChange({ mirrorMode: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reset Button */}
          {onResetSettings && (
            <Button 
              variant="outline" 
              onClick={onResetSettings}
              className="w-full"
            >
              Reset to Defaults
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RightSideSettings;