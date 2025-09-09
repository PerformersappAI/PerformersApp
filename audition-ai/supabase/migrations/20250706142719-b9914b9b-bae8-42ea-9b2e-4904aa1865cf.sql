
-- Add the missing updated_at column to video_submissions table
ALTER TABLE public.video_submissions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create or replace the trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_video_submissions_updated_at ON public.video_submissions;
CREATE TRIGGER update_video_submissions_updated_at 
    BEFORE UPDATE ON public.video_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
