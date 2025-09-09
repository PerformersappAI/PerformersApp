import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getMimeType(fileName: string, provided?: string): string {
  if (provided) return provided;
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in Deno
  return btoa(binary);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("OCR script function called");
    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    console.log("API key present:", !!apiKey);
    
    if (!apiKey) {
      console.error("Missing GOOGLE_AI_API_KEY secret");
      return new Response(
        JSON.stringify({ error: "Missing GOOGLE_AI_API_KEY secret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsing form data...");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    console.log("File received:", !!file, file?.name, file?.size);

    if (!file) {
      console.error("No file in form data");
      return new Response(
        JSON.stringify({ error: "No file uploaded" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileName = file.name || "upload";
    const mimeType = getMimeType(fileName, (file as any).type);
    console.log("File details:", { fileName, mimeType, size: (file as any).size });

    // 10MB guard
    if ((file as any).size && (file as any).size > 10 * 1024 * 1024) {
      console.error("File too large:", (file as any).size);
      return new Response(
        JSON.stringify({ error: "File too large. Max 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Converting file to base64...");
    const arrayBuffer = await file.arrayBuffer();
    const base64 = toBase64(arrayBuffer);
    console.log("Base64 conversion complete, length:", base64.length);

    const instruction = `You are an expert screenplay OCR and formatter. Extract readable raw script text from the provided file (PDF or image). 
- Preserve line breaks.
- Use CHARACTER NAMES in caps at the start of dialogue lines followed by a colon, e.g., JANE:
- Keep parentheticals on their own line in parentheses when present.
- Remove watermarks, page numbers, headers/footers, or any non-dialogue artifacts.
- Do not include commentary, analysis, or extra sections. Only output the script text.`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: instruction },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    } as any;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    console.log("Calling Gemini API...");
    
    // Add retry logic for API overload
    let attempts = 0;
    const maxRetries = 3;
    let resp: Response;
    
    while (attempts < maxRetries) {
      try {
        console.log(`API attempt ${attempts + 1}/${maxRetries}`);
        resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        console.log("API response status:", resp.status);
        if (resp.ok) {
          console.log("API call successful");
          break; // Success, exit retry loop
        }
        
        // Check if it's a 503 (overloaded) error that we should retry
        if (resp.status === 503 && attempts < maxRetries - 1) {
          console.log(`Gemini API overloaded (attempt ${attempts + 1}), retrying in ${(attempts + 1) * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (attempts + 1) * 2000));
          attempts++;
          continue;
        }
        
        // For other errors or final retry, break and handle below
        break;
        
      } catch (fetchError) {
        console.error(`Fetch attempt ${attempts + 1} failed:`, fetchError);
        if (attempts < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, (attempts + 1) * 2000));
          attempts++;
          continue;
        }
        throw fetchError;
      }
    }

    if (!resp!.ok) {
      const txt = await resp!.text();
      console.error("Gemini API error:", resp!.status, txt);
      
      // Provide user-friendly error messages
      let userMessage = "Failed to process the document with OCR.";
      if (resp!.status === 503) {
        userMessage = "The OCR service is currently overloaded. Please try again in a few minutes.";
      } else if (resp!.status === 400) {
        userMessage = "The uploaded file format is not supported or the file is corrupted.";
      } else if (resp!.status === 429) {
        userMessage = "Too many requests. Please wait a moment before trying again.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: userMessage, 
          details: `API returned ${resp!.status}: ${txt}`,
          retryAfter: resp!.status === 503 ? 120 : 30 // Suggest retry time in seconds
        }),
        { status: resp!.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing API response...");
    const json = await resp!.json();
    console.log("API response structure:", Object.keys(json || {}));
    
    const candidate = json?.candidates?.[0];
    console.log("Candidate found:", !!candidate);
    
    const parts = candidate?.content?.parts || [];
    console.log("Parts found:", parts.length);
    
    const rawText = parts
      .map((p: any) => p.text)
      .filter((t: any) => typeof t === "string")
      .join("\n")
      .trim();

    // Clean up unwanted symbols and formatting artifacts and prevent duplications
    const lines = rawText.split('\n');
    
    // Remove duplicate consecutive lines (common OCR issue)
    const deduplicatedLines = lines.reduce((acc: string[], line: string, index: number) => {
      const trimmedLine = line.trim();
      const prevLine = index > 0 ? lines[index - 1].trim() : '';
      
      // Skip if this line is identical to the previous line and both are substantial
      if (trimmedLine === prevLine && trimmedLine.length > 8) {
        return acc;
      }
      
      // Skip if this line appears to be a duplicate within recent lines
      if (trimmedLine.length > 12) {
        const isDuplicateInRecent = acc.slice(-2).some(recentLine => 
          recentLine.trim() === trimmedLine
        );
        if (isDuplicateInRecent) {
          return acc;
        }
      }
      
      acc.push(line);
      return acc;
    }, []);
    
    const text = deduplicatedLines.join('\n')
      .replace(/^\*\s*$/gm, '') // Remove lines with only asterisks
      .replace(/^\*\s*\n/gm, '') // Remove asterisk-only lines
      .replace(/\*\s*$/gm, '') // Remove trailing asterisks
      .replace(/^\s*\*\s*/gm, '') // Remove leading asterisks
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive line breaks
      .trim();

    console.log("Extracted text length:", text.length);
    
    if (!text) {
      console.error("No text extracted from OCR");
      return new Response(
        JSON.stringify({ error: "No OCR text returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("OCR processing successful");
    return new Response(
      JSON.stringify({ text, filename: fileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("ocr-script error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
