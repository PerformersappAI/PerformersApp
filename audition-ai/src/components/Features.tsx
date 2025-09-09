
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Archive } from "lucide-react";

const Features = () => {
  const features = [
    {
      title: "Analyze Scene with AI Acting Coach",
      details: "Unlock authentic emotion & character depth.\nRefine performances with bold, honest choices.\nMaster scenes with timeless acting methods — grasp the scene, own it, & commit.\nNo reader needed — practice with your AI acting partner.\nBuild unshakable audition confidence to book the role.",
      bgColor: "from-blue-500/20 to-cyan-500/20",
      icon: FileText
    },
    {
      title: "Teleprompter Mode with AI Scene Partner",
      details: "Rehearse anytime with your AI partner.\nSharpen timing & delivery.\nMemorize lines faster with smart cues.\nEasily adapt to rhythms, emotions, and styles.",
      bgColor: "from-purple-500/20 to-pink-500/20",
      icon: MessageSquare
    },
    {
      title: "Smart Feedback, Stronger Auditions, Book the Gig.",
      details: "Consistent feedback to elevate your work.\nInstant self-tape feedback without waiting for a coach.\nHeadshot reviews based on industry standards.",
      bgColor: "from-orange-500/20 to-red-500/20",
      icon: Archive
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Professional Tools for{" "}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Professional Actors
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to prepare, perform, and perfect your craft
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-black/40 border-gray-700 hover:border-gray-600 transition-all duration-300 group">
              <CardHeader>
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${feature.bgColor} mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 whitespace-pre-line">{feature.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
