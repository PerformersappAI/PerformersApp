-- Fix RLS policy for script updates to allow soft deletes
-- Drop existing user update policy and recreate with proper WITH CHECK
DROP POLICY IF EXISTS "Users can update their own scripts" ON public.scripts;

-- Create new policy that properly handles soft deletes
CREATE POLICY "Users can update their own scripts" 
ON public.scripts 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure the policy allows setting deleted_at field
-- The WITH CHECK clause ensures the updated row still belongs to the user