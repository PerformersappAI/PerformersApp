import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AuthModal from "./AuthModal";
const CTASection = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const handleStartTrialClick = () => {
    setIsAuthModalOpen(true);
  };
  const handleViewPricingClick = () => {
    navigate("/membership");
  };
  return <>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Performance?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of actors who've elevated their craft with professional coaching
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg" onClick={handleStartTrialClick}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={handleViewPricingClick} className="border-white hover:bg-white px-8 py-4 text-lg text-zinc-950">
              View Pricing
            </Button>
          </div>
          
          <div className="mt-8 text-sm text-gray-400">
            No credit card required • Cancel anytime
          </div>
        </div>
      </section>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>;
};
export default CTASection;