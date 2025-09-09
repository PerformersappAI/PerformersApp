-- Create headshot knowledge base table
CREATE TABLE public.headshot_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('theatrical', 'commercial', 'general')),
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.headshot_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view active knowledge" 
ON public.headshot_knowledge 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage knowledge" 
ON public.headshot_knowledge 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_headshot_knowledge_updated_at
BEFORE UPDATE ON public.headshot_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial knowledge base content
INSERT INTO public.headshot_knowledge (category, topic, content, keywords) VALUES
('theatrical', 'Lighting Standards', 'Theatrical headshots require soft, natural lighting that reveals authentic emotions. Avoid harsh shadows or overly bright lighting. The goal is to show the actor''s ability to convey depth and vulnerability.', ARRAY['lighting', 'natural', 'soft', 'shadows', 'authentic']),
('theatrical', 'Expression Guidelines', 'Theatrical expressions should be subtle and contemplative. Avoid big smiles or overly dramatic expressions. The focus is on showing intelligence, depth, and emotional range through the eyes.', ARRAY['expression', 'subtle', 'contemplative', 'eyes', 'emotional range']),
('theatrical', 'Wardrobe Requirements', 'Theatrical wardrobe should be simple, timeless, and non-distracting. Solid colors work best, avoiding busy patterns, logos, or trendy pieces that date the photo.', ARRAY['wardrobe', 'simple', 'timeless', 'solid colors', 'no patterns']),
('commercial', 'Lighting Standards', 'Commercial headshots benefit from bright, even lighting that creates an approachable, friendly appearance. The lighting should be flattering and energetic.', ARRAY['lighting', 'bright', 'even', 'approachable', 'energetic']),
('commercial', 'Expression Guidelines', 'Commercial expressions should be warm, friendly, and inviting. A genuine smile is often preferred, showing the actor as someone people would want to buy from or be around.', ARRAY['expression', 'warm', 'friendly', 'smile', 'genuine', 'inviting']),
('commercial', 'Wardrobe Requirements', 'Commercial wardrobe should reflect current trends and the types of roles the actor would book. Colors should be vibrant and flattering, representing the actor''s commercial type.', ARRAY['wardrobe', 'trendy', 'vibrant', 'commercial type', 'current']),
('general', 'Technical Quality', 'All headshots must be high resolution (minimum 300 DPI), properly exposed, and professionally retouched without over-editing. The focus should be tack sharp on the eyes.', ARRAY['resolution', 'DPI', 'focus', 'eyes', 'retouching']),
('general', 'Cropping Standards', 'Headshots should typically be cropped from mid-chest up, with the actor''s eyes positioned in the upper third of the frame following the rule of thirds.', ARRAY['cropping', 'mid-chest', 'rule of thirds', 'eyes', 'framing']),
('general', 'Background Requirements', 'Backgrounds should be simple and non-distracting, typically neutral colors that complement the actor''s skin tone and wardrobe without competing for attention.', ARRAY['background', 'simple', 'neutral', 'non-distracting', 'complementary']);