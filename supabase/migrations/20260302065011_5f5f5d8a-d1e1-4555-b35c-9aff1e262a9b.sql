
-- Create system_documents table for storing CCM outline and other system docs
CREATE TABLE public.system_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_key text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.system_documents ENABLE ROW LEVEL SECURITY;

-- Public read (edge functions need this)
CREATE POLICY "System documents are publicly readable"
  ON public.system_documents
  FOR SELECT
  USING (true);

-- Admin-only write
CREATE POLICY "Admins can insert system documents"
  ON public.system_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system documents"
  ON public.system_documents
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system documents"
  ON public.system_documents
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
