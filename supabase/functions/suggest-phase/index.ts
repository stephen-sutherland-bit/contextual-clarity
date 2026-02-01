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
- Identify governing covenant and its "Instrumental Mode" (Mosaic = material/external/national; New = spiritual/internal/universal)
- Recognise "Covenantal Mislocation"—the error of applying wrong-covenant commands to the wrong audience
- Understand the NT as "Transition Literature" written during the Mosaic age (AD 30–70), not after it ended
- Recognise ancient metaphor (e.g., "clouds" = judgement; "world" = Israel's world; "the dead" = those under the Old Covenant)
- The "Imminent Horizon": Jesus' prophecies (Matthew 24, Revelation) were fulfilled in AD 70—the end of the Mosaic age
- Sin = transgression of Mosaic Law (not applicable today under the New Covenant of grace)

**THE FIVE LEARNING PHASES:**

1. **foundations** - Introduction to Contextual Reading
   - How to read the Bible contextually (original audience, historical setting)
   - Introduction to hermeneutics and interpretive principles
   - Understanding audience relevance—"Who was this written to?"
   - Basic principles: let Scripture interpret Scripture
   - For complete newcomers to CCM

2. **essentials** - Covenant Basics
   - What is a covenant? How do they function?
   - The major covenants: Abrahamic, Mosaic, Davidic, New
   - Key differences between covenants (terms, parties, duration)
   - The concept of "Instrumental Mode"—how each covenant operated (material vs. spiritual)
   - Foundation for understanding why covenant identification matters

3. **building-blocks** - Transition Literature & AD 70 Fulfilment
   - The NT as Transition Literature—written during overlapping covenants
   - The "Passport Transition" from Mosaic to New Covenant
   - How the Mosaic Covenant ended at AD 70
   - Prophetic fulfilment: Matthew 24, Revelation, Daniel fulfilled in the first century
   - The significance of "the last days," "the end of the age," and "this generation"
   - This is CENTRAL to CCM—most teachings about prophecy, judgement, or covenant transition belong here

4. **moving-on** - Life in the New Covenant
   - Practical Christian living under grace, not Law
   - What it means to be "in Christ"—identity, freedom, inheritance
   - The indwelling Spirit vs. external Law
   - New Covenant blessings and the completed work of Christ
   - Application-focused teachings about living from an accomplished reality

5. **advanced** - Doctrinal Deep Dives & Difficult Passages
   - Complex theological topics requiring solid CCM foundation
   - Detailed exegesis of commonly misunderstood passages
   - Addressing objections and "problem texts"
   - Topics like: resurrection, the nature of Satan/demons, non-Trinitarian perspectives
   - For those with solid understanding of phases 1–4

**DECISION GUIDE:**
- If it teaches HOW to interpret Scripture → foundations
- If it explains WHAT covenants are and how they differ → essentials
- If it discusses AD 70, prophecy fulfilment, Transition Literature, or covenant ending → building-blocks
- If it's about practical Christian living today, identity in Christ, grace → moving-on
- If it's a deep dive into difficult doctrines or addresses common objections → advanced

**KEY TERMINOLOGY TO RECOGNISE:**
- "Covenantal Mislocation" → usually building-blocks or advanced
- "Instrumental Mode" → usually essentials or building-blocks
- "Transition Literature" → building-blocks
- "Imminent Horizon" → building-blocks
- "Intra-Covenantal" language → essentials or building-blocks

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