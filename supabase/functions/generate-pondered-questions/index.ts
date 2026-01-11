import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify admin status
async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing authorization header");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });

  if (roleError || !isAdmin) throw new Error("Admin access required");
  return supabase;
}

// Log API usage
async function logUsage(operationType: string, estimatedCost: number, details: Record<string, unknown>) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabase.from("api_usage").insert({
    operation_type: operationType,
    estimated_cost: estimatedCost,
    details,
  });
}

const SYSTEM_PROMPT = `You are a theological content analyst for a Contextual Bible Study (CBS) platform. Your task is to read a teaching and identify 3-6 questions it compellingly answers, then format them in a specific pedagogical structure.

CBS METHODOLOGY CONTEXT:
- Interpret within original historical/cultural/covenantal setting
- Covenant Framework: Identify governing covenant (Mosaic/New)
- Literal vs. Symbolic: Recognise ancient metaphor (e.g., "clouds" = judgement; "world" = Israel's world)
- Fulfilment Horizon: Jesus' prophecies (Matthew 24, Revelation) were fulfilled in AD 70
- Law vs. Grace: Mosaic Covenant ended at AD 70; sin = transgression of Mosaic Law (not applicable today)

FOR EACH QUESTION, YOU MUST PROVIDE:
1. A "topic" (short label, e.g., "The Angel of the Lord", "End Times Rapture")
2. A "question" (the full question Christians often ask about this topic)
3. A "commonAnswer" (the typical incorrect or shallow answer pastors give - brief, in quotes)
4. A "cbsAnswer" (the teaching's contextually-grounded correct answer - 2-4 sentences, explaining the proof from the teaching. Write "The teaching proves..." or "The teaching demonstrates..." - NEVER "I prove" or "You prove")

RULES:
- Use New Zealand English spelling (e.g., recognise, favour, honour)
- Do NOT use bullet points in answers
- Write in essay style, not list format
- The cbsAnswer should reference how the teaching proves the point
- Make commonAnswer represent typical evangelical/mainstream Christian misunderstanding
- Questions should be ones that ordinary Christians genuinely struggle with

Return a JSON array of objects with keys: topic, question, commonAnswer, cbsAnswer`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyAdmin(req);

    const { content, title } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "Missing content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userPrompt = `Analyse the following teaching titled "${title || 'Untitled'}" and extract 3-6 key questions it answers. Return ONLY a valid JSON array, no other text.

TEACHING CONTENT:
${content.slice(0, 15000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI processing failed");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      throw new Error("No response from AI");
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = rawContent.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const questions = JSON.parse(jsonStr);
    
    if (!Array.isArray(questions)) {
      throw new Error("AI did not return an array");
    }

    // Log usage
    await logUsage("generate-pondered-questions", 0.05, {
      teaching_title: title,
      questions_generated: questions.length,
    });

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-pondered-questions error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
