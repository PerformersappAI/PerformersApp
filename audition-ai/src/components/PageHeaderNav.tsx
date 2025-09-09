import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, ArrowRight } from 'lucide-react';

interface PageHeaderNavProps {
  title?: string;
  showForward?: boolean;
}

const PageHeaderNav: React.FC<PageHeaderNavProps> = ({ 
  title, 
  showForward = false 
}) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="container max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
              aria-label="Go to homepage"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>

            {showForward && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(1)}
                className="flex items-center gap-2"
                aria-label="Go forward"
              >
                <ArrowRight className="w-4 h-4" />
                Forward
              </Button>
            )}
          </div>

          {title && (
            <h1 className="font-semibold text-foreground text-lg">
              {title}
            </h1>
          )}

          <div className="w-32" /> {/* Spacer for centered title */}
        </div>
      </div>
    </div>
  );
};

export default PageHeaderNav;