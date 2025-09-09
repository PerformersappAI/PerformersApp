-- Fix security vulnerability: Restrict trial_signups SELECT access to admins only
-- Currently anyone can read customer email addresses and names from trial_signups table

-- Drop the current overly permissive SELECT policy
DROP POLICY IF EXISTS "Admins can view all trial signups" ON public.trial_signups;

-- Create a properly restricted SELECT policy that only allows admins
CREATE POLICY "Only admins can view trial signups" 
ON public.trial_signups 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Verify the INSERT policy is still secure (allows anyone to create trial signups)
-- This is intentional as we want public trial signup functionality