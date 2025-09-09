import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TTSVoice {
  name: string;
  googleVoiceId: string;
  gender: 'male' | 'female';
  description: string;
}

export const GOOGLE_TTS_VOICES: TTSVoice[] = [
  { name: 'Male Professional', googleVoiceId: 'en-US-Neural2-J', gender: 'male', description: 'Clear, professional male voice' },
  { name: 'Female Professional', googleVoiceId: 'en-US-Neural2-F', gender: 'female', description: 'Clear, professional female voice' },
  { name: 'Male Warm', googleVoiceId: 'en-US-Neural2-A', gender: 'male', description: 'Warm, friendly male voice' },
  { name: 'Female Warm', googleVoiceId: 'en-US-Neural2-C', gender: 'female', description: 'Warm, friendly female voice' },
  { name: 'Male Deep', googleVoiceId: 'en-US-Neural2-D', gender: 'male', description: 'Deep, authoritative male voice' },
  { name: 'Female Bright', googleVoiceId: 'en-US-Neural2-E', gender: 'female', description: 'Bright, energetic female voice' },
  { name: 'Male Casual', googleVoiceId: 'en-US-Neural2-G', gender: 'male', description: 'Casual, conversational male voice' },
  { name: 'Female Soft', googleVoiceId: 'en-US-Neural2-H', gender: 'female', description: 'Soft, gentle female voice' }
];

export interface DialogueLine {
  character: string;
  text: string;
  lineNumber: number;
}

interface TTSQueueItem {
  id: string;
  dialogue: DialogueLine;
  voice: string;
  speed: number;
  audioContent?: string;
  status: 'pending' | 'generating' | 'ready' | 'playing' | 'completed' | 'error';
}

