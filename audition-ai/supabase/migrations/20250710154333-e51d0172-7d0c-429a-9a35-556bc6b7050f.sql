
-- Add cascade delete to video_submissions table for coaching session references
ALTER TABLE public.video_submissions 
DROP CONSTRAINT IF EXISTS video_submissions_coaching_session_id_fkey;

ALTER TABLE public.video_submissions 
ADD CONSTRAINT video_submissions_coaching_session_id_fkey 
FOREIGN KEY (coaching_session_id) REFERENCES public.coaching_sessions(id) ON DELETE CASCADE;
