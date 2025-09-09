
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelpModeProvider } from "@/contexts/HelpModeContext";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
// Import pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import ScriptAnalysis from "@/pages/ScriptAnalysis";
import IndividualScriptAnalysis from "@/pages/IndividualScriptAnalysis";
import Profile from "@/pages/Profile";
import PublicProfile from "@/pages/PublicProfile";
import Teleprompter from "@/pages/Teleprompter";
import ActorsToolBox from "@/pages/ActorsToolBox";
import ActorsApproach from "@/pages/ActorsApproach";
import SelfTaping from "@/pages/SelfTaping";
import HeadshotEvaluation from "@/pages/HeadshotEvaluation";
import Membership from "@/pages/Membership";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import LegalNotices from "@/pages/LegalNotices";
import Cookies from "@/pages/Cookies";
import Podcast from "@/pages/Podcast";
import BlogPostDetail from "@/pages/BlogPostDetail";
import NotFound from "@/pages/NotFound";
import Test from "@/pages/Test";
import TTSDebug from "@/pages/TTSDebug";
import ProVoiceTest from "@/pages/ProVoiceTest";
import AdminScripts from "@/pages/AdminScripts";
import AdminPhotographers from "@/pages/AdminPhotographers";
import Coaches from "@/pages/Coaches";
import CoachDetail from "@/pages/CoachDetail";
import AdminCoaches from "@/pages/AdminCoaches";
import Footer from "@/components/Footer";

import "./App.css";

const queryClient = new QueryClient();

// Redirect component for old script analysis URLs
const ScriptAnalysisRedirect = () => {
  const { scriptId } = useParams<{ scriptId: string }>();
  return <Navigate to={`/analysis/${scriptId}`} replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HelpModeProvider>
            <TooltipProvider>
              <Router>
              <div className="App">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/analysis" element={<ScriptAnalysis />} />
                  <Route path="/script-analysis" element={<Navigate to="/analysis" replace />} />
                  <Route path="/script-analysis/:scriptId" element={<ScriptAnalysisRedirect />} />
                  <Route path="/analysis/:scriptId" element={<IndividualScriptAnalysis />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:username" element={<PublicProfile />} />
                  <Route path="/teleprompter" element={<Teleprompter />} />
                  <Route path="/toolbox" element={<ActorsToolBox />} />
                  <Route path="/actors-toolbox" element={<Navigate to="/toolbox" replace />} />
                  <Route path="/approach" element={<ActorsApproach />} />
                  <Route path="/actors-approach" element={<Navigate to="/approach" replace />} />
                  <Route path="/self-taping" element={<SelfTaping />} />
                  <Route path="/headshot-evaluation/:id" element={<HeadshotEvaluation />} />
                  <Route path="/headshot-evaluation" element={<Navigate to="/self-taping#headshot-grader" replace />} />
                  <Route path="/membership" element={<Membership />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/legal" element={<LegalNotices />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/podcast" element={<Podcast />} />
                  <Route path="/blog/:slug" element={<BlogPostDetail />} />
                  <Route path="/coaches" element={<Coaches />} />
                  <Route path="/coaches/:slug" element={<CoachDetail />} />
                  <Route path="/admin/scripts" element={<AdminScripts />} />
                  <Route path="/admin/photographers" element={<AdminPhotographers />} />
                  <Route path="/admin/coaches" element={<AdminCoaches />} />
                  <Route path="/test" element={<Test />} />
                  <Route path="/tts-debug" element={<TTSDebug />} />
                  <Route path="/pro-voice-test" element={<ProVoiceTest />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Footer />
                <Toaster />
                <SonnerToaster />
              </div>
            </Router>
            </TooltipProvider>
          </HelpModeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
