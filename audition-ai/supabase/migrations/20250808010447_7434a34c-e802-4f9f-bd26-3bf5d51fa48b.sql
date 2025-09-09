-- Add unique constraint for user_id and title combination to support upserts
ALTER TABLE public.scripts 
ADD CONSTRAINT scripts_user_id_title_unique UNIQUE (user_id, title);