import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VOICES = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill" },
];

const TTSDebug: React.FC = () => {
  const [text, setText] = useState(
    "Hello! This is a quick test of ElevenLabs text-to-speech."
  );
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const synthesize = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "text-to-speech",
        {
          body: {
            text,
            voice: voiceId,
            useElevenLabs: true,
          },
        }
      );

      if (error) throw new Error(error.message);

      setResult(data);

      if (data.provider !== "elevenlabs") {
        setError(
          (data?.error ? `${data.error} ` : "") +
            `Provider: ${data?.provider || "unknown"}. Check ELEVENLABS_API_KEY in Supabase.`
        );
        return;
      }

      // Decode base64 and create audio URL
      const binary = atob(data.audioContent);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Text-to-Speech Debugger (ElevenLabs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger id="voice">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.id.slice(0, 6)}…)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
            />
          </div>

          <Button onClick={synthesize} disabled={isLoading || !text.trim()}>
            {isLoading ? "Synthesizing…" : "Synthesize with ElevenLabs"}
          </Button>

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          {audioUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <audio src={audioUrl} controls />
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <Label>Raw response</Label>
              <pre className="text-xs overflow-auto p-3 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default TTSDebug;
