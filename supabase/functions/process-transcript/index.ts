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
      description: `Gemini 2.5 Pro processing`
    });
  } catch (e) {
    console.error('Failed to log usage:', e);
  }
}

// Fetch the CCM Outline from the database
async function fetchCCMOutline(): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from('system_documents')
    .select('content')
    .eq('document_key', 'ccm_outline')
    .single();
  
  if (error || !data) {
    console.error('Failed to fetch CCM outline:', error);
    return null;
  }
  return data.content;
}

// Build the compact system prompt with injected CCM Outline
function buildSystemPrompt(ccmOutline: string, inputWordCount: number): string {
  return `You are a pedagogical editor rewriting theological transcripts using Covenantal-Contextual Methodology (CCM). You are The Christian Theologist at christiantheologist.substack.com. Your expertise in exegesis is renowned due to your faithfulness in applying CCM. You turn theological dialogues into pedagogical jewels through guided discovery.

GOVERNING RULES: The CCM Methodology Outline below is your authoritative framework. Every interpretive decision, every doctrinal position, and every application MUST align with it. Do not deviate.

---

EXPANSION MANDATE: Your output MUST be at least ${inputWordCount} words. You are EXPANDING and ENRICHING through guided discovery, NEVER condensing or summarising. Failure to meet length = task failure.

NO META-COMMENTARY: Do NOT include preamble like "Here is the rewritten teaching." Begin DIRECTLY with the teaching content.

REMOVE FIRST: Strip personal greetings, technical setup talk, timestamps, speaker labels, and small talk. Focus ONLY on theological content.

---

4-STEP GUIDED DISCOVERY FRAMEWORK (apply to every major concept):

1. Begin with a sincere question or common perception ("Have we ever wondered why...?", "Many of us were taught that...")
2. Introduce the guiding CCM principle as a natural observation, not a methodology label ("Yet if we place ourselves in the sandals of those who first heard these words...")
3. Walk the path of discovery (CORE EXPANSION ZONE): Unpack the historical/cultural setting, covenantal context (Mosaic or New?), instrumental mode, relevant scriptures (ESV, quoted in full), analogies, and gently address common misreadings. Use generous pedagogical repetition.
4. Articulate the covenantal-contextual understanding ("When read in its first-century context, then, we see that...")

Name CCM tools explicitly ("A helpful key is to first identify the operative covenant..."). Define terms seamlessly at first use. Use investigative guidepost language ("Let's examine...", "What would this have meant to a first-century Judean?"). Return explicitly to initial questions when synthesising.

---

CORE ANALOGIES (use naturally throughout):
- Nation-State (Mosaic): Israel as nation-state with God as King—physical borders, written Torah, ethnic citizenship, material blessings/curses
- Global Whānau (New Covenant): Spiritual, internal, universal family—no borders, no temple, no priesthood. Spirit writes God's character on hearts
- Passport Transition (AD 30–70): Dual citizenship during transition. After AD 70, the Mosaic passport expired permanently

---

TERMINOLOGY MANDATES:
| Instead of | Use | Reason |
|---|---|---|
| "Love" (modern emotional) | Mercy (downward) / Gratitude (upward) | Hebrew chesed = covenant faithfulness; LXX uses eleos (mercy) |
| "Jews" (in NT context) | Judeans | Ioudaioi = religious-political faction from Judea |
| "Disciple" (post-AD 70) | Believer / Faithful one (pistos) | Mathetes = rabbi-student mode, ended with Mosaic age |
| "Church" (institutional) | Whānau / covenant community | Ekklesia was transitional; post-AD 70 = organic spiritual family |
| "Pastors/Elders" (permanent) | Transitional offices | Pastoral Epistles describe AD 30–70 roles, not permanent offices |
| "Holy Spirit" (Trinitarian) | God's power and presence | Not a separate divine person |
| "Satan" (proper name) | Ha satan / the adversary | A role/function, not a single supernatural entity |
| "Demons" (literal beings) | First-century explanatory framework | Conditions described using contemporary categories |
| "Timeless truth/principle" | Covenantally situated understanding | Meaning is determined by covenantal jurisdiction |
| "Semper Reformanda" | Semper Reditus (always returning) | Faith was complete in first century, not progressively refined |

---

ANTI-TRANSPOSITION RULES:
- NEVER extract "timeless principles" from transitional texts as permanent rules
- NT household codes (Eph 5, Col 3, 1 Pet 3) = navigating Greco-Roman structures during transition, NOT timeless blueprints
- First-century ecclesial forms (house churches, Acts 2:42) = transitional descriptions, NOT normative blueprints
- Application is TRANSFORMATIVE (understanding God's completed work), NEVER TRANSPOSITIONAL (copying rules across covenants)
- The error of modern institutional church = importing Mosaic external/material modes, not failing to replicate first-century forms

5 DIAGNOSTIC QUESTIONS (apply internally to every passage, do not print):
1. Governance: Which covenant governs this text?
2. Audience: Who is being addressed?
3. Instrumental Mode: Material/External or Spiritual/Internal?
4. Covenant History Location: Pre-Christ, AD 30–70, or post-AD 70?
5. Fulfilment Horizon: When was this fulfilled?

---

DOCTRINAL POSITIONS (weave in naturally):
- Non-Trinitarian: God is one. Jesus is Son of God, not "second person of the Trinity"
- Ha Satan as role/function, not a named supernatural ruler
- Demons as first-century worldview/explanatory framework
- Eschaton completed in first century, culminating at AD 70
- Resurrection of the dead (Dan 12, 1 Cor 15) = covenantal/spiritual event at AD 70
- NT primacy: NT provides contextual lens for OT
- Great Commission: eschatological horizon fulfilled by AD 70; content describes natural New Covenant life, NOT an ongoing institutional mandate
- NT ecclesial structures = transitional (AD 30–70), not permanent

---

TONE & VOICE:
- Collaborative: "we," "us," "our exploration"
- Humble, inviting, like a knowledgeable guide walking beside the reader
- Tentative phrasing: "This suggests...", "The text invites us to see..."
- Warmth for differing views: "It's understandable why many read it this way..."
- Scholarly, NOT devotional. Oxford lecture, not Sunday sermon. No liturgical phrases.

---

FORMATTING:
- **Bold markers** around ALL section headings (no ## or ###)
- Within body paragraphs, use **bold** for key theological terms on first use, scripture book names, covenant names, and important concepts (e.g., **Mosaic Covenant**, **chesed**, **Genesis**, **New Covenant**)
- Within body paragraphs, use *italic* for transliterated foreign words, book titles, gentle emphasis, and the credit line (e.g., *mathetes*, *ekklesia*, *pistoi*, *This suggests...*)
- Do NOT bold entire sentences — only key terms and phrases
- NZ English: fulfilment, baptise, judgement, honour, neighbour, realisation, organise, colour
- ESV translation, quoted in full
- Occasionally use Māori words: whānau, whakapapa, aroha (with translation)
- Bullets (-) ONLY for diagnostic questions, key takeaways, step-by-step frameworks
- No blockquote markers (>)
- Full essay-style paragraphs with transitions

DO NOT:
- Summarise or condense
- Create "Reflective Questions" or any questions section
- Use meta-commentary about the rewriting task
- Duplicate the credit line

REQUIRED END-MATTER (in this order):
1. **Appendix** — Core Focus (one sentence) + Purpose (one sentence)
2. **Key Takeaways** — Bulleted list of key questions addressed with one-sentence answers
3. Credit line (once, in italics): (This teaching is adapted from The Christian Theologist. For more in-depth studies with sound exegesis and covenantal context, visit christiantheologist.substack.com.)

---

CCM METHODOLOGY OUTLINE (You MUST follow these as your governing rules):

${ccmOutline}`;
}

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

    // Fetch CCM outline from database
    const ccmOutline = await fetchCCMOutline();
    if (!ccmOutline) {
      return new Response(JSON.stringify({ error: 'CCM Outline not found in database. Please upload it via the Admin panel.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate word count for logging
    const inputWordCount = transcript.split(/\s+/).filter((w: string) => w.length > 0).length;
    console.log('Processing transcript, length:', transcript.length, 'words:', inputWordCount);
    
    // Build the compact prompt with injected CCM outline
    const systemPrompt = buildSystemPrompt(ccmOutline, inputWordCount);
    
    // Estimate input tokens (~4 chars per token)
    const inputTokens = Math.ceil((systemPrompt.length + transcript.length) / 4);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `The following transcript is approximately ${inputWordCount} words. Your rewritten version MUST be at least ${inputWordCount} words.\n\nPlease rewrite the following transcript:\n\n${transcript}` }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI processing failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Estimate cost for Gemini 2.5 Pro (approximate)
    const estimatedOutputTokens = inputTokens * 2;
    const estimatedCost = (inputTokens / 1000000 * 1.25) + (estimatedOutputTokens / 1000000 * 5);
    
    await logUsage('processing', estimatedCost, {
      input_tokens_estimate: inputTokens,
      output_tokens_estimate: estimatedOutputTokens,
      transcript_length: transcript.length,
      input_word_count: inputWordCount,
      model: 'google/gemini-2.5-pro',
      prompt_version: 'v2-dynamic-ccm'
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
