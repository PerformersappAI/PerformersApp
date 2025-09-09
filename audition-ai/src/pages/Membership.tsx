
import React, { useState } from 'react';
import Navigation from "@/components/Navigation";
import AuthModal from "@/components/AuthModal";
import SubscriptionCard from "@/components/SubscriptionCard";
import UsageIndicator from "@/components/UsageIndicator";
import { TrialSignupForm } from "@/components/TrialSignupForm";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const Membership = () => {
  const { user } = useAuth();
  const { subscription, usage, plans, loading } = useSubscription();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTrialFormOpen, setIsTrialFormOpen] = useState(false);
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    if (!user) {
      setIsAuthModalOpen(true);
    }
  };

  const handleTrialSignup = () => {
    setIsTrialFormOpen(true);
  };

  const handleTrialSuccess = () => {
    navigate('/dashboard');
  };

  const handleSubscribe = () => {
    // Refresh subscription data after successful subscription
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  // Sort plans: Demo first, then by price, with Exclusive last
  const sortedPlans = [...plans].sort((a, b) => {
    if (a.name === 'Demo') return -1;
    if (b.name === 'Demo') return 1;
    if (a.name === 'Exclusive') return 1;
    if (b.name === 'Exclusive') return -1;
    return a.price - b.price;
  });

  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Choose Your{" "}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Membership
                </span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Unlock your acting potential with professional coaching, advanced tools, 
                and personalized feedback tailored to your career goals.
              </p>
            </div>

            {/* Current Usage (for logged in users) */}
            {user && subscription && usage && (
              <div className="mb-12">
                <div className="max-w-md mx-auto">
                  <UsageIndicator 
                    plan={subscription.subscription_plans as any} 
                    usage={usage} 
                  />
                </div>
              </div>
            )}

            {/* Pricing Plans */}
            <div className="mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {sortedPlans.map((plan) => (
                  <div key={plan.id} className="flex justify-center">
                    <div className="w-full max-w-sm">
                      <SubscriptionCard
                        plan={plan}
                        currentSubscription={subscription}
                        onSubscribe={plan.name === 'Demo' ? handleTrialSignup : handleSubscribe}
                        popular={plan.name === 'Pro'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-center bg-gray-900/30 border border-gray-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-4">All Plans Include</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">No Commitment</h3>
                  <p className="text-gray-300">Cancel or change your plan anytime</p>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Expert Support</h3>
                  <p className="text-gray-300">Get help from professional acting coaches</p>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-2">Regular Updates</h3>
                  <p className="text-gray-300">New features and improvements every month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <TrialSignupForm 
        open={isTrialFormOpen} 
        onClose={() => setIsTrialFormOpen(false)}
        onSuccess={handleTrialSuccess}
      />
    </>
  );
};

export default Membership;
