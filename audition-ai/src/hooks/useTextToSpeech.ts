
import { useState, useCallback, useEffect } from 'react';

interface TTSOptions {
  voice?: string;
  voiceCategory?: 'adult-male' | 'adult-female' | 'child-male' | 'child-female';
  speed?: number;
  onComplete?: () => void;
  onStart?: () => void;
}

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Wait for voices to load properly
  useEffect(() => {
    const handleVoicesChanged = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
      }
    };

    // Check if voices are already loaded
    if (speechSynthesis.getVoices().length > 0) {
      handleVoicesChanged();
    }

    // Listen for voices to load
    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  // Enhanced voice selection with categories
  const selectVoiceByCategory = useCallback((category?: 'adult-male' | 'adult-female' | 'child-male' | 'child-female', preferredVoiceName?: string) => {
    const voices = speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      console.warn('No voices available');
      return { voice: null, pitch: 1.0 };
    }

    console.log('Selecting voice for category:', category, 'from', voices.length, 'available voices');

    // Get English voices
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en-') || voice.lang === 'en'
    );

    if (englishVoices.length === 0) {
      console.warn('No English voices found, using first available voice');
      return { voice: voices[0], pitch: 1.0 };
    }

    // If no category specified, use default selection
    if (!category) {
      const usEnglish = englishVoices.filter(v => v.lang.startsWith('en-US'));
      const ukEnglish = englishVoices.filter(v => v.lang.startsWith('en-GB'));
      const selectedVoice = usEnglish[0] || ukEnglish[0] || englishVoices[0];
      return { voice: selectedVoice, pitch: 1.0 };
    }

    // Voice selection patterns for different categories
    const voicePatterns = {
      'adult-male': {
        patterns: ['male', 'man', 'daniel', 'alex', 'david', 'mark', 'paul', 'tom'],
        pitch: 0.9,
        fallbackPitch: 0.8
      },
      'adult-female': {
        patterns: ['female', 'woman', 'samantha', 'susan', 'karen', 'moira', 'victoria', 'kate'],
        pitch: 1.1,
        fallbackPitch: 1.2
      },
      'child-male': {
        patterns: ['boy', 'child', 'young'],
        pitch: 1.4,
        fallbackPitch: 1.5
      },
      'child-female': {
        patterns: ['girl', 'child', 'young'],
        pitch: 1.6,
        fallbackPitch: 1.7
      }
    };

    const categoryConfig = voicePatterns[category];

    // 1. Try to find voice by preferred name first
    if (preferredVoiceName) {
      const preferredVoice = englishVoices.find(voice => 
        voice.name.toLowerCase().includes(preferredVoiceName.toLowerCase())
      );
      if (preferredVoice) {
        console.log('Selected preferred voice:', preferredVoice.name);
        return { voice: preferredVoice, pitch: categoryConfig.pitch };
      }
    }

    // 2. Try to find voice by category patterns
    for (const pattern of categoryConfig.patterns) {
      const voice = englishVoices.find(v => v.name.toLowerCase().includes(pattern));
      if (voice) {
        console.log('Selected voice by pattern:', voice.name, 'for category:', category);
        return { voice, pitch: categoryConfig.pitch };
      }
    }

    // 3. Gender-based fallback for adult voices
    if (category.startsWith('adult-')) {
      const genderHints = category.includes('female') 
        ? ['female', 'woman', 'samantha', 'susan', 'victoria']
        : ['male', 'man', 'daniel', 'alex', 'david'];

      for (const hint of genderHints) {
        const voice = englishVoices.find(v => v.name.toLowerCase().includes(hint));
        if (voice) {
          console.log('Selected voice by gender hint:', voice.name);
          return { voice, pitch: categoryConfig.pitch };
        }
      }
    }

    // 4. Default fallback with adjusted pitch
    const fallbackVoice = englishVoices[0];
    console.log('Using fallback voice with adjusted pitch for category:', category);
    return { voice: fallbackVoice, pitch: categoryConfig.fallbackPitch };
  }, []);

  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    try {
      console.log('Starting to speak:', text.substring(0, 50) + '...');

      // Stop any currently playing speech
      if (currentUtterance) {
        speechSynthesis.cancel();
        setCurrentUtterance(null);
      }

      // Use browser's built-in speech synthesis
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Explicitly set language to English
      utterance.lang = 'en-US';
      
      // Select voice by category or name
      const { voice: selectedVoice, pitch } = selectVoiceByCategory(options.voiceCategory, options.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = options.speed || 1.0;
      utterance.pitch = pitch;
      utterance.volume = 1.0;

      setCurrentUtterance(utterance);

      utterance.onstart = () => {
        console.log('Speech started with voice:', utterance.voice?.name, utterance.voice?.lang);
        setIsPlaying(true);
        options.onStart?.();
      };

      utterance.onend = () => {
        console.log('Speech completed - calling onComplete');
        setIsPlaying(false);
        setCurrentUtterance(null);
        // Call onComplete after a small delay to ensure state updates
        setTimeout(() => {
          options.onComplete?.();
        }, 100);
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
        setIsPlaying(false);
        setCurrentUtterance(null);
        // Still call onComplete to prevent getting stuck
        setTimeout(() => {
          options.onComplete?.();
        }, 100);
      };

      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsPlaying(false);
      setCurrentUtterance(null);
      // Call onComplete even on error to prevent getting stuck
      setTimeout(() => {
        options.onComplete?.();
      }, 100);
    }
  }, [currentUtterance, selectVoiceByCategory]);

  const stop = useCallback(() => {
    console.log('Stopping speech synthesis');
    speechSynthesis.cancel();
    setCurrentUtterance(null);
    setIsPlaying(false);
  }, []);

  return {
    speak,
    stop,
    isPlaying,
    voicesLoaded
  };
};
