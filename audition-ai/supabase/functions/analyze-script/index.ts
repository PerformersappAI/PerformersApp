
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
    console.log('=== ANALYZE-SCRIPT FUNCTION START v2 ===');
    
    // Check API key first
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    console.log('API key check v2:', {
      hasApiKey: !!GOOGLE_AI_API_KEY,
      keyLength: GOOGLE_AI_API_KEY?.length || 0,
      keyPrefix: GOOGLE_AI_API_KEY?.substring(0, 20) + '...' || 'none',
      keyType: typeof GOOGLE_AI_API_KEY
    });
    
    if (!GOOGLE_AI_API_KEY) {
      console.error('Google AI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Google AI API key not configured',
        debug: 'GOOGLE_AI_API_KEY environment variable is missing'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', { hasTest: !!requestBody.test });
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle API test request
    if (requestBody.test === true) {
      console.log('Testing API connectivity...');
      
      const testPayload = {
        contents: [
          {
            parts: [
              {
                text: "Hello, respond with 'API is working'"
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        }
      };

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
      
      console.log('Making test request to Gemini API...');
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      console.log('Test API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Test API error:', errorText);
        return new Response(JSON.stringify({ 
          error: 'API test failed',
          status: response.status,
          details: errorText
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      console.log('Test API success:', data);

      return new Response(JSON.stringify({ 
        success: true,
        message: 'API is working correctly',
        response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle regular script analysis
    const { scriptContent, selectedCharacter, actingMethod, scriptTitle } = requestBody;
    
    console.log('Request data:', {
      hasScriptContent: !!scriptContent,
      scriptContentLength: scriptContent?.length,
      selectedCharacter,
      actingMethod,
      scriptTitle
    });

    // Validate input for regular analysis
    if (!scriptContent) {
      console.error('No script content provided');
      return new Response(JSON.stringify({ error: 'Script content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!selectedCharacter) {
      console.error('No character selected');
      return new Response(JSON.stringify({ error: 'Character selection is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Building prompt for script analysis...');
    const prompt = `You are an expert acting coach with deep knowledge of all acting methods and techniques. Analyze this script thoroughly for an actor preparing to perform.

SCRIPT TITLE: ${scriptTitle || 'Untitled Script'}

FULL SCRIPT CONTENT:
${scriptContent}

ACTOR'S FOCUS:
- Character: ${selectedCharacter}
- Acting Method: ${actingMethod}

Please provide a comprehensive analysis including:

1. CHARACTER ANALYSIS for ${selectedCharacter}:
   - Character arc and development throughout the script
   - Core personality traits and background
   - Relationships with other characters (reference specific scenes and interactions)
   - Key motivations and desires based on their dialogue and actions

2. EMOTIONAL JOURNEY for ${selectedCharacter}:
   - Track the emotional beats and changes throughout the script
   - Identify key emotional turning points and their triggers
   - Note where ${selectedCharacter} experiences the highest and lowest emotional states
   - Map how emotions shift from scene to scene

3. ACTING OBJECTIVES for ${selectedCharacter}:
   - Primary objective (what ${selectedCharacter} wants most throughout the script)
   - Scene-specific objectives (what they want in each major scene)
   - Tactics they use to achieve their objectives

4. OBSTACLES for ${selectedCharacter}:
   - Internal obstacles (fears, flaws, conflicting desires)
   - External obstacles (other characters, circumstances, environment)
   - How these obstacles create conflict and drive the story forward

5. TACTICS for ${selectedCharacter}:
   - Specific behavioral tactics they use to overcome obstacles
   - How their tactics change based on what's working or not working
   - Subtext beneath their words and actions

6. ${actingMethod} METHOD APPLICATION:
   - Specific ${actingMethod} techniques that would be most effective for this role
   - How to apply ${actingMethod} principles to ${selectedCharacter}'s journey
   - Practical exercises and approaches using the ${actingMethod} method

7. SCENE WORK RECOMMENDATIONS:
   - Most challenging scenes for ${selectedCharacter} and why
   - Key preparation needed for emotional scenes
   - Important relationships to develop with scene partners
   - Physical and vocal considerations for the character

8. AUDITION STRATEGY:
   - Best scenes to showcase ${selectedCharacter}'s range
   - Key moments that demonstrate the character's essence
   - How to make strong, specific choices that serve the story

Format your response with clear sections marked exactly as:
CHARACTER ANALYSIS
EMOTIONAL JOURNEY  
ACTING OBJECTIVES
OBSTACLES
TACTICS
${actingMethod.toUpperCase()} METHOD APPLICATION
SCENE WORK RECOMMENDATIONS
AUDITION STRATEGY

Provide practical, actionable advice that references specific content from the script. Be detailed while keeping the language conversational and encouraging. Quote specific lines when relevant to illustrate points.`;

    console.log('Prompt built, calling Gemini API...');

    const requestPayload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    console.log('Making request to Gemini API...');
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      let userFriendlyMessage = 'Failed to analyze script';
      
      if (response.status === 429) {
        userFriendlyMessage = 'API quota exceeded. Please upgrade your Google AI API plan or try again later.';
      } else if (response.status === 503) {
        userFriendlyMessage = 'Google AI service is temporarily overloaded. Please try again in a few moments.';
      } else if (response.status === 400) {
        userFriendlyMessage = 'Invalid request format. Please check your script content and try again.';
      } else if (response.status === 403) {
        userFriendlyMessage = 'API access denied. Please check your Google AI API key configuration.';
      } else if (response.status >= 500) {
        userFriendlyMessage = 'Google AI service error. Please try again later.';
      }
      
      return new Response(JSON.stringify({ 
        error: userFriendlyMessage,
        status: response.status,
        technical_details: errorText
      }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Gemini API response received, processing...');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini API response structure:', data);
      return new Response(JSON.stringify({ 
        error: 'Invalid response from Gemini API' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Analysis text length:', analysisText?.length);

    // Parse the analysis into structured data
    const analysisData = {
      character_analysis: extractSection(analysisText, 'CHARACTER ANALYSIS'),
      emotional_journey: extractSection(analysisText, 'EMOTIONAL JOURNEY'),
      method_application: extractSection(analysisText, `${actingMethod.toUpperCase()} METHOD APPLICATION`),
      scene_work: extractSection(analysisText, 'SCENE WORK RECOMMENDATIONS'),
      audition_strategy: extractSection(analysisText, 'AUDITION STRATEGY'),
      full_analysis: analysisText
    };

    const objectives = extractListItems(analysisText, 'ACTING OBJECTIVES');
    const obstacles = extractListItems(analysisText, 'OBSTACLES');
    const tactics = extractListItems(analysisText, 'TACTICS');

    console.log('Analysis completed successfully, sending response');

    return new Response(JSON.stringify({
      analysis_data: analysisData,
      objectives,
      obstacles,
      tactics,
      full_analysis: analysisText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== FATAL ERROR in analyze-script ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}[\\s\\S]*?(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
  const match = text.match(regex);
  return match ? match[0].replace(sectionName, '').trim() : '';
}

function extractListItems(text: string, sectionName: string): string[] {
  const section = extractSection(text, sectionName);
  const lines = section.split('\n');
  const items: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./))) {
      items.push(trimmed.replace(/^[-•]\s*|\d+\.\s*/, '').trim());
    }
  }
  
  return items.length > 0 ? items : [section.trim()];
}
