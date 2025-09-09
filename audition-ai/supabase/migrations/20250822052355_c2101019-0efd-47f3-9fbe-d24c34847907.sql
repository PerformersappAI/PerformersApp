-- Create photographers table for headshot recommendations
CREATE TABLE public.photographers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  business_name text,
  email text NOT NULL,
  phone text,
  website text,
  instagram text,
  city text NOT NULL,
  state text NOT NULL,
  country text NOT NULL DEFAULT 'United States',
  specialties text[] DEFAULT '{}',
  price_range text,
  portfolio_url text,
  bio text,
  rating numeric(3,2) CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0,
  verified boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.photographers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active photographers" 
ON public.photographers 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage photographers" 
ON public.photographers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_photographers_updated_at
BEFORE UPDATE ON public.photographers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample photographers
INSERT INTO public.photographers (name, business_name, email, phone, city, state, specialties, price_range, bio, rating, total_reviews, verified) VALUES 
('Sarah Chen', 'Chen Photography Studio', 'sarah@chenphotography.com', '(555) 123-4567', 'Los Angeles', 'CA', ARRAY['headshots', 'theatrical', 'commercial'], '$300-500', 'Specializing in actor headshots with 8+ years experience in LA entertainment industry.', 4.8, 127, true),
('Michael Rodriguez', 'MR Headshot Studios', 'mike@mrheadshots.com', '(555) 234-5678', 'New York', 'NY', ARRAY['headshots', 'corporate', 'commercial'], '$400-600', 'Award-winning headshot photographer serving NYC actors and professionals.', 4.9, 89, true),
('Jessica Park', 'Park Portrait Studio', 'jessica@parkportraits.com', '(555) 345-6789', 'Atlanta', 'GA', ARRAY['headshots', 'theatrical', 'fashion'], '$250-400', 'Creative headshot photographer with a focus on authentic, natural expressions.', 4.7, 156, true),
('David Thompson', 'Thompson Headshots', 'david@thompsonheadshots.com', '(555) 456-7890', 'Chicago', 'IL', ARRAY['headshots', 'commercial', 'corporate'], '$350-550', 'Professional headshot photographer with clients in film, TV, and theatre.', 4.8, 203, true);