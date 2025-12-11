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

// Process base64 in chunks to prevent memory issues
function base64ToUint8Array(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Log API usage to database
async function logUsage(operationType: string, estimatedCost: number, details: Record<string, unknown>) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('api_usage').insert({
      operation_type: operationType,
      estimated_cost: estimatedCost,
      details,
      description: `Whisper transcription`
    });
  } catch (e) {
    console.error('Failed to log usage:', e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mimeType, chunkIndex, totalChunks } = await req.json();

    if (!audio) {
      return new Response(JSON.stringify({ error: 'No audio data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Transcribing audio chunk ${chunkIndex + 1}/${totalChunks}, mimeType: ${mimeType}`);

    // Convert base64 to binary
    const binaryAudio = base64ToUint8Array(audio);
    const audioSizeBytes = binaryAudio.length;
    
    // Determine file extension and audio mime type from original mime type
    // Whisper expects audio files, so convert video mime types to audio
    let extension = 'mp3';
    let audioMimeType = 'audio/mpeg';
    
    if (mimeType?.includes('mp3') || mimeType?.includes('mpeg')) {
      extension = 'mp3';
      audioMimeType = 'audio/mpeg';
    } else if (mimeType?.includes('wav')) {
      extension = 'wav';
      audioMimeType = 'audio/wav';
    } else if (mimeType?.includes('m4a')) {
      extension = 'm4a';
      audioMimeType = 'audio/m4a';
    } else if (mimeType?.includes('webm')) {
      extension = 'webm';
      audioMimeType = 'audio/webm';
    } else if (mimeType?.includes('ogg')) {
      extension = 'ogg';
      audioMimeType = 'audio/ogg';
    } else if (mimeType?.includes('mp4')) {
      // MP4 files (even video/mp4) should be sent as audio/mp4 to Whisper
      extension = 'mp4';
      audioMimeType = 'audio/mp4';
    } else if (mimeType?.includes('flac')) {
      extension = 'flac';
      audioMimeType = 'audio/flac';
    }

    console.log(`Using extension: ${extension}, audioMimeType: ${audioMimeType}`);

    // Prepare form data for Whisper API
    const formData = new FormData();
    const blob = new Blob([binaryAudio.buffer as ArrayBuffer], { type: audioMimeType });
    formData.append('file', blob, `audio.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Whisper error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `Transcription failed: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    console.log(`Chunk ${chunkIndex + 1} transcribed successfully, length: ${result.text?.length || 0}`);

    // Estimate cost: Whisper is ~$0.006 per minute, estimate ~1MB per minute of audio
    const estimatedMinutes = audioSizeBytes / (1024 * 1024); // rough estimate
    const estimatedCost = estimatedMinutes * 0.006;
    
    await logUsage('transcription', estimatedCost, {
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      audio_size_bytes: audioSizeBytes,
      estimated_minutes: estimatedMinutes,
      text_length: result.text?.length || 0
    });

    return new Response(JSON.stringify({ 
      text: result.text,
      chunkIndex,
      totalChunks 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
