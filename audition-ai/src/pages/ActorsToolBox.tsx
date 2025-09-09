import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';

const ActorsToolBox = () => {
  const navigate = useNavigate();

  const handleActorsProfileClick = () => {
    navigate("/profile");
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
  };

  const handleHeadshotAnalysisClick = () => {
    navigate("/self-taping#headshot-grader");
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-12 leading-tight">
            Actors Tool Box
          </h1>
          
          {/* Info Boxes */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto">
            {/* Teleprompter Mode Info Box */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left">
              <h3 className="text-2xl font-bold text-white mb-4">
                Teleprompter Mode with AI Scene Partner
              </h3>
              <ul className="text-white/90 space-y-2">
                <li>• Rehearse anytime with your AI partner.</li>
                <li>• Sharpen timing & delivery.</li>
                <li>• Memorize lines faster with smart cues.</li>
                <li>• Easily adapt to rhythms, emotions, and styles.</li>
              </ul>
            </div>

            {/* Smart Feedback Info Box */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left">
              <h3 className="text-2xl font-bold text-white mb-4">
                Smart Feedback, Stronger Auditions, Book the Gig
              </h3>
              <ul className="text-white/90 space-y-2">
                <li>• Consistent feedback to elevate your work.</li>
                <li>• Instant self-tape feedback without waiting for a coach.</li>
                <li>• Headshot reviews based on industry standards.</li>
              </ul>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8">
            {/* Headshot Analysis Button */}
            <button
              onClick={handleHeadshotAnalysisClick}
              className="group relative w-72 h-32 rounded-2xl bg-gradient-to-br from-yellow-500 via-orange-500 to-orange-600 hover:from-orange-500 hover:to-yellow-500 text-black shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(251,191,36,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden"
              aria-label="Analyze your headshot"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-2">
                <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span className="text-lg font-bold tracking-wide">Analyze your headshot</span>
              </div>
            </button>
            <button
              onClick={handleActorsProfileClick}
              className="group relative w-72 h-32 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 hover:from-pink-600 hover:to-purple-600 text-white shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(147,51,234,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden"
              aria-label="Actors Profile"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-2">
                <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="text-lg font-bold tracking-wide">Actors Profile</span>
              </div>
            </button>

            <button
              onClick={handleDashboardClick}
              className="group relative w-72 h-32 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 hover:from-indigo-600 hover:to-blue-600 text-white shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(59,130,246,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden"
              aria-label="Dashboard"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-2">
                <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
                <span className="text-lg font-bold tracking-wide">Dashboard</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActorsToolBox;