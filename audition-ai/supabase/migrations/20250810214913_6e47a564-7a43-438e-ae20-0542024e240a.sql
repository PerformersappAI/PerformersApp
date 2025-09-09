-- Add actor_email to auditions for manual sending
ALTER TABLE public.auditions
ADD COLUMN IF NOT EXISTS actor_email text;