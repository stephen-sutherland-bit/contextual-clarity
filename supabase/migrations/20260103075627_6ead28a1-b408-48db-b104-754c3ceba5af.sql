-- Add index on reading_order for faster ordering
CREATE INDEX IF NOT EXISTS idx_teachings_reading_order ON public.teachings (reading_order NULLS LAST);

-- Add composite index for phase + reading_order (used in phase filtering)
CREATE INDEX IF NOT EXISTS idx_teachings_phase_reading_order ON public.teachings (phase, reading_order NULLS LAST);

-- Add index on created_at for fallback ordering
CREATE INDEX IF NOT EXISTS idx_teachings_created_at ON public.teachings (created_at DESC);