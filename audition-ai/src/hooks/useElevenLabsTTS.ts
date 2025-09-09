import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ElevenLabsTTSOptions {
  voiceId?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const useElevenLabsTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, options: ElevenLabsTTSOptions = {}) => {
    const { voiceId = '9BWtsMINqrJLrRacOk9x', onStart, onComplete, onError } = options;

    // Stop any currently playing audio
    stop();

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice: voiceId,
          useElevenLabs: true
        }
      });

      if (error) {
        throw new Error((error as any)?.message || 'TTS function error');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.provider === 'browser') {
        throw new Error(data?.error || 'ElevenLabs unavailable (received browser provider)');
      }

      // Convert base64 to audio blob
      const audioData = atob(data.audioContent);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      currentAudio.current = audio;

      // Ensure we only mark start once across different browsers
      let started = false;
      const markStarted = () => {
        if (!started) {
          started = true;
          setIsLoading(false);
          setIsPlaying(true);
          onStart?.();
        }
      };

      audio.onloadstart = markStarted;
      // Extra safety for browsers that don't reliably fire onloadstart
      audio.oncanplay = markStarted;
      audio.onplay = markStarted;

      audio.onended = () => {
        setIsPlaying(false);
        setIsLoading(false);
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
      console.error('ElevenLabs TTS error:', errorMessage);
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