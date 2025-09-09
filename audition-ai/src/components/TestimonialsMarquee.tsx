import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  name: string;
  title?: string;
  company?: string;
  content: string;
  avatar_url?: string;
  rating: number;
  display_order: number;
}

interface TestimonialsMarqueeProps {
  headline?: string;
  description?: string;
  variant?: 'default' | 'launchDark';
}

const TestimonialsMarquee: React.FC<TestimonialsMarqueeProps> = ({
  headline = "What Our Actors Say",
  description = "Join thousands of actors who have transformed their craft with our platform",
  variant = 'default'
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setTestimonials(data || []);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const sectionBg = variant === 'launchDark' ? 'bg-[hsl(215_25%_4%)]' : 'bg-background';
  const cardBg = variant === 'launchDark' ? 'bg-[hsl(215_20%_7%)]' : 'bg-card';
  const textColor = variant === 'launchDark' ? 'text-slate-200' : 'text-foreground';
  const mutedTextColor = variant === 'launchDark' ? 'text-slate-400' : 'text-muted-foreground';
  const borderColor = variant === 'launchDark' ? 'border-slate-700/50' : 'border-border';

  if (loading) {
    return (
      <section className={`py-20 ${sectionBg}`}>
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="h-8 bg-muted animate-pulse rounded mb-4"></div>
            <div className="h-4 bg-muted animate-pulse rounded max-w-2xl mx-auto"></div>
          </div>
          <div className="flex gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-80 h-40 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  // Duplicate testimonials for seamless infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <div className={`min-w-80 ${cardBg} border ${borderColor} rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center mb-4">
        {testimonial.avatar_url ? (
          <img 
            src={testimonial.avatar_url} 
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover mr-4"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
            <span className="text-primary font-semibold text-lg">
              {testimonial.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h4 className={`font-semibold ${textColor}`}>{testimonial.name}</h4>
          {testimonial.title && (
            <p className={`text-sm ${mutedTextColor}`}>
              {testimonial.title}
              {testimonial.company && ` at ${testimonial.company}`}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < testimonial.rating 
                ? 'text-yellow-400 fill-current' 
                : mutedTextColor
            }`}
          />
        ))}
      </div>
      
      <p className={`${mutedTextColor} leading-relaxed`}>{testimonial.content}</p>
    </div>
  );

  const gradientFrom = variant === 'launchDark' ? 'from-[hsl(215_25%_4%)]' : 'from-background';
  const gradientTo = variant === 'launchDark' ? 'to-[hsl(215_25%_4%)]' : 'to-background';

  return (
    <section className={`py-20 ${sectionBg} overflow-hidden`}>
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-4xl font-bold ${textColor} mb-4`}>
            {headline}
          </h2>
          <p className={`text-lg ${mutedTextColor} max-w-2xl mx-auto`}>
            {description}
          </p>
        </div>

        <div className="relative">
          {/* Gradient fade edges */}
          <div className={`absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r ${gradientFrom} to-transparent z-10 pointer-events-none`}></div>
          <div className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l ${gradientTo} to-transparent z-10 pointer-events-none`}></div>
          
          {/* Marquee container */}
          <div className="overflow-hidden">
            <div 
              className="flex gap-6 hover:pause-marquee"
              style={{
                width: `${duplicatedTestimonials.length * 20}rem`,
                animation: 'marquee 60s linear infinite'
              }}
            >
              {duplicatedTestimonials.map((testimonial, index) => (
                <TestimonialCard 
                  key={`${testimonial.id}-${index}`} 
                  testimonial={testimonial}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          
          .hover\\:pause-marquee:hover {
            animation-play-state: paused;
          }
        `}
      </style>
    </section>
  );
};

export default TestimonialsMarquee;