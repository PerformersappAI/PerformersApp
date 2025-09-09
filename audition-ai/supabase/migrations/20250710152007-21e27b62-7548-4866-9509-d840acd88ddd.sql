-- Add contact information fields to the auditions table
ALTER TABLE public.auditions 
ADD COLUMN contact_email TEXT,
ADD COLUMN contact_phone TEXT,
ADD COLUMN contact_website TEXT;