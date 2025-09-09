import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, voice, speed, useGoogle, health } = await req.json()

    // Health check endpoint
    if (health) {
      const googleApiKey = Deno.env.get('GOOGLE_TTS_API_KEY')
      return new Response(
        JSON.stringify({
          status: 'healthy',
          providers: {
            google: !!googleApiKey
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Google TTS implementation
    if (useGoogle) {
      const googleApiKey = Deno.env.get('GOOGLE_TTS_API_KEY')

      if (!googleApiKey) {
        console.error('GOOGLE_TTS_API_KEY is not set')
        return new Response(
          JSON.stringify({ error: 'Google TTS API key not configured', provider: 'google' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Default voice mapping for Google TTS (fallback aliases)
      const voiceMap: Record<string, { name: string; languageCode: string }> = {
        'alloy': { name: 'en-US-Standard-B', languageCode: 'en-US' }, // male
        'echo': { name: 'en-US-Standard-C', languageCode: 'en-US' },  // female
        'fable': { name: 'en-US-Standard-D', languageCode: 'en-US' }, // male
        'onyx': { name: 'en-US-Standard-A', languageCode: 'en-US' },  // male
        'nova': { name: 'en-US-Standard-E', languageCode: 'en-US' },  // female
        'shimmer': { name: 'en-US-Standard-F', languageCode: 'en-US' }, // female
        'ember': { name: 'en-US-Standard-G', languageCode: 'en-US' }  // female
      }

      // Accept direct Google voice names like en-US-Standard-C, en-US-Wavenet-A, en-US-Journey-F, en-US-Studio-O, en-US-Neural2-J
      let selectedVoice: { name: string; languageCode: string }
      if (typeof voice === 'string' && /^[a-z]{2}-[A-Z]{2}-/.test(voice)) {
        const parts = (voice as string).split('-')
        const languageCode = parts.slice(0, 2).join('-') // e.g., en-US
        selectedVoice = { name: voice as string, languageCode }
      } else {
        selectedVoice = voiceMap[voice as string] || voiceMap['echo'] // default to female voice
      }

      const speakingRate = speed || 1.0

      console.log(`Using Google TTS voice: ${selectedVoice.name}, rate: ${speakingRate}`)

      try {
        // Call Google Cloud Text-to-Speech API
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: selectedVoice.languageCode,
              name: selectedVoice.name
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: Math.max(0.25, Math.min(4.0, speakingRate))
            }
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Google TTS API error:', errorText)
          return new Response(
            JSON.stringify({
              error: `Google TTS API error: ${response.status}`,
              details: errorText,
              provider: 'google',
            }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const data = await response.json()
        
        if (!data.audioContent) {
          throw new Error('No audio content received from Google TTS')
        }

        return new Response(
          JSON.stringify({
            audioContent: data.audioContent,
            voice: selectedVoice.name,
            provider: 'google',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (err) {
        console.error('Error fetching Google TTS audio:', err)
        const message = err instanceof Error ? err.message : 'Unknown Google TTS error'
        return new Response(
          JSON.stringify({ error: message, provider: 'google' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Fallback to browser TTS format (when neither Google nor ElevenLabs is requested)
    const response = {
      audioContent: text, // Return text for browser's speechSynthesis API
      voice: voice || 'default',
      speed: speed || 1.0,
      provider: 'browser',
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    console.error('Error in text-to-speech function:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unexpected server error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