interface EnhancedTTSOptions {
  voice?: string;
  speed?: number;
  volume?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export const useEnhancedTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [queue, setQueue] = useState<TTSQueueItem[]>([]);
  const [volume, setVolume] = useState(1.0);
  const [ttsHealth, setTtsHealth] = useState<'unknown' | 'healthy' | 'error'>('unknown');
  
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());

  // Test TTS health
  const checkTTSHealth = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { health: true }
      });
      
      setTtsHealth(data?.healthy ? 'healthy' : 'error');
      return data?.healthy || false;
    } catch (error) {
      setTtsHealth('error');
      return false;
    }
  }, []);

  // Generate cache key for audio
  const getCacheKey = useCallback((text: string, voice: string, speed: number) => {
    return `${text}-${voice}-${speed}`.replace(/[^a-zA-Z0-9-]/g, '');
  }, []);

  // Pre-generate TTS for multiple lines
  const preGenerateAudio = useCallback(async (
    dialogues: DialogueLine[], 
    characterVoices: Record<string, string>,
    speed: number = 1.0,
    onProgress?: (progress: number) => void
  ) => {
    console.log('Pre-generating audio for', dialogues.length, 'lines');
    setIsLoading(true);

    const newQueue: TTSQueueItem[] = dialogues.map((dialogue, index) => ({
      id: `${dialogue.lineNumber}-${index}`,
      dialogue,
      voice: characterVoices[dialogue.character] || 'en-US-Neural2-J',
      speed,
      status: 'pending' as const
    }));

    setQueue(newQueue);

    // Generate audio for each line
    for (let i = 0; i < newQueue.length; i++) {
      const item = newQueue[i];
      const cacheKey = getCacheKey(item.dialogue.text, item.voice, item.speed);
      
      // Check cache first
      if (audioCache.current.has(cacheKey)) {
        item.audioContent = audioCache.current.get(cacheKey);
        item.status = 'ready';
        onProgress?.(((i + 1) / newQueue.length) * 100);
        continue;
      }

      try {
        item.status = 'generating';
        setQueue([...newQueue]);

        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: item.dialogue.text,
            voice: item.voice,
            speed: item.speed,
            useGoogle: true
          }
        });

        if (error || !data?.audioContent) {
          item.status = 'error';
          console.error('TTS generation failed for line:', item.dialogue.text);
          continue;
        }

        // Cache the audio
        audioCache.current.set(cacheKey, data.audioContent);
        item.audioContent = data.audioContent;
        item.status = 'ready';

        onProgress?.(((i + 1) / newQueue.length) * 100);
      } catch (error) {
        item.status = 'error';
        console.error('TTS error for line:', item.dialogue.text, error);
      }
    }

    setQueue([...newQueue]);
    setIsLoading(false);
    console.log('Pre-generation completed. Ready lines:', newQueue.filter(q => q.status === 'ready').length);
  }, [getCacheKey]);

  const stop = useCallback(() => {
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    setIsPlaying(false);
    
    // Reset playing statuses
    const updatedQueue = queue.map(item => ({
      ...item,
      status: item.status === 'playing' ? 'ready' as const : item.status
    }));
    setQueue(updatedQueue);
  }, [queue]);

  // Play single line with proper queue management
  const playLine = useCallback(async (lineIndex: number, options: EnhancedTTSOptions = {}) => {
    const { volume: vol = 1.0, onStart, onComplete, onError } = options;
    
    if (lineIndex >= queue.length) {
      onError?.('Line index out of bounds');
      return;
    }

    const queueItem = queue[lineIndex];
    if (queueItem.status !== 'ready' || !queueItem.audioContent) {
      onError?.('Audio not ready for this line');
      return;
    }

    // Stop current audio
    stop();

    try {
      setCurrentLineIndex(lineIndex);
      queueItem.status = 'playing';
      setQueue([...queue]);

      onStart?.();

      // Convert base64 to audio URL
      const binary = atob(queueItem.audioContent);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      // Create and configure audio
      const audio = new Audio(audioUrl);
      audio.volume = vol;
      currentAudio.current = audio;

      audio.onloadstart = () => {
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        queueItem.status = 'completed';
        setQueue([...queue]);
        URL.revokeObjectURL(audioUrl);
        onComplete?.();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        queueItem.status = 'error';
        setQueue([...queue]);
        URL.revokeObjectURL(audioUrl);
        onError?.('Audio playback failed');
      };

      await audio.play();
      
    } catch (error) {
      setIsPlaying(false);
      queueItem.status = 'error';
      setQueue([...queue]);
      onError?.((error as any)?.message || 'Playback failed');
    }
  }, [queue, stop]);

  // Play all lines sequentially
  const playSequential = useCallback(async (
    startIndex: number = 0, 
    options: EnhancedTTSOptions = {}
  ) => {
    const { onProgress } = options;
    
    for (let i = startIndex; i < queue.length; i++) {
      if (!isPlaying) break; // Stop if user paused
      
      await new Promise<void>((resolve) => {
        playLine(i, {
          ...options,
          onComplete: () => {
            onProgress?.((i + 1) / queue.length * 100);
            resolve();
          },
          onError: () => {
            resolve(); // Continue to next line even on error
          }
        });
      });
    }
  }, [queue, isPlaying, playLine]);

  // Get TTS status summary
  const getStatusSummary = useCallback(() => {
    const total = queue.length;
    const ready = queue.filter(q => q.status === 'ready').length;
    const generating = queue.filter(q => q.status === 'generating').length;
    const errors = queue.filter(q => q.status === 'error').length;
    
    return { total, ready, generating, errors };
  }, [queue]);

  return {
    // Audio playback
    playLine,
    playSequential,
    stop,
    
    // Pre-generation
    preGenerateAudio,
    
    // State
    isPlaying,
    isLoading,
    currentLineIndex,
    volume,
    setVolume,
    
    // Queue management
    queue,
    getStatusSummary,
    
    // Health check
    ttsHealth,
    checkTTSHealth,
    
    // Cache management
    clearCache: () => audioCache.current.clear(),
    getCacheSize: () => audioCache.current.size
  };
};