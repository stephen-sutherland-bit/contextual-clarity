import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Primary extraction using pdfjs-serverless
async function extractWithPdfJs(bytes: Uint8Array): Promise<string> {
  console.log('[pdfjs] Starting extraction...');
  
  // @ts-ignore - pdfjs-serverless types not fully compatible
  const { getDocument } = await import("https://esm.sh/pdfjs-serverless@0.4.1");
  
  // Pass data as object with options for Word-converted PDFs
  const pdf = await getDocument({ 
    data: bytes,
    useSystemFonts: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
  }).promise;
  
  console.log(`[pdfjs] PDF loaded with ${pdf.numPages} pages`);
  
  const textContent: string[] = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    
    console.log(`[pdfjs] Page ${pageNum}: ${content.items.length} text items found`);
    
    const pageText = content.items
      .map((item: { str?: string }) => item.str || '')
      .filter((text: string) => text.length > 0)
      .join(' ');
    
    console.log(`[pdfjs] Page ${pageNum} text length: ${pageText.length} chars`);
    
    if (pageText.trim()) {
      textContent.push(pageText);
    }
  }
  
  return textContent.join('\n\n').trim();
}

// Fallback extraction using pdf.mjs (Cloudflare-compatible)
async function extractWithPdfMjs(bytes: Uint8Array): Promise<string> {
  console.log('[pdf.mjs] Starting fallback extraction...');
  
  // @ts-ignore
  const { PdfReader } = await import("https://esm.sh/pdf.mjs@1.0.0");
  
  const reader = new PdfReader();
  const doc = await reader.open(bytes);
  
  console.log(`[pdf.mjs] PDF opened with ${doc.numPages} pages`);
  
  const textContent: string[] = [];
  
  for (let i = 0; i < doc.numPages; i++) {
    const page = await doc.getPage(i);
    const text = await page.getText();
    console.log(`[pdf.mjs] Page ${i + 1} text length: ${text.length} chars`);
    if (text.trim()) {
      textContent.push(text);
    }
  }
  
  return textContent.join('\n\n').trim();
}

// Main extraction function with fallback
async function extractTextFromPDF(base64Data: string): Promise<string> {
  console.log(`[parse-pdf] Received base64 data length: ${base64Data.length}`);
  
  // Convert base64 to Uint8Array
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  console.log(`[parse-pdf] Converted to ${bytes.length} bytes`);
  console.log(`[parse-pdf] First 10 bytes: ${Array.from(bytes.slice(0, 10)).join(', ')}`);
  
  // Try primary extraction
  try {
    const text = await extractWithPdfJs(bytes);
    if (text.length > 0) {
      console.log(`[parse-pdf] pdfjs extraction successful: ${text.length} chars`);
      return text;
    }
    console.log('[parse-pdf] pdfjs returned empty text, trying fallback...');
  } catch (error) {
    console.error('[parse-pdf] pdfjs failed:', error);
  }
  
  // Try fallback extraction
  try {
    const text = await extractWithPdfMjs(bytes);
    if (text.length > 0) {
      console.log(`[parse-pdf] pdf.mjs extraction successful: ${text.length} chars`);
      return text;
    }
  } catch (error) {
    console.error('[parse-pdf] pdf.mjs fallback failed:', error);
  }
  
  throw new Error('All PDF extraction methods failed to extract text');
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
