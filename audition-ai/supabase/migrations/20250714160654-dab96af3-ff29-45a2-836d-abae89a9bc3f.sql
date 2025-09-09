
-- Add storage_file_path column to video_submissions table for file cleanup
ALTER TABLE public.video_submissions 
ADD COLUMN IF NOT EXISTS storage_file_path TEXT;

-- Add a comment to explain the purpose
COMMENT ON COLUMN public.video_submissions.storage_file_path IS 'Path to the video file in storage bucket for cleanup after analysis';
