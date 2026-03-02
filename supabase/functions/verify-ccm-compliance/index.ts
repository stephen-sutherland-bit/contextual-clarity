import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyAdmin(req: Request): Promise<{ isAdmin: boolean; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { isAdmin: false, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

async function logUsage(operationType: string, estimatedCost: number, details: Record<string, unknown>) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('api_usage').insert({
      operation_type: operationType,
      estimated_cost: estimatedCost,
      details,
      description: `CCM compliance verification`
    });
  } catch (e) {
    console.error('Failed to log usage:', e);
  }
}

const EXAMINATION_PROMPT = `You are a CCM compliance examiner. Your ONLY task is to compare a rewritten teaching against the CCM Methodology Outline and identify anomalies.

INSTRUCTIONS:
1. Read the CCM Methodology Outline carefully — it is the authoritative standard.
2. Read the teaching text.
3. Check every interpretive decision, doctrinal position, terminology choice, and application against the CCM Outline.
4. Report your findings in EXACTLY this format:

**Consistencies**
- List the areas where the teaching correctly follows CCM (brief, 1 line each)

**Anomalies**
- List SPECIFIC instances where the teaching departs from CCM rules (quote the problematic text, explain why it violates CCM, and state what CCM requires instead)
- If no anomalies found, write: "No anomalies detected."

**Verdict**
State one of:
- COMPLIANT: The teaching fully aligns with CCM methodology.
- MINOR ISSUES: The teaching is largely compliant but has minor terminology or emphasis issues.
- NON-COMPLIANT: The teaching contains significant departures from CCM methodology.

Be precise. Quote specific passages. Do not add general commentary or suggestions beyond what CCM requires.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isAdmin, error: authError } = await verifyAdmin(req);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: authError }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { teaching_text } = await req.json();

    if (!teaching_text) {
      return new Response(JSON.stringify({ error: 'Teaching text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch CCM outline
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: doc, error: docError } = await supabase
      .from('system_documents')
      .select('content')
      .eq('document_key', 'ccm_outline')
      .single();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: 'CCM Outline not found. Please upload it via the Admin panel.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inputTokens = Math.ceil((EXAMINATION_PROMPT.length + doc.content.length + teaching_text.length) / 4);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: EXAMINATION_PROMPT },
          { 
            role: 'user', 
            content: `CCM METHODOLOGY OUTLINE:\n\n${doc.content}\n\n---\n\nTEACHING TO EXAMINE:\n\n${teaching_text}` 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI verification failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    const report = result.choices?.[0]?.message?.content || 'No response from AI';

    const estimatedOutputTokens = Math.ceil(report.length / 4);
    const estimatedCost = (inputTokens / 1000000 * 0.15) + (estimatedOutputTokens / 1000000 * 0.60);
    
    await logUsage('ccm_verification', estimatedCost, {
      input_tokens_estimate: inputTokens,
      output_tokens_estimate: estimatedOutputTokens,
      teaching_length: teaching_text.length,
      model: 'google/gemini-2.5-flash'
    });

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-ccm-compliance:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
