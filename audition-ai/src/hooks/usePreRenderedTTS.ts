
import { useCallback, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PreRenderStatus = 'idle' | 'running' | 'completed' | 'cancelled' | 'error';

interface DialogueItem {
  character: string;
  text: string;
}

interface StartOptions {
  dialogues: DialogueItem[];
  actorCharacter: string | 'none';
  voiceId: string;
  speed?: number;
  characterVoiceMap?: Record<string, string>;
  scriptId?: string; // Add scriptId for caching
}

// Utility: convert base64 string to Blob URL
function base64ToAudioUrl(base64: string, mime: string = 'audio/mpeg') {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

export function usePreRenderedTTS() {
  const [status, setStatus] = useState<PreRenderStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [failures, setFailures] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [audioMap, setAudioMap] = useState<Record<number, string>>({});
  const [cacheStats, setCacheStats] = useState<{ fromCache: number; generated: number }>({ fromCache: 0, generated: 0 });
  const runningRef = useRef(false);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const urlsRef = useRef<string[]>([]); // for cleanup

  const cleanupUrls = useCallback(() => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
  }, []);

  const reset = useCallback(() => {
    runningRef.current = false;
    abortRef.current.aborted = false;
    cleanupUrls();
    setAudioMap({});
    setProgress(0);
    setTotal(0);
    setFailures(0);
    setLastError(null);
    setCacheStats({ fromCache: 0, generated: 0 });
    setStatus('idle');
  }, [cleanupUrls]);

  const cancel = useCallback(() => {
    abortRef.current.aborted = true;
    runningRef.current = false;
    setStatus('cancelled');
  }, []);

  const isRunning = useMemo(() => status === 'running', [status]);

  const start = useCallback(async ({ dialogues, actorCharacter, voiceId, speed = 1.0, characterVoiceMap, scriptId }: StartOptions) => {
    if (runningRef.current) return;
    reset();

    // Determine which indices to pre-render (AI lines: not actor)
    const indices = dialogues
      .map((d, i) => ({ i, d }))
      .filter(({ d }) => actorCharacter === 'none' || d.character !== actorCharacter)
      .map(({ i }) => i);

    setTotal(indices.length);
    setStatus('running');
    runningRef.current = true;

    const concurrency = 2;
    let inFlight = 0;
    let cursor = 0;
    let cacheHits = 0;
    let newGenerated = 0;

    const next = async () => {
      if (abortRef.current.aborted) return;
      if (cursor >= indices.length) return;
      const idx = indices[cursor++];
      inFlight++;
      try {
        // Simple retry with backoff on rate limits
        let attempts = 0;
        let completed = false;
        while (attempts < 2 && !completed) {
          attempts++;
          try {
            // Use character-specific voice if available, otherwise use default voiceId
            const characterName = dialogues[idx].character;
            const useVoice = characterVoiceMap?.[characterName] || voiceId;
            
            // Use TTS cache if scriptId is available, otherwise fallback to direct TTS
            const endpoint = scriptId ? 'tts-cache' : 'text-to-speech';
            const requestBody = scriptId ? {
              scriptId,
              dialogueIndex: idx,
              character: characterName,
              text: dialogues[idx].text,
              voiceId: useVoice,
              speed,
            } : {
              text: dialogues[idx].text,
              voice: useVoice,
              speed,
              useGoogle: true,
            };

            const { data, error } = await supabase.functions.invoke(endpoint, {
              body: requestBody,
            });

            if (error) {
              const status = (error as any)?.status;
              const message = (error as any)?.message || `${endpoint} function error`;
              throw Object.assign(new Error(message), { status });
            }
            if (!data || !data.audioContent) {
              throw new Error(data?.error || 'No audio returned');
            }
            if (data.provider === 'browser') {
              throw new Error(data?.error || 'Google TTS unavailable');
            }

            // Track cache statistics
            if (data.fromCache) {
              cacheHits++;
            } else {
              newGenerated++;
            }

            const url = base64ToAudioUrl(data.audioContent);
            urlsRef.current.push(url);
            setAudioMap((prev) => ({ ...prev, [idx]: url }));
            setCacheStats({ fromCache: cacheHits, generated: newGenerated });
            completed = true;
          } catch (err: any) {
            if (err?.status === 429 && attempts < 2 && !abortRef.current.aborted) {
              await new Promise((r) => setTimeout(r, 800));
              continue;
            }
            throw err;
          }
        }
      } catch (err: any) {
        setFailures((f) => f + 1);
        const msg = err?.message || 'Unknown error';
        setLastError(msg);
      } finally {
        setProgress((p) => p + 1);
        inFlight--;
        if (cursor < indices.length && !abortRef.current.aborted) {
          void next();
        }
      }
    };

    // Kick off workers
    const starters = Math.min(concurrency, indices.length);
    const workers: Promise<void>[] = [];
    for (let i = 0; i < starters; i++) workers.push(next());

    await Promise.all(workers);

    runningRef.current = false;
    if (abortRef.current.aborted) return;
    setStatus('completed');
  }, [reset]);

  return {
    // state
    status,
    progress,
    total,
    failures,
    lastError,
    audioMap,
    cacheStats,
    isRunning,
    // actions
    startPreRender: start,
    cancelPreRender: cancel,
    reset,
  };
}
