import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Video, BookOpen, Users, Star, Lock, Crown } from "lucide-react";

const ActorsApproach = () => {
  const handleExploreToolbox = () => {
    window.open('https://actorsapproach.com/toolbox-overview', '_blank');
  };

  const handleVisitWebsite = () => {
    window.open('https://actorsapproach.com/', '_blank');
  };

  const features = [
    {
      icon: Video,
      title: "Over 375 Videos",
      description: "Comprehensive video library covering all aspects of acting craft and technique"
    },
    {
      icon: BookOpen,
      title: "Dozens of Concepts & Exercises",
      description: "Proven techniques and exercises from legendary acting masters"
    },
    {
      icon: Crown,
      title: "Lifetime Membership Access",
      description: "One-time payment for unlimited access to all current and future content"
    },
    {
      icon: Star,
      title: "Master Class Techniques",
      description: "Learn from methods by Stanislavski, Chekhov, Meisner, Strasberg, Adler, and more"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      {/* Logo in top left */}
      <div className="absolute top-20 left-4 sm:left-8 z-10">
        <img 
          src="/lovable-uploads/b9bdda75-e907-4a86-b23d-2f65c9803093.png" 
          alt="Actors Approach Craft Technique Toolbox Logo"
          className="h-16 sm:h-20 w-auto"
        />
      </div>

      {/* Hero Section with Banner */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-[70vh] flex items-center">
        {/* Banner Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/lovable-uploads/0d96f738-f960-4079-bed3-5de26fbb12f7.png"
            alt="Actors Approach Banner"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <Badge className="mb-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              The Actor's Approach Toolbox
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg">
              Explore Uncharted Territories of Creativity and Elevate Your Acting Career!
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-4xl mx-auto leading-relaxed drop-shadow-md">
              Crafting characters with the greats, the Actor's Approach Toolbox is packed with craft, technique and exercises used by the likes of Stanislavski, Chekhov, Meisner, Strasberg, Adler, Hagen, Morris and others. This essential toolbox is your guide to mastering the art and craft of acting.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              onClick={handleExploreToolbox}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Explore The Toolbox Now
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="bg-transparent border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-colors"
              onClick={handleVisitWebsite}
            >
              Visit Actors Approach Website
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            What's Inside The Toolbox
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-black/50 border-gray-800 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
                <CardHeader className="text-center">
                  <feature.icon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                  <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-center">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Jared Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            The Actors Approach with Jared
          </h2>
          
          <div className="bg-gray-900/50 rounded-lg p-8 border border-gray-800">
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              Jared has created an incredible comprehensive program that brings together the most effective acting techniques and exercises from legendary masters. The Actor's Approach Toolbox represents years of research, training, and practical application of proven methods that have shaped some of the greatest actors in history.
            </p>
            
            <p className="text-lg text-gray-300 mb-6 leading-relaxed">
              This extensive library contains over 45 hours of craft, technique, and training content, making it an invaluable resource for actors at any stage of their career. From foundational exercises to advanced character development techniques, the toolbox provides a structured path to mastering the art of acting.
            </p>
          </div>
        </div>
      </section>

      {/* Members Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-black/70 rounded-lg p-8 border border-yellow-500/30">
            <Lock className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Exclusive Access for Actors AI Members
            </h2>
            
            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
              As a member of the Actors AI app, you're eligible to receive special access to this amazing program that Jared has created. This exclusive benefit provides you with a username and password to unlock the full potential of The Actor's Approach Toolbox.
            </p>
            
            <div className="bg-yellow-500/10 rounded-lg p-6 border border-yellow-500/30 mb-8">
              <h3 className="text-2xl font-semibold text-yellow-400 mb-4">How to Get Access:</h3>
              <ul className="text-left text-gray-300 space-y-2 max-w-2xl mx-auto">
                <li>• Maintain your active Actors AI membership</li>
                <li>• Contact our support team to request your credentials</li>
                <li>• Receive your personal username and password</li>
                <li>• Start exploring 375+ videos and techniques immediately</li>
              </ul>
            </div>
            
            <p className="text-lg text-gray-400 mb-8">
              This exclusive partnership between Actors AI and The Actor's Approach ensures our members have access to the most comprehensive acting training resources available.
            </p>
            
            <Button 
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              onClick={() => window.open('/contact', '_self')}
            >
              Contact Us for Access
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ActorsApproach;