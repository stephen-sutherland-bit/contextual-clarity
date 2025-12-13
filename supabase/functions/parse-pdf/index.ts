import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as pdfjsLib from "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from PDF using pdf.js
async function extractTextFromPDF(base64Data: string): Promise<string> {
  try {
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
    
    const textContent: string[] = [];
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = content.items
        .filter((item: unknown) => typeof item === 'object' && item !== null && 'str' in item)
        .map((item: unknown) => (item as { str: string }).str)
        .join(' ');
      
      if (pageText.trim()) {
        textContent.push(pageText);
      }
    }
    
    // Join all pages with double newlines
    return textContent.join('\n\n').trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
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
