import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const googleAIApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!googleAIApiKey) {
      console.error('GOOGLE_AI_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { scriptTitle, scriptContent } = await req.json();
    
    if (!scriptContent) {
      return new Response(
        JSON.stringify({ error: 'Script content is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Truncate content if too long (keep under 30k characters for safety)
    const truncatedContent = scriptContent.length > 30000 
      ? scriptContent.substring(0, 30000) + "..." 
      : scriptContent;

    const prompt = `Please provide a brief 2-3 sentence summary of this ${scriptTitle ? `script titled "${scriptTitle}"` : 'script'}. Focus on the main story, characters, and central conflict or situation. Keep it concise and suitable for an actor preparing for analysis.

Script content:
${truncatedContent}`;

    console.log('Calling Google AI API for scene summary...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleAIApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google AI API error:', response.status, errorText);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Google AI API response received');
    
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!summary) {
      throw new Error('No summary generated');
    }

    return new Response(
      JSON.stringify({ summary: summary.trim() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in summarize-scene function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate scene summary' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
