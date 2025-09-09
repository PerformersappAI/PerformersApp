import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface CoquiTTSOptions {
  voice?: string
  language?: string
  serverUrl?: string
  onStart?: () => void
  onComplete?: () => void
  onError?: (error: string) => void
}

export const useCoquiTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  const speak = async (text: string, options: CoquiTTSOptions = {}) => {
    try {
      setIsLoading(true)
      options.onStart?.()

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }

      const { data, error } = await supabase.functions.invoke('coqui-tts', {
        body: {
          text,
          voice: options.voice,
          language: options.language || 'en',
          serverUrl: options.serverUrl || localStorage.getItem('coqui-server-url')
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.audioContent) {
        throw new Error('No audio content received')
      }

      // Convert base64 to audio blob
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/wav' }
      )

      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      setCurrentAudio(audio)
      setIsPlaying(true)

      audio.onended = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
        URL.revokeObjectURL(audioUrl)
        options.onComplete?.()
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setCurrentAudio(null)
        URL.revokeObjectURL(audioUrl)
        options.onError?.('Audio playback failed')
      }

      await audio.play()
    } catch (error) {
      console.error('Coqui TTS error:', error)
      setIsPlaying(false)
      setCurrentAudio(null)
      options.onError?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const stop = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setIsPlaying(false)
      setCurrentAudio(null)
    }
  }

  return {
    speak,
    stop,
    isPlaying,
    isLoading
  }
}