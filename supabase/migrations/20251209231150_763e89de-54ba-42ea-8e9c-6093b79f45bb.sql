-- Create teachings table to store processed bible study content
CREATE TABLE public.teachings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  primary_theme TEXT NOT NULL,
  secondary_themes TEXT[] DEFAULT '{}',
  scriptures TEXT[] DEFAULT '{}',
  doctrines TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  questions_answered TEXT[] DEFAULT '{}',
  quick_answer TEXT,
  full_content TEXT NOT NULL,
  reading_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teachings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (teachings are publicly viewable)
CREATE POLICY "Teachings are publicly readable" 
ON public.teachings 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_teachings_updated_at
BEFORE UPDATE ON public.teachings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for search
CREATE INDEX idx_teachings_keywords ON public.teachings USING GIN(keywords);
CREATE INDEX idx_teachings_scriptures ON public.teachings USING GIN(scriptures);
CREATE INDEX idx_teachings_questions ON public.teachings USING GIN(questions_answered);