
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, analysis, chatHistory } = await req.json();
    
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API key not configured');
    }

    // Extract script content from analysis data
    const scriptContent = analysis.analysis_data?.script_content || analysis.emotional_beats?.script_content || '';
    const scriptTitle = analysis.analysis_data?.script_title || 'the script';

    // Build comprehensive conversation context with full script
    const systemPrompt = `You are an expert acting coach with deep knowledge of all acting methods and techniques. You are helping an actor prepare for their role.

FULL SCRIPT CONTENT:
${scriptContent}

SCRIPT ANALYSIS CONTEXT:
- Script Title: ${scriptTitle}
- Character: ${analysis.selected_character}
- Acting Method: ${analysis.acting_method}
- Character Objectives: ${analysis.objectives?.join(', ') || 'Not specified'}
- Character Obstacles: ${analysis.obstacles?.join(', ') || 'Not specified'}  
- Character Tactics: ${analysis.tactics?.join(', ') || 'Not specified'}
- Analysis Notes: ${analysis.analysis_data?.style_notes || 'General analysis'}

COACHING APPROACH:
- You have read the ENTIRE script above and can reference specific lines, scenes, and moments
- Be supportive, encouraging, and SPECIFIC in your guidance using actual script content
- Reference specific dialogue, character interactions, and plot points from the script
- Ask probing questions about specific scenes and moments in the script
- Provide practical exercises based on actual script content
- Help with specific line delivery by quoting the actual lines from the script
- Draw connections between different scenes and character development
- Use ${analysis.acting_method} method when appropriate
- Keep responses focused and practical (2-3 paragraphs max)
- Always reference specific script content when giving advice

CONVERSATION HISTORY:
${chatHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

Current question from actor: ${message}

Respond as their acting coach with specific references to the script content, helping them work through this challenge using actual lines and scenes from their script.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const coachResponse = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({
      message: coachResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in coaching-chat:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate coaching response'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
