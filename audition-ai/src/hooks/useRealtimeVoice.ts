import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecorder, AudioQueue, encodeAudioForAPI } from '@/utils/RealtimeAudio';

interface RealtimeVoiceOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onTranscript?: (text: string) => void;
  volume?: number;
  microphoneDeviceId?: string;
  microphoneSensitivity?: number;
}

export const useRealtimeVoice = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const pendingCallbackRef = useRef<RealtimeVoiceOptions>({});
  const volumeRef = useRef<number>(0.8);
  const currentTranscriptRef = useRef<string>('');

  const initializeAudio = useCallback(async (microphoneDeviceId?: string) => {
    try {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      
      // Set up audio volume if needed
      if (volumeRef.current !== 0.8) {
        audioQueueRef.current.setVolume(volumeRef.current);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }, []);

  const connect = useCallback(async () => {
    if (isConnected || wsRef.current) return;

    try {
      setIsLoading(true);
      
      // Initialize audio first
      const audioInitialized = await initializeAudio();
      if (!audioInitialized) {
        throw new Error('Failed to initialize audio');
      }

      // Connect to our Supabase Edge Function
      const wsUrl = `wss://cqlczzkyktktaajbfmli.functions.supabase.co/realtime-voice-partner`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to realtime voice');
        setIsConnected(true);
        setIsLoading(false);
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received event:', data.type);

        if (data.type === 'response.audio.delta') {
          // Convert base64 to Uint8Array and add to audio queue
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await audioQueueRef.current?.addToQueue(bytes);
          
          if (!isPlaying) {
            setIsPlaying(true);
            pendingCallbackRef.current.onStart?.();
          }
        } else if (data.type === 'response.audio_transcript.delta') {
          // Handle transcript deltas (AI speaking transcript)
          if (data.delta) {
            currentTranscriptRef.current += data.delta;
            pendingCallbackRef.current.onTranscript?.(currentTranscriptRef.current);
          }
        } else if (data.type === 'conversation.item.input_audio_transcription.completed') {
          // Handle user speech transcript
          if (data.transcript) {
            console.log('User transcript:', data.transcript);
            pendingCallbackRef.current.onTranscript?.(data.transcript);
          }
        } else if (data.type === 'input_audio_buffer.speech_started') {
          console.log('User started speaking');
          setIsListening(true);
        } else if (data.type === 'input_audio_buffer.speech_stopped') {
          console.log('User stopped speaking');
          setIsListening(false);
        } else if (data.type === 'response.audio.done') {
          console.log('Audio response completed');
          setIsPlaying(false);
          currentTranscriptRef.current = ''; // Clear transcript for next response
          pendingCallbackRef.current.onComplete?.();
          pendingCallbackRef.current = {};
        } else if (data.type === 'error') {
          console.error('Realtime error:', data.error);
          pendingCallbackRef.current.onError?.(data.error);
          pendingCallbackRef.current = {};
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsLoading(false);
        pendingCallbackRef.current.onError?.('Connection failed');
        pendingCallbackRef.current = {};
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setIsPlaying(false);
        setIsLoading(false);
      };

    } catch (error) {
      setIsLoading(false);
      console.error('Failed to connect:', error);
      throw error;
    }
  }, [isConnected, initializeAudio]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    recorderRef.current?.stop();
    recorderRef.current = null;
    audioQueueRef.current?.clear();
    audioContextRef.current?.close();
    audioContextRef.current = null;
    audioQueueRef.current = null;
    
    setIsConnected(false);
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string, options: RealtimeVoiceOptions = {}) => {
    if (!isConnected || !wsRef.current) {
      options.onError?.('Not connected to realtime voice');
      return;
    }

    try {
      setIsLoading(true);
      pendingCallbackRef.current = options;
      
      // Apply volume setting
      if (options.volume !== undefined) {
        volumeRef.current = options.volume;
        audioQueueRef.current?.setVolume(options.volume);
      }

      // Send text as a conversation item
      const conversationItem = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Please deliver this line as my scene partner: "${text}"`
            }
          ]
        }
      };

      wsRef.current.send(JSON.stringify(conversationItem));
      
      // Request response
      wsRef.current.send(JSON.stringify({
        type: 'response.create'
      }));

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      options.onError?.(errorMessage);
      console.error('Realtime speech error:', errorMessage);
    }
  }, [isConnected]);

  const startListening = useCallback(async (options: RealtimeVoiceOptions = {}) => {
    if (!isConnected || !wsRef.current) {
      options.onError?.('Not connected to realtime voice');
      return;
    }

    try {
      pendingCallbackRef.current = options;
      
      // Initialize recorder with specific microphone if provided
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(options.microphoneDeviceId && options.microphoneDeviceId !== 'default' 
            ? { deviceId: { exact: options.microphoneDeviceId } }
            : {})
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Apply microphone sensitivity by adjusting audio levels
          const sensitivityFactor = (options.microphoneSensitivity || 75) / 100;
          const adjustedAudio = new Float32Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            adjustedAudio[i] = audioData[i] * sensitivityFactor;
          }
          
          const encodedAudio = encodeAudioForAPI(adjustedAudio);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      // Use custom stream with the recorder
      await recorderRef.current.start(stream);
      
      setIsListening(true);
      console.log('Started listening with microphone:', options.microphoneDeviceId || 'default');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      options.onError?.(errorMessage);
      console.error('Failed to start listening:', errorMessage);
    }
  }, [isConnected]);

  const stopListening = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    setIsListening(false);
    console.log('Stopped listening');
  }, []);

  const stop = useCallback(() => {
    audioQueueRef.current?.clear();
    setIsPlaying(false);
    pendingCallbackRef.current.onComplete?.();
    pendingCallbackRef.current = {};
  }, []);

  // Auto-connect on first use
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    speak,
    stop,
    connect,
    disconnect,
    startListening,
    stopListening,
    isConnected,
    isPlaying,
    isLoading,
    isListening
  };
};