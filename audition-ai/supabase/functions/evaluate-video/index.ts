
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
    const { videoUrl, analysis, coachingNotes } = await req.json();
    
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API key not configured');
    }

    // Get the actual script content from analysis
    const scriptContent = analysis.analysis_data?.script_content || analysis.emotional_beats?.script_content || 'No script content available';
    
    // Handle the acting method display
    const actingMethodDisplay = analysis.acting_method === 'none' ? 'Natural Analysis (no specific technique)' : analysis.acting_method;
    const actingMethodInstructions = analysis.acting_method === 'none' 
      ? 'natural acting principles and general performance standards'
      : `${analysis.acting_method} technique`;
    
    const prompt = `You are an expert casting director with 20+ years of experience evaluating self-tape auditions for major studios, streaming platforms, and independent productions. You know exactly what separates bookable actors from the rest.

CHARACTER & SCRIPT CONTEXT:
Script Content: "${scriptContent.substring(0, 1000)}..."
Character Being Played: ${analysis.selected_character}
Acting Method Used: ${actingMethodDisplay}
Character Objectives: ${analysis.objectives?.join(', ') || 'Not specified'}
Character Obstacles: ${analysis.obstacles?.join(', ') || 'Not specified'}
Character Tactics: ${analysis.tactics?.join(', ') || 'Not specified'}

COACHING CONTEXT: ${coachingNotes || 'Standard coaching session completed'}

CRITICAL EVALUATION REQUIREMENTS:
1. SCRIPT MATCH VERIFICATION - First determine if the video actually matches the script and character "${analysis.selected_character}". If not, give low scores (20-40) and clearly state the mismatch.
2. If the video is random content unrelated to the script, immediately flag this and give very low scores.
3. Be strict with scoring - only give high scores (80+) for truly excellent performances.

CASTING DIRECTOR EVALUATION FRAMEWORK:

**TECHNICAL QUALITY ASSESSMENT:**
- LIGHTING: Professional even lighting, clear visibility of eyes and face
- AUDIO: Crystal clear dialogue, no background noise or echo
- FRAMING: Proper close-up, centered, eye-level camera
- PRODUCTION VALUE: HD quality, professional background

**PERFORMANCE EVALUATION:**
- SCRIPT ADHERENCE: Does performance match the provided script content?
- CHARACTER ACCURACY: Is this actually portraying "${analysis.selected_character}"?
- ACTING TECHNIQUE: Effective use of ${actingMethodInstructions}
- EMOTIONAL AUTHENTICITY: Genuine, believable performance
- SCENE UNDERSTANDING: Clear grasp of objectives, obstacles, tactics

**SCORING GUIDELINES:**
- 90-100: Exceptional, booking-ready performance
- 80-89: Strong performance with minor adjustments needed
- 70-79: Good foundation, needs significant improvement
- 60-69: Below industry standard, major work required
- 20-59: Poor/mismatched content, does not meet requirements

FORMAT YOUR RESPONSE EXACTLY AS:

**OVERALL SCORE: X/100**
**TECHNICAL SCORE: X/100** 
**PERFORMANCE SCORE: X/100**

**SCRIPT MATCH VERIFICATION:**
[State clearly if video matches script and character, or if there's a mismatch]

**TECHNICAL FEEDBACK:**
• [Specific lighting feedback]
• [Specific audio feedback] 
• [Specific framing feedback]
• [Specific production feedback]

**PERFORMANCE FEEDBACK:**
• [Specific character portrayal feedback]
• [Specific scene work feedback]
• [Specific technique feedback]
• [Specific emotional work feedback]
• [Specific improvement needed]

**KEY INSIGHTS:**
• [Most important strength]
• [Most critical weakness] 
• [Primary focus for improvement]

Be brutally honest and specific. If the video doesn't match the script or character, say so clearly and score accordingly.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2000,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const evaluationText = data.candidates[0].content.parts[0].text;

    console.log('Raw evaluation text:', evaluationText);

    // Parse the evaluation into structured data
    const evaluation = {
      overall_score: extractScore(evaluationText, 'OVERALL SCORE'),
      technical_score: extractScore(evaluationText, 'TECHNICAL SCORE'),
      performance_score: extractScore(evaluationText, 'PERFORMANCE SCORE'),
      notes: evaluationText,
      analysis: {
        overall_performance: getPerformanceLevel(extractScore(evaluationText, 'OVERALL SCORE')),
        technical_feedback: extractBulletPoints(evaluationText, 'TECHNICAL FEEDBACK'),
        performance_feedback: extractBulletPoints(evaluationText, 'PERFORMANCE FEEDBACK'),
        key_insights: extractBulletPoints(evaluationText, 'KEY INSIGHTS'),
        script_match_analysis: extractScriptMatch(evaluationText),
        character_focus: analysis.selected_character,
        acting_method_used: actingMethodDisplay,
        improvement_summary: extractBulletPoints(evaluationText, 'PERFORMANCE FEEDBACK')
      }
    };

    console.log('Parsed evaluation:', evaluation);

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in evaluate-video:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to evaluate video'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractScore(text: string, scoreType: string): number {
  console.log(`Extracting score for: ${scoreType}`);
  
  const patterns = [
    new RegExp(`\\*\\*${scoreType}[:\\s]*([0-9]+)(?:/100)?\\*\\*`, 'i'),
    new RegExp(`${scoreType}[:\\s]*([0-9]+)(?:/100)?`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log(`Found score ${match[1]} for ${scoreType}`);
      return parseInt(match[1]);
    }
  }
  
  console.log(`No score found for ${scoreType}, using default 70`);
  return 70;
}

function getPerformanceLevel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Needs Work';
  return 'Requires Significant Improvement';
}

function extractBulletPoints(text: string, sectionName: string): string[] {
  console.log(`Extracting bullet points for: ${sectionName}`);
  
  const sectionPattern = new RegExp(`\\*\\*${sectionName}[:\\s]*\\*\\*([\\s\\S]*?)(?=\\*\\*[A-Z\\s]+:|$)`, 'i');
  const match = text.match(sectionPattern);
  
  if (!match) {
    console.log(`No section found for ${sectionName}`);
    return [];
  }
  
  const sectionText = match[1];
  const bulletPoints = sectionText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))
    .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(line => line.length > 10)
    .slice(0, 5);
  
  console.log(`Found ${bulletPoints.length} bullet points for ${sectionName}:`, bulletPoints);
  return bulletPoints;
}

function extractScriptMatch(text: string): string {
  const scriptSection = text.match(/\*\*SCRIPT MATCH VERIFICATION[:\s]*\*\*([\s\S]*?)(?=\*\*[A-Z\s]+:|$)/i);
  if (scriptSection) {
    return scriptSection[1].trim();
  }
  
  const mismatchIndicators = ['mismatch', 'does not match', 'doesn\'t match', 'not align', 'incorrect', 'unrelated', 'random'];
  const lowerText = text.toLowerCase();
  
  for (const indicator of mismatchIndicators) {
    if (lowerText.includes(indicator)) {
      const sentences = text.split(/[.!?]+/);
      const matchingSentence = sentences.find(sentence => 
        sentence.toLowerCase().includes(indicator)
      );
      if (matchingSentence) {
        return matchingSentence.trim();
      }
    }
  }
  
  return 'Performance appears to align with the provided script and character';
}
