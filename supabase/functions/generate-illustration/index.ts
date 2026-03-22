import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function logUsage(
  operationType: string,
  estimatedCost: number,
  metadata: Record<string, unknown> = {}
) {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await supabase.from("api_usage").insert({
      operation_type: operationType,
      estimated_cost: estimatedCost,
      metadata,
    });
  } catch (err) {
    console.error("Failed to log usage:", err);
  }
}

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
  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) {
    return { isAdmin: false, error: "Admin access required" };
  }
  return { isAdmin: true };
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status >= 500 && attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`API returned ${response.status}, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Fetch error, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries}):`, error);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError || new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isAdmin, error: authError } = await verifyAdmin(req);
    if (!isAdmin) {
      console.log("Auth failed:", authError);
      return new Response(
        JSON.stringify({ error: authError }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { title, theme, scriptures, customPrompt, referenceImage } = await req.json();

    // Decide which generation path to use
    // If customPrompt is provided, use the Lovable AI gateway for flexible image generation
    // Otherwise fall back to DALL-E 3 for auto-generation
    
    if (customPrompt) {
      // --- Custom prompt path: use Lovable AI image generation ---
      if (!lovableApiKey) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      const styleRules = `Style: Classical religious art meets modern minimalism. Warm, scholarly tones - amber, cream, deep burgundy, gold accents. Contemplative and scholarly, suitable for a theological publication. No text or words in the image. Vertical composition.`;
      
      const fullPrompt = `${customPrompt}\n\n${styleRules}`;

      console.log("Generating custom illustration via Lovable AI:", fullPrompt.substring(0, 200));

      // Build messages array
      const userContent: any[] = [{ type: "text", text: fullPrompt }];
      
      // If a reference image was provided, include it
      if (referenceImage) {
        userContent.push({
          type: "image_url",
          image_url: { url: referenceImage }
        });
      }

      const response = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: userContent }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Lovable AI error:", error);
        throw new Error(`AI image generation failed: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        console.error("Response structure:", JSON.stringify(data).substring(0, 500));
        throw new Error("No image data received from AI");
      }

      await logUsage("illustration_custom", 0.05, {
        title,
        customPrompt: customPrompt.substring(0, 200),
        hasReference: !!referenceImage,
        model: "gemini-3-pro-image-preview",
      });

      console.log("Custom illustration generated successfully");

      return new Response(
        JSON.stringify({ imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // --- Auto-generate path: use DALL-E 3 ---
      if (!openAIApiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const scriptureContext = scriptures?.slice(0, 3).join(", ") || "";
      const prompt = `Create a beautiful, reverent book cover illustration for a Christian Bible study teaching titled "${title}". 
      Theme: ${theme}. 
      ${scriptureContext ? `Related scriptures: ${scriptureContext}.` : ""}
      Style: Classical religious art meets modern minimalism. 
      Use warm, scholarly tones - amber, cream, deep burgundy, gold accents.
      Include subtle symbolic imagery related to the theme.
      The image should be contemplative and scholarly, suitable for a theological publication.
      No text or words in the image.
      Vertical composition, 2:3 aspect ratio.
      Ultra high resolution.`;

      console.log("Generating auto illustration with DALL-E 3");

      const response = await fetchWithRetry("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1792",
          quality: "hd",
          response_format: "b64_json",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI API error:", error);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const base64Image = data.data?.[0]?.b64_json;

      if (!base64Image) {
        console.error("Response structure:", JSON.stringify(data));
        throw new Error("No image data received from OpenAI");
      }

      const imageDataUrl = `data:image/png;base64,${base64Image}`;

      await logUsage("illustration", 0.12, {
        title,
        theme,
        model: "dall-e-3",
        size: "1024x1792",
        quality: "hd",
      });

      console.log("Auto illustration generated successfully");

      return new Response(
        JSON.stringify({ imageUrl: imageDataUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error generating illustration:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
