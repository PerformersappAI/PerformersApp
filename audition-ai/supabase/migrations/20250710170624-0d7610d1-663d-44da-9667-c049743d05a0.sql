-- Extend profiles table with actor profile fields
ALTER TABLE public.profiles 
ADD COLUMN bio TEXT,
ADD COLUMN headshot_url_1 TEXT,
ADD COLUMN headshot_url_2 TEXT, 
ADD COLUMN headshot_url_3 TEXT,
ADD COLUMN demo_video_url_1 TEXT,
ADD COLUMN demo_video_url_2 TEXT,
ADD COLUMN demo_video_title_1 TEXT,
ADD COLUMN demo_video_title_2 TEXT,
ADD COLUMN resume_pdf_url TEXT;

-- Create storage bucket for actor profiles
INSERT INTO storage.buckets (id, name, public) VALUES ('actor-profiles', 'actor-profiles', true);

-- Create storage policies for actor profile assets
CREATE POLICY "Users can view all actor profile assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'actor-profiles');

CREATE POLICY "Users can upload their own profile assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'actor-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'actor-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'actor-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);