
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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    let extractedText = '';

    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      // Handle TXT files
      extractedText = await file.text();
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // Handle PDF files using pdf-parse
      try {
        const { default: pdfParse } = await import('npm:pdf-parse@1.1.1');
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return new Response(
          JSON.stringify({ error: 'Failed to extract text from PDF. Please ensure the file is not corrupted or password-protected.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload a PDF or TXT file.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text could be extracted from the file.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully extracted text, length:', extractedText.length);

    // Clean up unwanted symbols and formatting artifacts and prevent duplications
    const cleanedText = extractedText
      .replace(/^\*\s*$/gm, '') // Remove lines with only asterisks
      .replace(/^\*\s*\n/gm, '') // Remove asterisk-only lines
      .replace(/\*\s*$/gm, '') // Remove trailing asterisks
      .replace(/^\s*\*\s*/gm, '') // Remove leading asterisks
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive line breaks
      // Remove duplicate consecutive lines (common OCR issue)
      .split('\n')
      .reduce((acc: string[], line: string, index: number, arr: string[]) => {
        const trimmedLine = line.trim();
        const prevLine = index > 0 ? arr[index - 1].trim() : '';
        const nextLine = index < arr.length - 1 ? arr[index + 1].trim() : '';
        
        // Skip if this line is identical to the previous line and both are substantial
        if (trimmedLine === prevLine && trimmedLine.length > 10) {
          return acc;
        }
        
        // Skip if this line appears to be a duplicate within a 3-line window
        if (trimmedLine.length > 15) {
          const isDuplicateInWindow = acc.slice(-3).some(prevAccLine => 
            prevAccLine.trim() === trimmedLine
          );
          if (isDuplicateInWindow) {
            return acc;
          }
        }
        
        acc.push(line);
        return acc;
      }, [])
      .join('\n')
      .trim();

    return new Response(
      JSON.stringify({ 
        text: cleanedText,
        fileName: file.name 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Text extraction error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process file: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
