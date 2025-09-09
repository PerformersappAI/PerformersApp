
-- Add video upload and evaluation functionality to the database

-- First, ensure we have a storage bucket for videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can upload their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- Create storage policies for video uploads
CREATE POLICY "Users can upload their own videos" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'videos' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can view their own videos" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'videos' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

CREATE POLICY "Users can delete their own videos" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'videos' 
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Update the existing video_submissions table structure
ALTER TABLE public.video_submissions 
ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS evaluation_score INTEGER,
ADD COLUMN IF NOT EXISTS evaluation_notes TEXT,
ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evaluated_by UUID REFERENCES auth.users(id);

-- Add constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_submissions_evaluation_status_check') THEN
        ALTER TABLE public.video_submissions 
        ADD CONSTRAINT video_submissions_evaluation_status_check 
        CHECK (evaluation_status IN ('pending', 'in_progress', 'completed', 'rejected'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_submissions_evaluation_score_check') THEN
        ALTER TABLE public.video_submissions 
        ADD CONSTRAINT video_submissions_evaluation_score_check 
        CHECK (evaluation_score >= 0 AND evaluation_score <= 100);
    END IF;
END $$;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_video_submissions_user_id ON public.video_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_submissions_evaluation_status ON public.video_submissions(evaluation_status);
CREATE INDEX IF NOT EXISTS idx_video_submissions_created_at ON public.video_submissions(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger to ensure it works
DROP TRIGGER IF EXISTS update_video_submissions_updated_at ON public.video_submissions;
CREATE TRIGGER update_video_submissions_updated_at 
    BEFORE UPDATE ON public.video_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
