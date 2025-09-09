import { useState, useRef, useCallback } from 'react';

interface ProVoiceTTSOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const useProVoiceTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, options: ProVoiceTTSOptions = {}) => {
    const { onStart, onComplete, onError } = options;

    // Stop any currently playing audio
    stop();

    try {
      setIsLoading(true);
      onStart?.();

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filename = `provoice_${timestamp}_${randomId}`;

      // Call Pro-Voice API
      const response = await fetch('http://162.19.255.187:3000/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          filename: `${filename}.wav`
        })
      });

      if (!response.ok) {
        throw new Error(`Pro-Voice API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.file) {
        throw new Error('No audio file received from Pro-Voice API');
      }

      // Build audio URL
      const audioUrl = `http://162.19.255.187:3000/audio/${data.file}`;
      
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
        }
      };

      audio.onloadstart = markStarted;
      audio.oncanplay = markStarted;
      audio.onplay = markStarted;

      audio.onended = () => {
        setIsPlaying(false);
        setIsLoading(false);
        onComplete?.();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        onError?.('Audio playback failed');
      };

      await audio.play();
      
    } catch (error) {
      setIsLoading(false);
      setIsPlaying(false);
      const errorMessage = (error as any)?.message || 'Unknown error occurred';
      onError?.(errorMessage);
      console.error('Pro-Voice TTS error:', errorMessage);
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