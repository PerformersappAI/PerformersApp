
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
    const { scriptId } = await req.json()

    if (!scriptId) {
      return new Response(
        JSON.stringify({ error: 'scriptId is required' }),
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

    // Initialize Supabase client with service role key
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

    console.log(`Purging TTS cache for user ${user.id}, script ${scriptId}`)

    // Get all cache items for this script
    const { data: cacheItems, error: fetchError } = await supabase
      .from('tts_cache_items')
      .select('storage_path')
      .eq('user_id', user.id)
      .eq('script_id', scriptId)

    if (fetchError) {
      console.error('Error fetching cache items:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch cache items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let deletedFiles = 0
    let failedFiles = 0

    // Delete storage files
    if (cacheItems && cacheItems.length > 0) {
      for (const item of cacheItems) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('tts-audio')
            .remove([item.storage_path])

          if (deleteError) {
            console.error(`Failed to delete ${item.storage_path}:`, deleteError)
            failedFiles++
          } else {
            deletedFiles++
          }
        } catch (err) {
          console.error(`Error deleting ${item.storage_path}:`, err)
          failedFiles++
        }
      }
    }

    // Delete cache index entries
    const { error: indexDeleteError } = await supabase
      .from('tts_cache_items')
      .delete()
      .eq('user_id', user.id)
      .eq('script_id', scriptId)

    if (indexDeleteError) {
      console.error('Error deleting cache index entries:', indexDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete cache index entries' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Cache purge complete: ${deletedFiles} files deleted, ${failedFiles} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        deletedFiles,
        failedFiles,
        message: `Purged ${deletedFiles} cached audio files for script`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in purge-tts-cache function:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unexpected server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
