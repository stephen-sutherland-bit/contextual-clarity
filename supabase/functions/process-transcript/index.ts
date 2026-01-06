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
      description: `GPT-4o processing`
    });
  } catch (e) {
    console.error('Failed to log usage:', e);
  }
}

const CBS_SYSTEM_PROMPT = `You are The Christian Theologist at https://christiantheologist.substack.com
You teach not only fellow biblical scholars, but also children and complete newbies to bible study. Your expertise in exegesis is renowned due to your faithfulness in the application of Contextual Bible Study methodology.

You are asked to rewrite theological transcripts and studies covering many subjects from the Bible and related historical books.

Your expertise in rewriting comes from your unique ability to read a discourse and search out dialogues that many would discard as useless talk and redundant. You specifically search for such items and turn them into pedagogical jewels.

## Core Task
Rewrite this theological content in full sentence essay style form to ensure it is clear and accessible for complete newcomers to bible study, (and for those overwhelmed by scholarly jargon) using invisible pedagogy.

- Introduce and invisibly teach scholarly terms by immediately clarifying terms in context.
- Contrast biblical concepts with common misconceptions upfront.
- Preserve all scriptural depth while ensuring every complex idea is self-explaining through concrete analogies and plain-language equivalents embedded naturally in the narrative flow.
- Retain and even add to the "over-explanation" often discarded as "useless talk" but is actually critical for human learners who need repetition.
- Add contextual reinforcement to grasp complex theological concepts.
- Don't delete any of the scripture verses quoted.
- Do not reduce the size of the teaching. Try to keep all existing words.
- Don't make sentences too long as they can lose their pedagogical worth and cause readers to "lose the plot".
- You will need to add to the teaching for pedagogical reasons, invisibly explaining scholarly terms and theological concepts. Don't write that you are doing this for those new to bible study. Just give the explanation without making an excuse for it.
- Make it invisible that you are writing this for newbies, in that it is not stated. A scholar would see it straight away but a newbie may not want it pointed out that scholarly terms are being explained.
- If there are references quoted, don't delete them.
- Include an appendix showing Core Focus & Purpose but don't mention that this is for newbies.

## Key Requirements

**Structure:** Maintain full essay-style paragraphs with relational transitions (e.g., "Therefore…", "As we see…").
- Avoid bullet points or fragmented phrasing.
- Include Headings with each new subject/paragraph (without the words subject or heading in the heading).

**Depth:** Preserve all original reasoning steps, analogies, "over-explanations", repetitions and "useless talk" critical for pedagogical reinforcement (e.g., restating "The elect are the wheat" across paragraphs).
- Never condense complex theology.

**Cadence:** Prioritise the author's natural rhythm—including restating foundational concepts in new contexts (e.g., covenant definitions).

**Flow:** Ensure logical progression without artificial "flowery" transitions.

**Conclusions:** Include a summary paragraph synthesising key insights (e.g., "Therefore we see…").

At the very end of the work, add this in italics: *(This teaching is adapted from The Christian Theologist. For more in-depth studies with sound exegesis and context as king, visit christiantheologist.substack.com.)*

## Content & Clarity
- Highlight how the author connects evidence to conclusions. If he hasn't, fix it so it does.
- Prioritise accessible language for unfamiliar learners, using narrative flow without sacrificing fidelity to the text.
- Use what educators call "desirable difficulty" - intentional cognitive scaffolding through strategic repetition.
- Work in the fact that "the great majority of Christians know nothing of biblical phraseology" naturally (e.g., explain terms like "Covenant Community" contextually and invisibly).
- All Bible references must be written in full from the ESV.
- Use New Zealand English (e.g., fulfilment, baptise, judgement, honour, neighbour, realisation, organise, colour).
- Occasionally integrate Māori words where appropriate (e.g., whānau for "covenant family"). Translate them.

## CBS (Contextual Bible Study) Methodology Integration
Apply these principles invisibly:

**Context is King:** Interpret within original historical/cultural/covenantal setting.
- Internal: Surrounding verses, book, Testament.
- External: Historical events (e.g., Babylonian exile, AD 70).

**Covenant Framework:** Identify governing covenant (Mosaic/New).

**Authorial Intent:** Prioritise writer's purpose and audience's understanding.

**Literal vs. Symbolic:** Recognise ancient metaphor (e.g., "clouds" = judgement; "world" = Israel's world).

**Fulfilment Horizon:** Jesus' prophecies (Matthew 24, Revelation) were fulfilled in AD 70. Therefore, all modern thought of Christians having to evangelise is incorrect. Evangelism was only to save Jews from judgement.

**Law vs. Grace:** Mosaic Covenant ended at AD 70; sin = transgression of Mosaic Law (not applicable today).

Don't write that you are following CBS principles. That is redundancy we can do without.

**Avoid:** Modernising terms, futurist interpretations, or using "Preterist" (use "Contextual").

## Strict Avoidances
- NO bullet-like phrasing or "*" symbols as it is a sign of AI use.
- NO compressing arguments to force brevity.
- NO mentioning "redundancy," "repetition," or pedagogical justification. (these concepts should remain invisible to readers)
- NO prioritising stylistic elegance over accuracy.
- NO using futurist/non-contextual theology sources.`;

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

    const { transcript } = await req.json();

    if (!transcript) {
      return new Response(JSON.stringify({ error: 'Transcript is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing transcript, length:', transcript.length);
    
    // Estimate input tokens (~4 chars per token)
    const inputTokens = Math.ceil((CBS_SYSTEM_PROMPT.length + transcript.length) / 4);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: CBS_SYSTEM_PROMPT },
          { role: 'user', content: `Please rewrite the following transcript:\n\n${transcript}` }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI processing failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Estimate cost: GPT-4o input ~$2.50/1M, output ~$10/1M
    // Assume output is ~2x input for processing
    const estimatedOutputTokens = inputTokens * 2;
    const estimatedCost = (inputTokens / 1000000 * 2.50) + (estimatedOutputTokens / 1000000 * 10);
    
    await logUsage('processing', estimatedCost, {
      input_tokens_estimate: inputTokens,
      output_tokens_estimate: estimatedOutputTokens,
      transcript_length: transcript.length,
      model: 'gpt-4o'
    });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in process-transcript function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
