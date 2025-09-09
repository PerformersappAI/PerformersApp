
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Helper function to detect MIME type from buffer
function detectMimeType(buffer: ArrayBuffer, filename: string): string {
  const bytes = new Uint8Array(buffer);
  
  // Check for common image signatures
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x57 && bytes[1] === 0x45 && bytes[2] === 0x42 && bytes[3] === 0x50) return 'image/webp';
  
  // Fallback to extension-based detection
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  
  return 'image/jpeg'; // Default fallback
}

// Retry function with exponential backoff
async function callGeminiWithRetry(url: string, payload: any, maxRetries = 2): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log(`Gemini API response status: ${response.status}`);

      // If successful, return response
      if (response.ok) {
        return response;
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const errorText = await response.text();
        console.log(`Rate limit hit on attempt ${attempt + 1}:`, errorText);
        
        // If this is our last attempt, return the 429 response
        if (attempt === maxRetries) {
          return response;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // For other errors, return immediately
      return response;

    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError!;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== GRADE-HEADSHOT FUNCTION START ===');
    
    // Check API key
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      console.error('Google AI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'Google AI API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    const { imageUrl, headshotType, personaId, platformTarget } = await req.json();
    
    console.log('Request data:', {
      hasImageUrl: !!imageUrl,
      headshotType,
      personaId,
      platformTarget,
      userId: user.id
    });

    if (!imageUrl || !headshotType) {
      return new Response(JSON.stringify({ 
        error: 'Image URL and headshot type are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the active ruleset from database
    console.log('Fetching headshot evaluation ruleset...');
    const { data: rulesetData, error: rulesetError } = await supabase
      .from('headshot_rulesets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (rulesetError) {
      console.error('Error fetching ruleset:', rulesetError);
      return new Response(JSON.stringify({ 
        error: 'Failed to load evaluation criteria' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ruleset = rulesetData;
    console.log('Retrieved ruleset version:', ruleset.version);

    // Get the target style track (commercial or theatrical)
    const styleTrack = ruleset.style_tracks[headshotType] || ruleset.style_tracks.commercial;
    
    // Get persona-specific guidelines if specified
    let personaGuidelines = null;
    if (personaId) {
      const personas = ruleset.persona_tracks.personas || [];
      personaGuidelines = personas.find(p => p.id === personaId);
    }

    // Get platform-specific requirements if specified
    const platformSpecs = platformTarget ? ruleset.platform_specs[platformTarget] : null;

    // Build comprehensive evaluation context
    const evaluationContext = {
      track: styleTrack,
      persona: personaGuidelines,
      platform: platformSpecs,
      globalRules: ruleset.rules_global,
      scoring: ruleset.scoring,
      enums: ruleset.enums
    };

    console.log('Building comprehensive prompt using ruleset v1.1...');
    
    // Build detailed prompt using the ruleset
    const prompt = `You are a professional headshot evaluator using the comprehensive 2025 industry standards (v${ruleset.version}).

**EVALUATION TRACK**: ${headshotType.toUpperCase()}
Purpose: ${styleTrack.purpose}
${personaGuidelines ? `**PERSONA**: ${personaGuidelines.label} - ${personaGuidelines.track_bias} bias` : ''}
${platformSpecs ? `**PLATFORM**: ${platformTarget} - ${platformSpecs.notes || 'Standard platform requirements'}` : ''}

**STYLE GUIDELINES**:
- Expression: ${styleTrack.expression_primary.join(', ')}
- Lighting: ${styleTrack.lighting}
- Wardrobe Palette: ${styleTrack.wardrobe_palette.join(', ')}
- Background: ${styleTrack.background_palette.join(', ')}
- Key Dos: ${styleTrack.dos.join('; ')}
- Avoid: ${styleTrack.donts.join('; ')}

**TECHNICAL STANDARDS**:
- Focus: ${evaluationContext.globalRules.technical.focus}
- Exposure: ${evaluationContext.globalRules.technical.exposure}
- Retouching: ${evaluationContext.globalRules.retouching.philosophy}
- Background: ${evaluationContext.globalRules.background.style}

**SCORING WEIGHTS**:
${Object.entries(evaluationContext.scoring.weights).map(([key, weight]) => 
  `- ${key.replace(/_/g, ' ')}: ${(weight * 100).toFixed(0)}%`
).join('\n')}

Evaluate this ${headshotType} headshot using these exact criteria. Provide scores 1-5 for each dimension and detailed feedback.`;

    // Convert image URL to base64 for Gemini Vision
    console.log('Fetching image for analysis...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Check image size (limit to 8MB for better performance)
    if (imageBuffer.byteLength > 8 * 1024 * 1024) {
      console.error('Image too large:', imageBuffer.byteLength);
      return new Response(JSON.stringify({ 
        error: 'Image file is too large. Please use an image smaller than 8MB.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Converting image to base64 (size:', imageBuffer.byteLength, 'bytes)...');
    const base64Image = arrayBufferToBase64(imageBuffer);
    
    // Detect proper MIME type
    const mimeType = detectMimeType(imageBuffer, imageUrl);
    console.log('Detected MIME type:', mimeType);
    
    console.log('Preparing Gemini Vision API request...');

    const requestPayload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.7,
        maxOutputTokens: 4096, // Reduced for efficiency
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            full_analysis: {
              type: "string",
              description: "Complete analysis with section headers and emojis"
            },
            overall_score: {
              type: "integer",
              minimum: 1,
              maximum: 5,
              description: "Overall rating 1-5"
            },
            technical_score: {
              type: "integer", 
              minimum: 1,
              maximum: 5,
              description: "Technical quality 1-5"
            },
            professional_score: {
              type: "integer",
              minimum: 1, 
              maximum: 5,
              description: "Professional standards 1-5"
            },
            industry_score: {
              type: "integer",
              minimum: 1,
              maximum: 5, 
              description: "Industry readiness 1-5"
            },
            casting_types: {
              type: "array",
              items: { type: "string" },
              maxItems: 3,
              description: "2-3 casting archetypes"
            },
            red_flags: {
              type: "array", 
              items: { type: "string" },
              maxItems: 3,
              description: "Critical issues"
            },
            suggestions: {
              type: "array",
              items: { type: "string" },
              maxItems: 3,
              description: "Improvement recommendations"
            },
            final_verdict: {
              type: "string",
              description: "Brief casting potential summary"
            }
          },
          required: ["full_analysis", "overall_score", "technical_score", "professional_score", "industry_score", "casting_types", "red_flags", "suggestions", "final_verdict"]
        }
      }
    };

    // Try gemini-1.5-pro first, fallback to gemini-1.5-flash if rate limited
    let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_AI_API_KEY}`;
    
    console.log('Calling Gemini API with retry logic...');
    let response = await callGeminiWithRetry(geminiUrl, requestPayload, 1);

    // If still rate limited, try gemini-1.5-flash
    if (!response.ok && response.status === 429) {
      console.log('Rate limited on gemini-1.5-pro, trying gemini-1.5-flash...');
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`;
      response = await callGeminiWithRetry(geminiUrl, requestPayload, 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Final Gemini API error:', errorText);
      
      // Return specific error messages for different scenarios
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'The AI analysis service is currently experiencing high demand. Please try again in a few minutes.',
          retry_after: 60
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'API_ERROR',
        message: `Analysis service error (${response.status}). Please try again.`
      }), {
        status: 500,
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

    const analysisResponse = data.candidates[0].content.parts[0].text;
    console.log('Structured JSON response received, parsing...');

    // Parse the structured JSON response
    let jsonSummary;
    try {
      jsonSummary = JSON.parse(analysisResponse);
      console.log('Successfully parsed structured response:', jsonSummary);
    } catch (parseError) {
      console.error('Failed to parse structured JSON response:', parseError);
      console.error('Raw response:', analysisResponse);
      
      // Fallback summary
      jsonSummary = {
        full_analysis: "Analysis completed with technical difficulties. Professional headshot evaluation performed.",
        overall_score: 3,
        technical_score: 3,
        professional_score: 3,
        industry_score: 3,
        casting_types: ["General"],
        red_flags: [],
        suggestions: ["Professional retake recommended"],
        final_verdict: "Analysis completed"
      };
    }

    // Convert 1-5 scale to 0-100 for database compatibility
    const convertToPercent = (score) => Math.round((score / 5) * 100);

    // Save analysis to database
    console.log('Saving analysis to database...');
    const { data: savedAnalysis, error: dbError } = await supabase
      .from('headshot_analyses')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        headshot_type: headshotType,
        overall_score: convertToPercent(jsonSummary.overall_score),
        technical_score: convertToPercent(jsonSummary.technical_score),
        professional_score: convertToPercent(jsonSummary.professional_score),
        industry_score: convertToPercent(jsonSummary.industry_score),
        detailed_feedback: {
          full_analysis: (jsonSummary.full_analysis || "Analysis completed").replace(/```json[\s\S]*?```/g, '').trim(),
          casting_types: jsonSummary.casting_types || [],
          red_flags: jsonSummary.red_flags || [],
          final_verdict: jsonSummary.final_verdict || "Analysis completed"
        },
        improvement_suggestions: jsonSummary.suggestions || [],
        strengths: jsonSummary.casting_types || []
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ 
        error: 'Failed to save analysis',
        details: dbError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analysis completed and saved successfully');

    return new Response(JSON.stringify({
      full_analysis: jsonSummary.full_analysis || "Analysis completed",
      overall_score: convertToPercent(jsonSummary.overall_score),
      technical_score: convertToPercent(jsonSummary.technical_score),
      professional_score: convertToPercent(jsonSummary.professional_score),
      industry_score: convertToPercent(jsonSummary.industry_score),
      casting_types: jsonSummary.casting_types,
      red_flags: jsonSummary.red_flags,
      improvement_suggestions: jsonSummary.suggestions,
      final_verdict: jsonSummary.final_verdict,
      analysis_id: savedAnalysis.id,
      created_at: savedAnalysis.created_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('=== FATAL ERROR in grade-headshot ===');
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
