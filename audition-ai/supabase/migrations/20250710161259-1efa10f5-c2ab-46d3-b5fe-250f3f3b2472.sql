-- Add casting director preferences and current projects fields to auditions table
ALTER TABLE public.auditions 
ADD COLUMN casting_director_preferences TEXT,
ADD COLUMN casting_director_current_projects TEXT;