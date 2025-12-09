import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    
    // Determine file extension from mime type
    const extension = mimeType?.includes('mp3') ? 'mp3' 
      : mimeType?.includes('wav') ? 'wav'
      : mimeType?.includes('m4a') ? 'm4a'
      : mimeType?.includes('webm') ? 'webm'
      : mimeType?.includes('ogg') ? 'ogg'
      : mimeType?.includes('mp4') ? 'mp4'
      : 'mp3';

    // Prepare form data for Whisper API
    const formData = new FormData();
    const blob = new Blob([binaryAudio.buffer as ArrayBuffer], { type: mimeType || 'audio/mpeg' });
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
