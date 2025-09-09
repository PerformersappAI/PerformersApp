-- Add scene_summary column to scripts table
ALTER TABLE public.scripts 
ADD COLUMN scene_summary TEXT;