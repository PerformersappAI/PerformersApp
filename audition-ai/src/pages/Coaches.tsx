
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import CoachCard from "@/components/coaches/CoachCard";
import { Loader2 } from "lucide-react";

const Coaches = () => {

  useEffect(() => {
    document.title = "Book a Coach | MyAuditionAI";
    
    const descContent = "Connect with experienced voice-over and acting coaches for personalized training and guidance.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = descContent;

    const href = `${window.location.origin}/coaches`;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = href;
  }, []);

  const { data: coaches, isLoading, error } = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <p className="text-red-400">Error loading coaches. Please try again later.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Book a Coach
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Connect with experienced voice-over and acting coaches for personalized training and guidance.
            </p>
          </header>

          {/* Sean Kanan Spotlight Banner */}
          <div className="mb-16 text-center">
            <div className="inline-block hover:opacity-90 transition-opacity cursor-pointer">
              <img 
                src="/lovable-uploads/79296991-7232-4da1-add6-3f97dc1f6a84.png" 
                alt="Sean Kanan spotlight coach - Click to view available coaches"
                className="w-1/2 h-auto object-contain rounded-lg mx-auto"
                onClick={() => {
                  // Navigate to coaches page
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </div>

          {coaches && coaches.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {coaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No coaches available at the moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Coaches;
