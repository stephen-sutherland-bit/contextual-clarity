-- Add module field to teachings table for organizing teachings within phases
ALTER TABLE teachings ADD COLUMN module text;

-- Add module_order field for ordering within a module
ALTER TABLE teachings ADD COLUMN module_order integer;

-- Create index for efficient module queries
CREATE INDEX idx_teachings_module ON teachings(phase, module, module_order);