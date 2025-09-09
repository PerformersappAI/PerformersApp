-- Create testimonials table for marquee display
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  content TEXT NOT NULL,
  avatar_url TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Public can view active testimonials
CREATE POLICY "Public can view active testimonials" 
ON public.testimonials 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all testimonials
CREATE POLICY "Admins can manage testimonials" 
ON public.testimonials 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample testimonials
INSERT INTO public.testimonials (name, title, company, content, rating, display_order) VALUES
('Sarah Johnson', 'Lead Actor', 'Broadway Productions', 'This platform revolutionized my audition prep. The AI coaching gave me insights I never had before.', 5, 1),
('Michael Chen', 'Voice Actor', 'DreamWorks Animation', 'The teleprompter feature is incredible. It made my self-taping so much more professional.', 5, 2),
('Emma Rodriguez', 'Theater Director', 'Lincoln Center', 'I recommend this to all my actors. The script analysis is spot-on and saves hours of prep time.', 5, 3),
('David Thompson', 'Casting Director', 'Warner Bros', 'Actors who use this platform come more prepared. It shows in their performances.', 5, 4),
('Lisa Park', 'Acting Coach', 'Stella Adler Studio', 'The methodology breakdown is exactly what actors need. It bridges theory and practice beautifully.', 5, 5),
('James Wilson', 'Film Actor', 'Independent Films', 'Finally, a tool that understands what actors actually need. Game-changer for self-tapes.', 5, 6);