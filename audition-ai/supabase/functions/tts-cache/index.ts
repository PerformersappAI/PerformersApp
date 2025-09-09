
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { scriptId, dialogueIndex, character, text, voiceId, speed = 1.0 } = await req.json()

    if (!scriptId || dialogueIndex === undefined || !character || !text || !voiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user ID from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role key for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user identity with provided JWT
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { data: { user }, error: userError } = await userSupabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create content hash for cache key
    const contentText = `${text}:${voiceId}:${speed}`
    const encoder = new TextEncoder()
    const data = encoder.encode(contentText)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    console.log(`TTS Cache lookup for user ${user.id}, script ${scriptId}, dialogue ${dialogueIndex}`)

    // Check for existing cache entry
    const { data: cacheItem, error: cacheError } = await supabase
      .from('tts_cache_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('script_id', scriptId)
      .eq('dialogue_index', dialogueIndex)
      .eq('voice_id', voiceId)
      .eq('speed', speed)
      .eq('hash', hash)
      .maybeSingle()

    if (cacheError) {
      console.error('Cache lookup error:', cacheError)
    }

    // If cache hit, return cached audio
    if (cacheItem) {
      console.log(`Cache HIT for dialogue ${dialogueIndex}`)
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('tts-audio')
          .download(cacheItem.storage_path)

        if (downloadError) {
          console.error('Download error:', downloadError)
          // Cache entry exists but file missing - clean up and regenerate
          await supabase
            .from('tts_cache_items')
            .delete()
            .eq('id', cacheItem.id)
        } else {
          // Convert file to base64
          const arrayBuffer = await fileData.arrayBuffer()
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
          
          return new Response(
            JSON.stringify({
              audioContent: base64Audio,
              voice: voiceId,
              provider: cacheItem.provider,
              fromCache: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } catch (err) {
        console.error('Cache retrieval error:', err)
        // Continue to regeneration
      }
    }

    console.log(`Cache MISS for dialogue ${dialogueIndex} - generating new audio`)

    // Cache miss - generate new TTS
    const ttsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/text-to-speech`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: voiceId,
        speed,
        useGoogle: true,
      }),
    })

    const ttsData = await ttsResponse.json()

    if (!ttsResponse.ok || !ttsData.audioContent) {
      return new Response(
        JSON.stringify({ error: ttsData.error || 'TTS generation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store audio file in storage
    const fileName = `${user.id}/${scriptId}/${dialogueIndex}_${hash.slice(0, 8)}.mp3`
    const audioBuffer = Uint8Array.from(atob(ttsData.audioContent), c => c.charCodeAt(0))

    const { error: uploadError } = await supabase.storage
      .from('tts-audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Return the audio even if caching failed
      return new Response(
        JSON.stringify({
          audioContent: ttsData.audioContent,
          voice: voiceId,
          provider: ttsData.provider,
          fromCache: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store cache index entry
    const { error: indexError } = await supabase
      .from('tts_cache_items')
      .insert({
        user_id: user.id,
        script_id: scriptId,
        dialogue_index: dialogueIndex,
        character,
        voice_id: voiceId,
        speed,
        provider: ttsData.provider || 'google',
        hash,
        storage_path: fileName
      })

    if (indexError) {
      console.error('Index creation error:', indexError)
    }

    return new Response(
      JSON.stringify({
        audioContent: ttsData.audioContent,
        voice: voiceId,
        provider: ttsData.provider,
        fromCache: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in tts-cache function:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unexpected server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
