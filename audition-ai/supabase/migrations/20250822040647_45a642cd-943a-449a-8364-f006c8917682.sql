-- Add public read access to profiles table for public profile pages
CREATE POLICY "Public can view profiles for public pages" 
ON public.profiles 
FOR SELECT 
USING (true);