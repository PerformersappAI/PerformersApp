-- Restrict public access to photographers sensitive data and add a safe public RPC

-- Drop existing public read policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'photographers' 
      AND policyname = 'Anyone can view active photographers'
  ) THEN
    DROP POLICY "Anyone can view active photographers" ON public.photographers;
  END IF;
END$$;

-- Allow only authenticated users to select from photographers directly
CREATE POLICY "Authenticated can view active photographers"
ON public.photographers
FOR SELECT
TO authenticated
USING (active = true);

-- Public-safe RPC that returns photographers WITHOUT email/phone
CREATE OR REPLACE FUNCTION public.get_public_photographers(limit_count integer DEFAULT 4)
RETURNS TABLE(
  id uuid,
  name text,
  business_name text,
  website text,
  instagram text,
  city text,
  state text,
  country text,
  specialties text[],
  price_range text,
  portfolio_url text,
  bio text,
  rating numeric,
  total_reviews integer,
  verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT
    p.id,
    p.name,
    p.business_name,
    p.website,
    p.instagram,
    p.city,
    p.state,
    p.country,
    p.specialties,
    p.price_range,
    p.portfolio_url,
    p.bio,
    p.rating,
    p.total_reviews,
    p.verified
  FROM public.photographers p
  WHERE p.active = true
  ORDER BY p.rating DESC NULLS LAST, p.created_at DESC
  LIMIT limit_count;
$$;

-- Permit anonymous and authenticated roles to execute the RPC
GRANT EXECUTE ON FUNCTION public.get_public_photographers(integer) TO anon, authenticated;