-- Add cascade delete to script_analyses table
ALTER TABLE public.script_analyses 
DROP CONSTRAINT IF EXISTS script_analyses_script_id_fkey;

ALTER TABLE public.script_analyses 
ADD CONSTRAINT script_analyses_script_id_fkey 
FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE CASCADE;

-- Add cascade delete to auditions table for script references
ALTER TABLE public.auditions 
DROP CONSTRAINT IF EXISTS auditions_script_id_fkey;

ALTER TABLE public.auditions 
ADD CONSTRAINT auditions_script_id_fkey 
FOREIGN KEY (script_id) REFERENCES public.scripts(id) ON DELETE SET NULL;