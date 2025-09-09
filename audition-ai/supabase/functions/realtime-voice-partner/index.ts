import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY not found');
    socket.close(1000, 'API key not configured');
    return response;
  }

  let openAISocket: WebSocket | null = null;
  let sessionStarted = false;

  socket.onopen = () => {
    console.log('Client WebSocket connection opened');
    
    // Connect to OpenAI Realtime API
    const openAIUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;
    openAISocket = new WebSocket(openAIUrl, [], {
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    openAISocket.onopen = () => {
      console.log('Connected to OpenAI Realtime API');
    };

    openAISocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('OpenAI message:', data.type);

      // Handle session.created event to configure the session
      if (data.type === 'session.created' && !sessionStarted) {
        sessionStarted = true;
        console.log('Session created, sending configuration...');
        
        const sessionConfig = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: `You are an acting scene partner. Your role is to deliver dialogue lines naturally and conversationally, as if you're performing in a scene with another actor. 

Key instructions:
- When given script lines, deliver them with appropriate emotion and timing
- Speak naturally as if you're having a real conversation
- Don't add commentary or explanations unless asked
- Match the tone and energy of the scene
- Pause naturally between lines to allow for actor responses
- Be supportive and encouraging as a scene partner would be

You will receive script content and should deliver the assigned character lines with natural acting performance.`,
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800
            },
            temperature: 0.8,
            max_response_output_tokens: "inf"
          }
        };
        
        openAISocket?.send(JSON.stringify(sessionConfig));
      }

      // Forward all messages to client
      socket.send(event.data);
    };

    openAISocket.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'OpenAI connection failed'
      }));
    };

    openAISocket.onclose = () => {
      console.log('OpenAI WebSocket closed');
      socket.close();
    };
  };

  socket.onmessage = (event) => {
    // Forward client messages to OpenAI
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      console.log('Forwarding client message to OpenAI');
      openAISocket.send(event.data);
    }
  };

  socket.onclose = () => {
    console.log('Client WebSocket closed');
    openAISocket?.close();
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
    openAISocket?.close();
  };

  return response;
});