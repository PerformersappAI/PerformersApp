import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Video, Mic, Bot, Star, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FAQSection from "@/components/FAQSection";

const About = () => {
  const navigate = useNavigate();

  const handleBringToSchool = () => {
    navigate('/contact', { 
      state: { 
        subject: 'Bring ACTORS AI to My School',
        message: 'I am interested in bringing the ACTORS AI: ACTORS INTELLIGENCE course to my school/studio. Please contact me with more information about scheduling and pricing.'
      } 
    });
  };

  const handleContactForSession = () => {
    navigate('/contact', { 
      state: { 
        subject: 'Book ACTORS AI Session',
        message: 'I would like to book a session or learn more about the ACTORS AI: ACTORS INTELLIGENCE course. Please provide me with available dates and details.'
      } 
    });
  };
  const courseSections = [
    {
      number: "01",
      title: "Philosophy of Acting",
      icon: Users,
      points: [
        'Understanding "being" vs. "acting"',
        "Replacing performance anxiety with authentic presence",
        "Scene study as a path to emotional truth",
        "How to make personal, original choices in every audition"
      ]
    },
    {
      number: "02", 
      title: "Self-Taping Mastery",
      icon: Video,
      points: [
        "Commercial vs. Theatrical taping technique",
        "Camera and lighting setup (2025 gear recommendations)",
        "Eyeline and framing do's and don'ts",
        "Script prep, working with readers",
        "The power of silence and listening",
        'Co-star and Under-5 philosophy: "Serve the scene, don\'t steal it"',
        "Real-time feedback and in-class taping with live readers"
      ]
    },
    {
      number: "03",
      title: "Voiceover Fundamentals", 
      icon: Mic,
      points: [
        "Microphone technique and audio setup",
        "Script interpretation for VO (commercial, narration, character)",
        "Performance energy for the mic",
        "Vocal warm-ups and emotional range",
        "VO for animation vs. commercial vs. promo",
        "How to record and edit pro-level auditions from home"
      ]
    },
    {
      number: "04",
      title: "AI & The New Hollywood",
      icon: Bot,
      points: [
        "Using AI to rehearse scenes and memorize lines",
        "AI voice and avatar tools for training and VO expansion", 
        "How to stay competitive as an actor in the age of automation",
        "Building your personal brand with AI tools",
        "Ethical and professional considerations in an AI-augmented career"
      ]
    }
  ];

  const instructors = [
    {
      name: "Rick Zieff",
      title: "Master Acting & Voice Coach",
      description: "Known for his acclaimed work in front of the camera and behind the mic, Rick is a top-tier acting and voice coach with decades of professional experience in television, film, voice-over, and theater.",
      credentials: "Major industry credits spanning television, film, and voice-over"
    },
    {
      name: "Will Roberts", 
      title: "Film/TV Actor & AI Content Creator",
      description: "A veteran film/TV actor (Oppenheimer, Studio City), award-winning performer, voice artist, and AI content creator bringing modern technology to traditional acting training.",
      credentials: "Credits include Oppenheimer, Studio City, and extensive voice-over work"
    }
  ];

  const targetAudience = [
    "Actors seeking to upskill for today's hybrid casting world",
    "Performers looking to master self-taping and VO from home", 
    "Voice artists ready to level up with live coaching",
    "Students who want to stay ahead of the curve with AI and content creation",
    "Acting schools and educators looking for a future-forward curriculum"
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                ACTORS AI:
              </span>
              <br />
              ACTORS INTELLIGENCE
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
              Taught by Rick Zieff and Will Roberts
            </p>
            <p className="text-lg text-gray-400 max-w-4xl mx-auto">
              A comprehensive, modern-day acting course that takes performers from traditional techniques 
              to cutting-edge AI integration, preparing you for the future of the entertainment industry.
            </p>
          </div>

          {/* Course Overview */}
          <div className="mb-16">
            <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-lg p-8 mb-12">
              <h2 className="text-3xl font-bold text-center mb-6">Course Overview</h2>
              <p className="text-gray-300 text-lg leading-relaxed max-w-4xl mx-auto text-center">
                Both Rick and Will bring decades of professional experience in television, film, voice-over, 
                and theater, with credits that include major productions. This course bridges the gap between 
                traditional acting fundamentals and the technological innovations reshaping our industry.
              </p>
            </div>
          </div>

          {/* Course Sections */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">What You'll Learn</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {courseSections.map((section) => (
                <Card key={section.number} className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                        {section.number}
                      </div>
                      <section.icon className="w-8 h-8 text-yellow-400" />
                    </div>
                    <CardTitle className="text-white text-xl">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.points.map((point, index) => (
                        <li key={index} className="text-gray-300 flex items-start">
                          <span className="text-yellow-400 mr-3 mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Instructors */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Meet Your Instructors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {instructors.map((instructor, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-700 text-center">
                  <CardHeader>
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Award className="w-10 h-10 text-black" />
                    </div>
                    <CardTitle className="text-white text-2xl">{instructor.name}</CardTitle>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400 w-fit mx-auto">
                      {instructor.title}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-300">{instructor.description}</p>
                    <p className="text-yellow-400 font-medium">{instructor.credentials}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Who This Course Is For</h2>
            <Card className="bg-gray-900/50 border-gray-700 max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {targetAudience.map((audience, index) => (
                    <div key={index} className="flex items-start">
                      <Star className="w-5 h-5 text-yellow-400 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-300">{audience}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ (Compact) */}
          <div className="mb-16">
            <FAQSection compact showQuestionBox className="" />
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Acting Career?</h2>
            <p className="text-gray-300 mb-8 max-w-3xl mx-auto text-lg">
              Whether you're just getting started or ready to evolve, ACTORS AI: ACTORS INTELLIGENCE 
              will give you the tools, training, and confidence to thrive in the modern entertainment landscape.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                onClick={handleBringToSchool}
              >
                Bring ACTORS AI to Your School
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-colors"
                onClick={handleContactForSession}
              >
                Contact Us to Book a Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;