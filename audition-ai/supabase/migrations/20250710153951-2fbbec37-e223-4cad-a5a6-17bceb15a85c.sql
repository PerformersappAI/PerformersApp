
-- Add cascade delete to coaching_sessions table for analysis references
ALTER TABLE public.coaching_sessions 
DROP CONSTRAINT IF EXISTS coaching_sessions_analysis_id_fkey;

ALTER TABLE public.coaching_sessions 
ADD CONSTRAINT coaching_sessions_analysis_id_fkey 
FOREIGN KEY (analysis_id) REFERENCES public.script_analyses(id) ON DELETE CASCADE;
