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

// Log API usage to database
async function logUsage(operationType: string, estimatedCost: number, details: Record<string, unknown>) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('api_usage').insert({
      operation_type: operationType,
      estimated_cost: estimatedCost,
      details,
      description: `GPT-4o indexing`
    });
  } catch (e) {
    console.error('Failed to log usage:', e);
  }
}

const INDEX_SYSTEM_PROMPT = `You are an expert theological indexer for The Christian Theologist. Your task is to analyse a teaching document and extract comprehensive metadata for indexing and search purposes.

You follow Contextual Bible Study (CBS) methodology:
- Interpret within original historical/cultural/covenantal setting
- Identify governing covenant (Mosaic/New)
- Recognise ancient metaphor (e.g., "clouds" = judgement; "world" = Israel's world)
- Jesus' prophecies (Matthew 24, Revelation) were fulfilled in AD 70
- Mosaic Covenant ended at AD 70; sin = transgression of Mosaic Law

Use New Zealand English (e.g., judgement, fulfilment, honour, colour).

**LEARNING PHASES** - Assign each teaching to one of these five scaffolded learning phases:
1. **foundations**: The basics of biblical interpretation and Contextual Bible Study methodology. For newcomers learning how to read the Bible contextually.
2. **essentials**: Covenant Basics. Understanding the fundamental nature of covenants in Scripture.
3. **building-blocks**: Transition from Mosaic Covenant to the New Covenant - Fulfilment in AD70. How the old covenant ended and the new began.
4. **moving-on**: Life in the New Covenant. Practical application and living under the new covenant.
5. **advanced**: Doctrinal Deep Dives. Complex theological topics for those with solid foundations.

Extract the following from the teaching:

1. **Primary Theme**: The single main topic/focus of the teaching
2. **Secondary Themes**: Up to 10 additional themes, especially CBS themes
3. **Scriptures**: ALL scriptural references in ESV standardised format (e.g., "Genesis 1:1", "Romans 3:23"). No duplicates.
4. **Doctrines**: 10-20 core doctrines discussed
5. **Keywords**: 20-30 keywords/tags:
   - Start with terms a newcomer would search for (avoid scholarly jargon like "exegesis", "eschaton")
   - Then add Contextual Bible Study and eschatology terms
   - Use paragraph headings as keywords where useful
   - Don't use Māori words
   - Use NZ English (e.g., "Judgement" not "Judgment")
6. **Questions Answered**: What questions does this teaching answer? Phrase as actual questions someone might ask.
7. **Quick Answer**: A 2-3 sentence summary that directly answers the main question(s) this teaching addresses. This is shown before the full teaching.
8. **Suggested Title**: A clear, descriptive title for the teaching
9. **Suggested Phase**: Which of the five learning phases (foundations, essentials, building-blocks, moving-on, advanced) best fits this teaching? Consider the complexity and where it fits in the learning journey.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating index for content, length:', content.length);
    
    // Estimate input tokens (~4 chars per token)
    const inputTokens = Math.ceil((INDEX_SYSTEM_PROMPT.length + content.length) / 4);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: INDEX_SYSTEM_PROMPT },
          { role: 'user', content: `Please analyse this teaching and extract the metadata:\n\nExisting Title (if any): ${title || 'None provided'}\n\nContent:\n${content}` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_teaching_metadata',
              description: 'Extract comprehensive metadata from a teaching document',
              parameters: {
                type: 'object',
                properties: {
                  suggested_title: { type: 'string', description: 'A clear, descriptive title for the teaching' },
                  primary_theme: { type: 'string', description: 'The single main topic/focus' },
                  secondary_themes: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Up to 10 additional themes'
                  },
                  scriptures: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'All scriptural references in ESV format'
                  },
                  doctrines: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: '10-20 core doctrines discussed'
                  },
                  keywords: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: '20-30 keywords/tags for search'
                  },
                  questions_answered: { 
                    type: 'array', 
                    items: { type: 'string' },
                    description: 'Questions this teaching answers'
                  },
                  quick_answer: { 
                    type: 'string', 
                    description: '2-3 sentence summary that directly answers the main question(s)'
                  },
                  suggested_phase: { 
                    type: 'string', 
                    enum: ['foundations', 'essentials', 'building-blocks', 'moving-on', 'advanced'],
                    description: 'The learning phase that best fits this teaching'
                  },
                  phase_reasoning: {
                    type: 'string',
                    description: 'Brief explanation of why this phase was chosen'
                  }
                },
                required: ['suggested_title', 'primary_theme', 'secondary_themes', 'scriptures', 'doctrines', 'keywords', 'questions_answered', 'quick_answer', 'suggested_phase', 'phase_reasoning'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_teaching_metadata' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI indexing failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response:', data);
      return new Response(JSON.stringify({ error: 'Failed to extract metadata' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metadata = JSON.parse(toolCall.function.arguments);
    console.log('Extracted metadata:', metadata);

    // Estimate cost: GPT-4o input ~$2.50/1M, output ~$10/1M
    // Output for indexing is relatively small (~500 tokens)
    const estimatedOutputTokens = 500;
    const estimatedCost = (inputTokens / 1000000 * 2.50) + (estimatedOutputTokens / 1000000 * 10);
    
    await logUsage('indexing', estimatedCost, {
      input_tokens_estimate: inputTokens,
      output_tokens_estimate: estimatedOutputTokens,
      content_length: content.length,
      model: 'gpt-4o'
    });

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-index function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
