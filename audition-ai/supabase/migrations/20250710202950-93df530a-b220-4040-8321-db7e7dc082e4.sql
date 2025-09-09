-- Allow public access to view profiles for public profile pages
CREATE POLICY "Anyone can view public profiles" 
ON public.profiles 
FOR SELECT 
USING (true);