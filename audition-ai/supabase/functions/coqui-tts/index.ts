import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice, language, serverUrl } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    if (!serverUrl) {
      throw new Error('Coqui TTS server URL is required')
    }

    // Call Coqui TTS server
    const response = await fetch(`${serverUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        speaker_wav: voice || null,
        language: language || 'en',
        split_sentences: true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Coqui TTS API error:', errorText)
      throw new Error(`Coqui TTS API error: ${response.status}`)
    }

    // Convert audio to base64
    const arrayBuffer = await response.arrayBuffer()
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    )

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        voice: voice || 'default',
        language: language || 'en',
        provider: 'coqui'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in coqui-tts function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})