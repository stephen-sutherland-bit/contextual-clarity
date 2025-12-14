import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, theme, scriptures } = await req.json();

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Create a descriptive prompt for the cover illustration
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

    console.log("Generating illustration with prompt:", prompt);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
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
    // gpt-image-1 returns base64 in data[0].b64_json
    const base64Image = data.data?.[0]?.b64_json;

    if (!base64Image) {
      console.error("Response structure:", JSON.stringify(data));
      throw new Error("No image data received from OpenAI");
    }

    // Return the base64 image as a data URL
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    console.log("Illustration generated successfully");

    return new Response(
      JSON.stringify({ imageUrl: imageDataUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
