
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGetStarted = () => {
    onClose();
    navigate('/auth', { state: { from: location } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Get Started with MyAuditionAI.com</DialogTitle>
          <DialogDescription className="text-gray-400">
            Sign in to your account or create a new one to access professional acting tools, script analysis, and personalized coaching.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Ready to elevate your acting?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Join thousands of actors who are already using our platform to improve their craft.
            </p>
            
            <Button 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              onClick={handleGetStarted}
            >
              Get Started Now
            </Button>
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <div className="grid grid-cols-2 gap-4 text-center text-sm text-gray-400">
              <div>
                <div className="font-medium text-yellow-400">✓ Free to start</div>
                <div>No credit card required</div>
              </div>
              <div>
                <div className="font-medium text-yellow-400">✓ Instant access</div>
                <div>Start analyzing scripts today</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
