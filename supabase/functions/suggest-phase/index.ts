import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

// Log API usage to database
async function logUsage(operationType: string, estimatedCost: number, details: Record<string, unknown>) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('api_usage').insert({
      operation_type: operationType,
      estimated_cost: estimatedCost,
      details,
      description: `GPT-4o phase suggestion`
    });
  } catch (e) {
    console.error('Failed to log usage:', e);
  }
}

const PHASE_SYSTEM_PROMPT = `You are an expert theological categoriser for The Christian Theologist, specialising in Covenantal Contextual Methodology (CCM).

Your task is to categorise teachings into one of five scaffolded learning phases based on their content, complexity, and where they fit in a learner's journey.

**CCM METHODOLOGY CONTEXT:**
- Interpret within original historical/cultural/covenantal setting
- Identify governing covenant (Mosaic/New)
- Recognise ancient metaphor (e.g., "clouds" = judgement; "world" = Israel's world)
- Jesus' prophecies (Matthew 24, Revelation) were fulfilled in AD 70
- Mosaic Covenant ended at AD 70; sin = transgression of Mosaic Law

**THE FIVE LEARNING PHASES:**

1. **foundations** - The basics of biblical interpretation and CCM
   - How to read the Bible contextually
   - Introduction to hermeneutics
   - Understanding audience relevance
   - Basic principles of interpretation
   - For complete newcomers to CCM

2. **essentials** - Covenant Basics
   - What is a covenant?
   - Old vs New Covenant
   - The nature and structure of biblical covenants
   - Abraham, Moses, David covenants
   - Foundation for understanding covenant theology

3. **building-blocks** - Transition from Mosaic to New Covenant / AD70 Fulfilment
   - How the Mosaic Covenant ended
   - The significance of AD 70
   - Prophetic fulfilment in the first century
   - The transition period (30-70 AD)
   - Matthew 24, Revelation fulfilled prophecy
   - This is CENTRAL to CCM - most teachings about prophecy, judgement, or covenant transition belong here

4. **moving-on** - Life in the New Covenant
   - Practical Christian living
   - What it means to be "in Christ"
   - Freedom from the law
   - New Covenant blessings and responsibilities
   - Application-focused teachings

5. **advanced** - Doctrinal Deep Dives
   - Complex theological topics
   - Detailed exegesis of difficult passages
   - Addressing common objections
   - Topics requiring prior CCM foundation
   - For those with solid understanding of phases 1-4

**DECISION GUIDE:**
- If it teaches HOW to interpret Scripture → foundations
- If it explains WHAT covenants are → essentials  
- If it discusses AD70, prophecy fulfilment, or covenant transition → building-blocks
- If it's about living the Christian life today → moving-on
- If it's a deep dive requiring prior knowledge → advanced

Analyse the teaching and determine which phase best fits.`;

serve(async (req) => {
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

    const { teachings } = await req.json();

    if (!teachings || !Array.isArray(teachings) || teachings.length === 0) {
      return new Response(JSON.stringify({ error: 'Array of teachings is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Suggesting phases for ${teachings.length} teachings`);
    
    const results = [];

    for (const teaching of teachings) {
      const { id, title, primary_theme, secondary_themes, doctrines, scriptures, quick_answer, full_content } = teaching;
      
      // Build a summary of the teaching for analysis
      // Use metadata first, fall back to content excerpt if needed
      let analysisContent = `Title: ${title || 'Untitled'}
Primary Theme: ${primary_theme || 'Unknown'}
Secondary Themes: ${(secondary_themes || []).join(', ') || 'None'}
Doctrines: ${(doctrines || []).slice(0, 10).join(', ') || 'None'}
Key Scriptures: ${(scriptures || []).slice(0, 10).join(', ') || 'None'}
Quick Answer: ${quick_answer || 'None'}`;

      // Add a content excerpt if metadata is sparse
      if (!primary_theme && !quick_answer && full_content) {
        analysisContent += `\n\nContent Excerpt: ${full_content.substring(0, 2000)}`;
      }

      const inputTokens = Math.ceil((PHASE_SYSTEM_PROMPT.length + analysisContent.length) / 4);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Using mini for cost efficiency since this is a simpler task
            messages: [
              { role: 'system', content: PHASE_SYSTEM_PROMPT },
              { role: 'user', content: `Analyse this teaching and determine which learning phase it belongs to:\n\n${analysisContent}` }
            ],
            tools: [
              {
                type: 'function',
                function: {
                  name: 'categorise_teaching',
                  description: 'Categorise a teaching into the appropriate learning phase',
                  parameters: {
                    type: 'object',
                    properties: {
                      suggested_phase: { 
                        type: 'string', 
                        enum: ['foundations', 'essentials', 'building-blocks', 'moving-on', 'advanced'],
                        description: 'The learning phase that best fits this teaching'
                      },
                      confidence: {
                        type: 'string',
                        enum: ['high', 'medium', 'low'],
                        description: 'How confident you are in this categorisation'
                      },
                      reasoning: {
                        type: 'string',
                        description: 'Brief explanation of why this phase was chosen (1-2 sentences)'
                      }
                    },
                    required: ['suggested_phase', 'confidence', 'reasoning'],
                    additionalProperties: false
                  }
                }
              }
            ],
            tool_choice: { type: 'function', function: { name: 'categorise_teaching' } }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenAI API error for teaching ${id}:`, response.status, errorText);
          results.push({ id, error: 'AI categorisation failed' });
          continue;
        }

        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall) {
          console.error(`No tool call in response for teaching ${id}:`, data);
          results.push({ id, error: 'Failed to extract phase' });
          continue;
        }

        const phaseResult = JSON.parse(toolCall.function.arguments);
        results.push({ 
          id, 
          title,
          suggested_phase: phaseResult.suggested_phase,
          confidence: phaseResult.confidence,
          reasoning: phaseResult.reasoning
        });

        // Estimate cost: GPT-4o-mini input ~$0.15/1M, output ~$0.60/1M
        const estimatedOutputTokens = 100;
        const estimatedCost = (inputTokens / 1000000 * 0.15) + (estimatedOutputTokens / 1000000 * 0.60);
        
        await logUsage('phase-suggestion', estimatedCost, {
          teaching_id: id,
          teaching_title: title,
          suggested_phase: phaseResult.suggested_phase,
          input_tokens_estimate: inputTokens,
          model: 'gpt-4o-mini'
        });

      } catch (err) {
        console.error(`Error processing teaching ${id}:`, err);
        results.push({ id, error: err instanceof Error ? err.message : 'Unknown error' });
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in suggest-phase function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});