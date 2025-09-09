
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Users, Clock, Target, Film, Lightbulb } from "lucide-react";
import HeadshotGrader from "@/components/HeadshotGrader";

const SelfTaping = () => {
  const handleWatchVideo = () => {
    // Scroll to video section
    const videoElement = document.getElementById('self-taping-video');
    videoElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const techniques = [
    {
      icon: Film,
      title: "Camera Setup",
      description: "Learn optimal camera positioning and lighting for professional-looking self-tapes"
    },
    {
      icon: Target,
      title: "Focus & Framing",
      description: "Master the art of proper framing and maintaining focus throughout your performance"
    },
    {
      icon: Clock,
      title: "Timing & Pacing",
      description: "Perfect your timing and understand how to pace your performance for maximum impact"
    },
    {
      icon: Lightbulb,
      title: "Performance Tips",
      description: "Discover advanced techniques to elevate your self-tape performances"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Master the Art of{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Self Taping
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Learn professional self-taping techniques from industry expert Will Roberts. 
              Transform your audition process and book more roles with proven methods.
            </p>
          </div>

          {/* Featured Video Section */}
          <div className="mb-16">
            <Card className="bg-gray-900/50 border-gray-700 overflow-hidden">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  Will Roberts' Self-Taping Methodology
                </CardTitle>
                <p className="text-gray-400 text-lg">
                  Industry secrets revealed in this comprehensive guide
                </p>
              </CardHeader>
              <CardContent className="p-8">
                {/* YouTube Video Embed */}
                <div 
                  id="self-taping-video"
                  className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden mb-6"
                >
                  <iframe
                    src="https://www.youtube.com/embed/5PtfVF8XXHw?rel=0&modestbranding=1&controls=1"
                    title="Will Roberts' Self-Taping Methodology"
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                
                <div className="text-center">
                  <Button 
                    onClick={handleWatchVideo}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Techniques Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">
              Self-Taping{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Techniques
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {techniques.map((technique, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors text-center">
                  <CardHeader>
                    <technique.icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <CardTitle className="text-white text-lg">{technique.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{technique.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Headshot Grading Tool Section */}
          <div id="headshot-grader" className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                AI Headshot{" "}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Grading Tool
                </span>
              </h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Get professional feedback on your headshots with our AI-powered grading system. 
                Receive detailed analysis on technical quality, professional standards, and industry expectations.
              </p>
            </div>
            <HeadshotGrader />
          </div>

          {/* Additional Resources Section */}
          <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">More Resources Coming Soon</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              We're continuously expanding our self-taping resources. Stay tuned for additional 
              tutorials, downloadable guides, and interactive workshops to perfect your craft.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
                <Users className="w-4 h-4 mr-2" />
                Join Community
              </Button>
              <Button className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">
                <Film className="w-4 h-4 mr-2" />
                Download Guide
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfTaping;
