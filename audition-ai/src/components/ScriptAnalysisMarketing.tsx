
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Brain, Target, FileText } from 'lucide-react';

interface ScriptAnalysisMarketingProps {
  onStartAnalysisClick: () => void;
}

const ScriptAnalysisMarketing: React.FC<ScriptAnalysisMarketingProps> = ({ onStartAnalysisClick }) => {
  const analysisFeatures = [
    {
      icon: Upload,
      title: "Upload Your Script",
      description: "Easily upload scripts in PDF or text format for analysis"
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced AI breaks down character motivations and scene objectives"
    },
    {
      icon: Target,
      title: "Character Objectives",
      description: "Identify clear objectives, obstacles, and tactics for each scene"
    },
    {
      icon: FileText,
      title: "Detailed Reports",
      description: "Get comprehensive breakdowns with actionable insights"
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Scene{" "}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Analysis
          </span>
        </h1>
        <p className="text-xl text-marketing-text-dark max-w-3xl mx-auto mb-8">
          Transform your scene study with AI-powered analysis that reveals character depths, 
          scene objectives, and performance insights you might have missed.
        </p>
        <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg" onClick={onStartAnalysisClick}>
          Start Analysis
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {analysisFeatures.map((feature, index) => (
          <Card key={index} className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
            <CardHeader className="text-center">
              <feature.icon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-marketing-text-dark text-center">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center bg-marketing-cta-bg rounded-lg p-12">
        <h2 className="text-3xl font-bold mb-4 text-marketing-text-dark">Ready to Analyze Your Next Scene?</h2>
        <p className="text-marketing-text-dark mb-6 text-lg">
          Join thousands of actors who've improved their performances with our analysis tools.
        </p>
        <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg" onClick={onStartAnalysisClick}>
          Get Started Now
        </Button>
      </div>
    </>
  );
};

export default ScriptAnalysisMarketing;
