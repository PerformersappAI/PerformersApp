-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Public can view profiles for public pages" ON public.profiles;

-- Create a more restrictive policy that only allows public access to non-sensitive profile fields
CREATE POLICY "Public can view safe profile fields only" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access to columns that should be publicly visible
  -- This policy will be used in conjunction with SELECT queries that only request safe columns
  true
);

-- However, the above approach still has issues. Let's remove it and use a better approach.
DROP POLICY IF EXISTS "Public can view safe profile fields only" ON public.profiles;

-- The safest approach is to remove all public access to the profiles table directly
-- and rely on the existing get_public_profile() function which already returns only safe columns
-- This function is SECURITY DEFINER so it bypasses RLS and only returns approved columns

-- Update the existing policy name for clarity
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Recreate user access policy with clearer name
CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Keep the existing insert/update policies as they are already secure
-- "Users can insert their own profile" - already properly restricted
-- "Users can update their own profile" - already properly restricted