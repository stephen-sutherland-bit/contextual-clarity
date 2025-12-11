-- Create table to track API usage and costs
CREATE TABLE public.api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  operation_type TEXT NOT NULL, -- 'transcription', 'processing', 'indexing'
  estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb, -- Store audio_duration_seconds, token_count, model, etc.
  description TEXT
);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Allow public read (admin page doesn't have auth)
CREATE POLICY "API usage is publicly readable" 
ON public.api_usage 
FOR SELECT 
USING (true);

-- Allow inserts from edge functions (service role)
CREATE POLICY "Allow inserts" 
ON public.api_usage 
FOR INSERT 
WITH CHECK (true);