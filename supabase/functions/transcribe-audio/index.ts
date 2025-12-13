import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const assemblyAIKey = Deno.env.get('ASSEMBLYAI_API_KEY');
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
      description: `AssemblyAI transcription (2x speed)`
    });
  } catch (e) {
    console.error('Failed to log usage:', e);
  }
}

// Speed up audio 2x using FFmpeg WASM
async function speedUpAudio(audioData: Uint8Array, inputFormat: string): Promise<Uint8Array> {
  console.log(`Speeding up audio 2x, input size: ${audioData.length} bytes, format: ${inputFormat}`);
  
  try {
    // Dynamic import of FFmpeg WASM for Deno
    const { FFmpeg } = await import("https://esm.sh/@ffmpeg/ffmpeg@0.12.10");
    const { fetchFile } = await import("https://esm.sh/@ffmpeg/util@0.12.1");
    
    const ffmpeg = new FFmpeg();
    
    // Load FFmpeg core
    await ffmpeg.load({
      coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
      wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
    });
    
    const inputFileName = `input.${inputFormat}`;
    const outputFileName = 'output.mp3';
    
    // Write input file to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputFileName, audioData);
    
    // Speed up audio 2x using atempo filter (maintains pitch)
    // Output as MP3 for broad compatibility
    await ffmpeg.exec([
      '-i', inputFileName,
      '-filter:a', 'atempo=2.0',
      '-vn', // No video
      '-acodec', 'libmp3lame',
      '-b:a', '128k',
      outputFileName
    ]);
    
    // Read the output file
    const outputData = await ffmpeg.readFile(outputFileName);
    
    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
    
    console.log(`Audio sped up successfully, output size: ${outputData.length} bytes`);
    
    return outputData as Uint8Array;
  } catch (error) {
    console.error('FFmpeg processing failed:', error);
    throw new Error(`Failed to speed up audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Upload audio to AssemblyAI
async function uploadToAssemblyAI(audioData: Uint8Array): Promise<string> {
  console.log(`Uploading ${audioData.length} bytes to AssemblyAI...`);
  
  // Create a new ArrayBuffer copy for fetch body compatibility
  const buffer = new ArrayBuffer(audioData.length);
  new Uint8Array(buffer).set(audioData);
  
  const response = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'authorization': assemblyAIKey!,
      'content-type': 'application/octet-stream',
    },
    body: buffer,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('AssemblyAI upload error:', response.status, errorText);
    throw new Error(`Upload failed: ${errorText}`);
  }
  
  const result = await response.json();
  console.log(`Upload successful, URL: ${result.upload_url}`);
  return result.upload_url;
}

// Request transcription from AssemblyAI
async function requestTranscription(audioUrl: string): Promise<string> {
  console.log('Requesting transcription from AssemblyAI...');
  
  const response = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': assemblyAIKey!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true, // Enable speaker diarization
      language_code: 'en',
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('AssemblyAI transcription request error:', response.status, errorText);
    throw new Error(`Transcription request failed: ${errorText}`);
  }
  
  const result = await response.json();
  console.log(`Transcription requested, ID: ${result.id}`);
  return result.id;
}

// Poll for transcription completion
async function pollForCompletion(transcriptId: string): Promise<{ text: string; utterances?: Array<{ speaker: string; text: string }> }> {
  console.log(`Polling for transcription ${transcriptId}...`);
  
  const maxAttempts = 120; // 10 minutes max (5 second intervals)
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'authorization': assemblyAIKey!,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Polling failed: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'completed') {
      console.log(`Transcription completed, text length: ${result.text?.length || 0}`);
      return {
        text: result.text,
        utterances: result.utterances,
      };
    } else if (result.status === 'error') {
      throw new Error(`Transcription failed: ${result.error}`);
    }
    
    console.log(`Status: ${result.status}, waiting 5 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
  
  throw new Error('Transcription timed out after 10 minutes');
}

// Format transcript with speaker labels
function formatTranscriptWithSpeakers(utterances: Array<{ speaker: string; text: string }> | undefined, plainText: string): string {
  if (!utterances || utterances.length === 0) {
    return plainText;
  }
  
  // Group consecutive utterances by speaker
  let formatted = '';
  let currentSpeaker = '';
  
  for (const utterance of utterances) {
    if (utterance.speaker !== currentSpeaker) {
      if (formatted) formatted += '\n\n';
      formatted += `[Speaker ${utterance.speaker}]: `;
      currentSpeaker = utterance.speaker;
    } else {
      formatted += ' ';
    }
    formatted += utterance.text;
  }
  
  return formatted;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!assemblyAIKey) {
      return new Response(JSON.stringify({ error: 'AssemblyAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { audio, mimeType } = await req.json();

    if (!audio) {
      return new Response(JSON.stringify({ error: 'No audio data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing audio, mimeType: ${mimeType}`);

    // Convert base64 to binary
    const binaryAudio = base64ToUint8Array(audio);
    const originalSizeBytes = binaryAudio.length;
    console.log(`Original audio size: ${originalSizeBytes} bytes`);
    
    // Determine input format for FFmpeg
    let inputFormat = 'mp3';
    if (mimeType?.includes('mp3') || mimeType?.includes('mpeg')) {
      inputFormat = 'mp3';
    } else if (mimeType?.includes('wav')) {
      inputFormat = 'wav';
    } else if (mimeType?.includes('m4a') || mimeType?.includes('mp4')) {
      inputFormat = 'm4a';
    } else if (mimeType?.includes('webm')) {
      inputFormat = 'webm';
    } else if (mimeType?.includes('ogg')) {
      inputFormat = 'ogg';
    } else if (mimeType?.includes('flac')) {
      inputFormat = 'flac';
    }

    // Speed up audio 2x to reduce transcription cost
    const speedUpAudioData = await speedUpAudio(binaryAudio, inputFormat);
    
    // Upload sped-up audio to AssemblyAI
    const uploadUrl = await uploadToAssemblyAI(speedUpAudioData);
    
    // Request transcription with speaker diarization
    const transcriptId = await requestTranscription(uploadUrl);
    
    // Poll for completion
    const result = await pollForCompletion(transcriptId);
    
    // Format transcript with speaker labels if available
    const formattedText = formatTranscriptWithSpeakers(result.utterances, result.text);
    
    // Estimate cost: AssemblyAI is ~$0.37/hour
    // Since we sped up 2x, actual audio duration is half the original
    // Rough estimate: 1MB per minute of original audio
    const estimatedOriginalMinutes = originalSizeBytes / (1024 * 1024);
    const billedMinutes = estimatedOriginalMinutes / 2; // Half due to 2x speed
    const estimatedCost = (billedMinutes / 60) * 0.37;
    
    await logUsage('transcription', estimatedCost, {
      original_size_bytes: originalSizeBytes,
      sped_up_size_bytes: speedUpAudioData.length,
      estimated_original_minutes: estimatedOriginalMinutes,
      billed_minutes: billedMinutes,
      text_length: formattedText.length,
      has_speaker_labels: !!result.utterances,
      speed_multiplier: 2
    });

    console.log(`Transcription complete, cost estimate: $${estimatedCost.toFixed(4)}`);

    return new Response(JSON.stringify({ 
      text: formattedText,
      hasSpeakerLabels: !!result.utterances
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
