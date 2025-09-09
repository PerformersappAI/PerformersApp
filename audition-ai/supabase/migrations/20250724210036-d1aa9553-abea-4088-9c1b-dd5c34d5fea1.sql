
-- Create headshot_analyses table for storing headshot analysis results
CREATE TABLE IF NOT EXISTS public.headshot_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  headshot_type TEXT NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score INTEGER NOT NULL CHECK (technical_score >= 0 AND technical_score <= 100),
  professional_score INTEGER NOT NULL CHECK (professional_score >= 0 AND professional_score <= 100),
  industry_score INTEGER NOT NULL CHECK (industry_score >= 0 AND industry_score <= 100),
  detailed_feedback JSONB NOT NULL DEFAULT '{}',
  improvement_suggestions TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.headshot_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for headshot_analyses
CREATE POLICY "Users can view their own headshot analyses"
  ON public.headshot_analyses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own headshot analyses"
  ON public.headshot_analyses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own headshot analyses"
  ON public.headshot_analyses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own headshot analyses"
  ON public.headshot_analyses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE TRIGGER update_headshot_analyses_updated_at
  BEFORE UPDATE ON public.headshot_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
