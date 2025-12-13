import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple PDF text extraction using pdf-parse compatible approach
async function extractTextFromPDF(base64Data: string): Promise<string> {
  // Convert base64 to Uint8Array
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Basic PDF text extraction
  // This extracts visible text content from PDF streams
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  
  // Extract text between stream markers and decode
  const textContent: string[] = [];
  
  // Pattern to find text content in PDF
  // Look for BT (begin text) ... ET (end text) blocks
  const btEtPattern = /BT([\s\S]*?)ET/g;
  let match;
  
  while ((match = btEtPattern.exec(text)) !== null) {
    const textBlock = match[1];
    
    // Extract text from Tj and TJ operators
    const tjPattern = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjPattern.exec(textBlock)) !== null) {
      textContent.push(tjMatch[1]);
    }
    
    // Extract text from TJ arrays
    const tjArrayPattern = /\[([\s\S]*?)\]\s*TJ/g;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayPattern.exec(textBlock)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const textParts = arrayContent.match(/\(([^)]*)\)/g);
      if (textParts) {
        textContent.push(textParts.map(p => p.slice(1, -1)).join(''));
      }
    }
  }
  
  // If we couldn't extract text using PDF operators, try to find readable text
  if (textContent.length === 0) {
    // Look for plain text that might be in the PDF
    const plainTextPattern = /[\x20-\x7E\n\r\t]{20,}/g;
    const plainMatches = text.match(plainTextPattern);
    if (plainMatches) {
      // Filter out PDF syntax
      const filtered = plainMatches.filter(m => 
        !m.includes('stream') && 
        !m.includes('endstream') &&
        !m.includes('endobj') &&
        !m.includes('/Type') &&
        !m.includes('/Font') &&
        !m.includes('/Resources')
      );
      textContent.push(...filtered);
    }
  }
  
  // Clean up extracted text
  let result = textContent.join('\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  
  return result;
}

// Log usage to database
async function logUsage(operationType: string, estimatedCost: number, details: Record<string, unknown>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  await supabase.from('api_usage').insert({
    operation_type: operationType,
    estimated_cost: estimatedCost,
    details,
    description: `PDF parsing: ${details.filename || 'unknown'}`
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, filename } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: "No PDF data provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing PDF: ${filename || 'unknown'}`);

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfBase64);

    // Log usage (PDF parsing is essentially free - no external API)
    await logUsage('pdf_parse', 0, {
      filename,
      textLength: extractedText.length
    });

    console.log(`Extracted ${extractedText.length} characters from PDF`);

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        charCount: extractedText.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error parsing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
