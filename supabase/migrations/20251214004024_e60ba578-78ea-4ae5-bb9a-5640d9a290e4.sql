-- Add cover_image column to teachings table for storing AI-generated covers
ALTER TABLE public.teachings ADD COLUMN cover_image TEXT;