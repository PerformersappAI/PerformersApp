import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SimpleTTSOptions {
  voice?: string;
  speed?: number;
  volume?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const useSimpleTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, options: SimpleTTSOptions = {}) => {
    const { voice = 'en-US-Standard-C', speed = 1.0, volume = 1.0, onStart, onComplete, onError } = options;

    // Stop any currently playing audio
    stop();

    try {
      setIsLoading(true);
      onStart?.();

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice,
          speed,
          useGoogle: true,
        },
      });

      if (error) {
        throw new Error(`TTS error: ${error.message}`);
      }

      if (!data || !data.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert base64 to audio URL
      const binary = atob(data.audioContent);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audio.volume = Math.max(0, Math.min(1, volume)); // Clamp volume between 0 and 1
      currentAudio.current = audio;

      audio.onloadstart = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        onComplete?.();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
        onError?.('Audio playback failed');
      };

      await audio.play();
      
    } catch (error) {
      setIsLoading(false);
      setIsPlaying(false);
      const errorMessage = (error as any)?.message || 'Unknown error occurred';
      onError?.(errorMessage);
      console.error('TTS error:', errorMessage);
    }
  }, []);

  const stop = useCallback(() => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    isLoading
  };
};