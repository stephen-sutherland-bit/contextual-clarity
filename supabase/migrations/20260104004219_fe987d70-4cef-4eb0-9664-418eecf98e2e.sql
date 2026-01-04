-- Create import_runs table to track batch import sessions
CREATE TABLE public.import_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_files INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'completed_with_errors', 'aborted'))
);

-- Create import_run_files table to track individual file status
CREATE TABLE public.import_run_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.import_runs(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'success', 'failed')),
  stage TEXT CHECK (stage IN ('parsing', 'metadata', 'cover', 'saving')),
  error_message TEXT,
  teaching_id UUID REFERENCES public.teachings(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_run_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_runs (same pattern as teachings - public read/write for now)
CREATE POLICY "Import runs are publicly readable" ON public.import_runs FOR SELECT USING (true);
CREATE POLICY "Allow import run inserts" ON public.import_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow import run updates" ON public.import_runs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow import run deletes" ON public.import_runs FOR DELETE USING (true);

-- RLS policies for import_run_files
CREATE POLICY "Import run files are publicly readable" ON public.import_run_files FOR SELECT USING (true);
CREATE POLICY "Allow import run file inserts" ON public.import_run_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow import run file updates" ON public.import_run_files FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow import run file deletes" ON public.import_run_files FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX idx_import_run_files_run_id ON public.import_run_files(run_id);
CREATE INDEX idx_import_run_files_status ON public.import_run_files(status);
CREATE INDEX idx_import_runs_created_at ON public.import_runs(created_at DESC);