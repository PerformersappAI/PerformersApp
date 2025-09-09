
import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import CoachContactForm from "@/components/coaches/CoachContactForm";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CoachDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [showContactForm, setShowContactForm] = useState(false);

  const { data: coach, isLoading, error } = useQuery({
    queryKey: ['coach', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No coach slug provided');
      
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (coach) {
      document.title = `${coach.name} - Book a Coach | MyAuditionAI`;
      
      const descContent = `Connect with ${coach.name} - ${coach.bio?.slice(0, 150) || 'Experienced coach'}`;
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = descContent;
    }
  }, [coach]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !coach) {
    return <Navigate to="/coaches" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link to="/coaches">
              <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to All Coaches
              </Button>
            </Link>
          </div>

          <div className="bg-gray-900 rounded-lg p-8">
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-shrink-0">
                {coach.photo_url ? (
                  <img
                    src={coach.photo_url}
                    alt={coach.name}
                    className="w-32 h-32 rounded-lg object-cover border-4 border-purple-400"
                    onError={(e) => {
                      console.warn(`Failed to load coach photo: ${coach.photo_url}`);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-32 h-32 rounded-lg bg-gray-800 border-4 border-purple-400 flex items-center justify-center text-purple-400 font-bold text-2xl ${coach.photo_url ? 'hidden' : ''}`}>
                  {coach.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {coach.name}
                </h1>
                
                {coach.bio && (
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {coach.bio}
                  </p>
                )}
              </div>
            </div>

            {coach.highlights.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">Experience & Highlights</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {coach.highlights.map((highlight, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="p-3 text-sm bg-gray-800 text-gray-300 justify-start text-left h-auto"
                    >
                      • {highlight}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              {showContactForm ? (
                <div>
                  <CoachContactForm 
                    coach={coach} 
                    onSuccess={() => setShowContactForm(false)}
                    onCancel={() => setShowContactForm(false)}
                  />
                </div>
              ) : (
                <Button 
                  onClick={() => setShowContactForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3"
                >
                  Contact {coach.name.split(' ')[0]}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoachDetail;
