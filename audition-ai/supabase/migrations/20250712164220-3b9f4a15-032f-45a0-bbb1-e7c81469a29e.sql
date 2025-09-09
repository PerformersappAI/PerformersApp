-- Add professional contact fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN manager_name TEXT,
ADD COLUMN manager_phone TEXT,
ADD COLUMN manager_email TEXT,
ADD COLUMN agent_commercial_name TEXT,
ADD COLUMN agent_commercial_phone TEXT,
ADD COLUMN agent_commercial_email TEXT,
ADD COLUMN agent_theatrical_name TEXT,
ADD COLUMN agent_theatrical_phone TEXT,
ADD COLUMN agent_theatrical_email TEXT,
ADD COLUMN agency_url TEXT,
ADD COLUMN talent_phone TEXT,
ADD COLUMN talent_email TEXT,
ADD COLUMN instagram_url TEXT,
ADD COLUMN website_url TEXT,
ADD COLUMN imdb_url TEXT;