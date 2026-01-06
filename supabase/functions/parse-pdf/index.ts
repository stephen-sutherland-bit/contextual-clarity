import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - unpdf for edge environments
import { extractText } from "https://esm.sh/unpdf@0.12.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify admin authentication
async function verifyAdmin(req: Request): Promise<{ isAdmin: boolean; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { isAdmin: false, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return { isAdmin: false, error: "Invalid or expired token" };
  }

  const { data: isAdmin } = await supabase.rpc("has_role", { 
    _user_id: user.id, 
    _role: "admin" 
  });

  if (!isAdmin) {
    return { isAdmin: false, error: "Admin access required" };
  }

  return { isAdmin: true };
}

// Extract text from PDF using unpdf (designed for edge/serverless)
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
  
  // Extract text using unpdf
  console.log('[parse-pdf] Starting unpdf extraction...');
  const result = await extractText(bytes, { mergePages: true });
  
  console.log(`[parse-pdf] unpdf result:`, typeof result);
  
  // Handle different return types from unpdf
  let text: string;
  if (typeof result === 'string') {
    text = result;
  } else if (result && typeof result.text === 'string') {
    text = result.text;
  } else {
    console.error('[parse-pdf] Unexpected unpdf result format:', result);
    throw new Error('Unexpected result format from PDF extraction');
  }
  
  console.log(`[parse-pdf] Extracted ${text.length} characters`);
  
  if (!text || text.trim().length === 0) {
    throw new Error('PDF extraction returned empty text');
  }
  
  return text.trim();
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
    // Verify admin access
    const { isAdmin, error: authError } = await verifyAdmin(req);
    if (!isAdmin) {
      console.log("Auth failed:", authError);
      return new Response(
        JSON.stringify({ error: authError }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
