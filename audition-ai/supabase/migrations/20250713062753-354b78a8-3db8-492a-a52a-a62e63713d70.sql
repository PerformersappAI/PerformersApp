-- Create trial_signups table
CREATE TABLE public.trial_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'
);

-- Enable Row Level Security
ALTER TABLE public.trial_signups ENABLE ROW LEVEL SECURITY;

-- Create policies for trial signups
CREATE POLICY "Anyone can create trial signups" 
ON public.trial_signups 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all trial signups" 
ON public.trial_signups 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_trial_signups_updated_at
BEFORE UPDATE ON public.trial_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();