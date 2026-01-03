-- Add columns to track import source for reliable resume
ALTER TABLE public.teachings 
ADD COLUMN IF NOT EXISTS source_filename text,
ADD COLUMN IF NOT EXISTS import_batch_id uuid,
ADD COLUMN IF NOT EXISTS imported_via text;

-- Index for fast filename lookups during resume
CREATE INDEX IF NOT EXISTS idx_teachings_source_filename ON public.teachings(source_filename);

-- Index for batch queries
CREATE INDEX IF NOT EXISTS idx_teachings_import_batch_id ON public.teachings(import_batch_id);