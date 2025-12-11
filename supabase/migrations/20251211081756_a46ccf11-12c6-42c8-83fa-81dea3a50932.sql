-- Add phase column to teachings table for the 5-tier learning system
ALTER TABLE public.teachings ADD COLUMN phase text NOT NULL DEFAULT 'foundations';

-- Add constraint for valid phase values
ALTER TABLE public.teachings ADD CONSTRAINT valid_phase CHECK (
  phase IN ('foundations', 'essentials', 'building-blocks', 'moving-on', 'advanced')
);

-- Add index for filtering by phase
CREATE INDEX idx_teachings_phase ON public.teachings(phase);