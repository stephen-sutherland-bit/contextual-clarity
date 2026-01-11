-- Add pondered_questions JSONB column to store structured Q&A data
ALTER TABLE public.teachings 
ADD COLUMN pondered_questions JSONB DEFAULT '[]'::jsonb;