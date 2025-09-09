import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { HelpTooltip } from "@/components/ui/help-tooltip";
const Hero = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const handleActorsToolBoxClick = () => {
    navigate("/toolbox");
  };
  const handleScriptAnalysisClick = () => {
    console.log('[Hero] Navigating to script analysis...');
    navigate("/analysis");
  };
  const handleSelfTapingClick = () => {
    navigate("/teleprompter");
  };
  return <>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* New background image */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: `url('/lovable-uploads/e660b78e-0cdd-4c62-b288-ebb8aa5bdbd2.png')`
        }} onError={() => console.log('Background image failed to load')} onLoad={() => console.log('Background image loaded successfully')}></div>
          
          {/* Reduced opacity gradient overlay for better poster visibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/40 z-10"></div>
          
          {/* Subtle texture overlay for depth */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%223%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40 z-20 bg-rose-950"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-30 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-snug tracking-tight drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--brand-orange))] to-[hsl(var(--brand-yellow))]">
            Prep it! Shoot it, Book it!
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-4xl mx-auto leading-relaxed font-medium drop-shadow-lg">
            Transform auditions with AI coaching — from script to character — giving you the confidence and edge to book the job.
          </p>
          
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center mb-16" role="navigation" aria-label="Primary actions">
            <HelpTooltip content="Tip: Upload a PDF or paste your script text, then run analysis for insights." side="top">
              <button onClick={handleScriptAnalysisClick} className="group relative w-72 h-32 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-orange))] via-[hsl(var(--brand-yellow))] to-orange-500 hover:from-[hsl(var(--brand-yellow))] hover:to-[hsl(var(--brand-orange))] text-black shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(255,165,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-yellow))] focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden" aria-label="Analyze Scene with AI">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-2">
                  <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                  <span className="text-lg font-bold tracking-wide">Analyze Scene with AI</span>
                </div>
              </button>
            </HelpTooltip>
            <HelpTooltip content="Tip: Upload a PDF or paste text to start self-taping." side="top">
              <button onClick={handleSelfTapingClick} className="group relative w-72 h-32 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 hover:from-purple-600 hover:to-blue-600 text-white shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(124,58,237,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden" aria-label="Self Tape">
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-2">
                  <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <span className="text-lg font-bold tracking-wide">Self Tape</span>
                </div>
              </button>
            </HelpTooltip>
            <button onClick={handleActorsToolBoxClick} className="group relative w-72 h-32 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 hover:from-teal-600 hover:to-emerald-600 text-white shadow-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_40px_rgba(20,184,166,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden" aria-label="Actors Tool Box">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-2">
                <svg className="w-8 h-8 mb-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-lg font-bold tracking-wide">Actors Tool Box</span>
              </div>
            </button>
          </div>
          
          {/* Info Cards with Speech Bubbles */}
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-start mt-8">
            {/* Analysis Scene Info */}
            <div className="relative w-80">
              {/* White triangle arrow pointing up */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-white z-20"></div>
              <div className="bg-black/80 backdrop-blur-sm border border-white rounded-lg p-6 shadow-xl text-left">
                <h3 className="text-lg font-bold text-[hsl(var(--brand-yellow))] mb-3 text-left">Analyze Scene with AI Acting Coach</h3>
                
                <h4 className="text-base font-bold text-[hsl(var(--brand-yellow))] mb-2 text-left">STEP-BY-STEP</h4>
                <ul className="text-sm text-white space-y-2 leading-relaxed text-left mb-4">
                  <li>1. Upload your scene to the AI Acting Coach.</li>
                  <li>2. Get instant feedback and evaluation.</li>
                  <li>3. Edit your script for teleprompter use.</li>
                  <li>4. Ask follow-up questions to the coach.</li>
                  <li>5. Download your personalized report.</li>
                  <li>6. Move to self-tape and start recording.</li>
                </ul>
                
                <h4 className="text-base font-bold text-[hsl(var(--brand-yellow))] mb-2 text-left">BENEFITS</h4>
                <ul className="text-sm text-white space-y-2 leading-relaxed text-left">
                  <li>• Grow as an actor with every use.</li>
                  <li>• Train anytime—it's more than auditions, it's mastery.</li>
                  <li>• Elevate scenes with proven acting techniques.</li>
                  <li>• AI helps you create bold choices for your scene.</li>
                  <li>• Build unshakable confidence to book the role.</li>
                </ul>
              </div>
            </div>
            
            {/* Self Tape Info */}
            <div className="relative w-80">
              {/* White triangle arrow pointing up */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-white z-20"></div>
              <div className="bg-black/80 backdrop-blur-sm border border-white rounded-lg p-6 shadow-xl text-left">
                <h3 className="text-lg font-bold text-[hsl(var(--brand-yellow))] mb-3 text-left">Actor's Audition Dashboard</h3>
                <h4 className="text-base font-bold text-[hsl(var(--brand-yellow))] mb-2 text-left">STEP-BY-STEP</h4>
                <ul className="text-sm text-white space-y-2 leading-relaxed text-left mb-4">
                  <li>1. Upload your edited scene into the teleprompter</li>
                  <li>2. Select your character for the scene & pick your AI reader</li>
                  <li>3. Customize read speed, font size,</li>
                  <li>4. Pick your AI scene partner.</li>
                  <li>5. Rehearse scenes as AI voices read with you</li>
                  <li>6. Upload your final video for AI evaluation—covering acting, sound, and lighting.</li>
                </ul>
                
                <h4 className="text-base font-bold text-[hsl(var(--brand-yellow))] mb-2 text-left">BENEFITS</h4>
                <ul className="text-sm text-white space-y-2 leading-relaxed text-left">
                  <li>• No more searching for scene partners</li>
                  <li>• Work with top-quality AI readers</li>
                  <li>• Rehearse and prep auditions anytime, anywhere</li>
                  <li>• Be first to submit auditions—not last</li>
                  <li>• Get industry-standard feedback on every self-tape</li>
                  <li>• Turn every scene into a learning opportunity, not just auditions</li>
                </ul>
              </div>
            </div>
            
            {/* Actors Toolbox Info */}
            <div className="relative w-80">
              {/* White triangle arrow pointing up */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-white z-20"></div>
              <div className="bg-black/80 backdrop-blur-sm border border-white rounded-lg p-6 shadow-xl text-left">
                <h3 className="text-lg font-bold text-[hsl(var(--brand-yellow))] mb-3 text-left">Actors Toolbox</h3>
                
                <h4 className="text-base font-bold text-[hsl(var(--brand-yellow))] mb-2 text-left">STEP-BY-STEP</h4>
                <ul className="text-sm text-white space-y-2 leading-relaxed text-left mb-4">
                  <li>1. Digital actor profile with headshots, résumé, demo reel, and shareable vanity link</li>
                  <li>2. Actors Journal: AI reminders & tools to never miss an audition.</li>
                  <li>3. AI reminders, audition tracking, and instant reports for your agent &/or manager</li>
                </ul>
                
                <h4 className="text-base font-bold text-[hsl(var(--brand-yellow))] mb-2 text-left">BENEFITS</h4>
                <p className="text-sm text-white mb-4 leading-relaxed text-left font-bold">Actors Approach Toolbox</p>
                <ul className="text-sm text-white space-y-2 leading-relaxed text-left mb-4">
                  <li>• 375+ acting training videos with exercises from Stanislavsky, Meisner, Adler, and more</li>
                  <li>• One-time payment—unlock lifetime access</li>
                </ul>
                
                <p className="text-sm text-white mb-2 leading-relaxed text-left font-bold">Headshot Evaluation</p>
                <ul className="text-sm text-white space-y-2 leading-relaxed text-left">
                  <li>• Industry-standard headshot evaluations (commercial & theatrical)</li>
                </ul>
              </div>
            </div>
          </div>
        
        </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>;
};
export default Hero;