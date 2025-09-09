import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Settings, 
  Eye, 
  MessageSquare, 
  Video,
  CheckCircle
} from 'lucide-react';

type AnalysisStep = 'upload' | 'analyze' | 'results' | 'coaching' | 'video-upload' | 'video-evaluation';

interface ScriptStepsNavProps {
  currentStep: AnalysisStep;
  onStepClick?: (step: AnalysisStep) => void;
  className?: string;
}

const steps = [
  {
    id: 'upload' as AnalysisStep,
    label: 'Upload Script',
    icon: FileText,
    description: 'Add your script'
  },
  {
    id: 'analyze' as AnalysisStep,
    label: 'Configure Analysis',
    icon: Settings,
    description: 'Set analysis options'
  },
  {
    id: 'results' as AnalysisStep,
    label: 'View Results',
    icon: Eye,
    description: 'See your analysis'
  },
  {
    id: 'coaching' as AnalysisStep,
    label: 'Coaching Session',
    icon: MessageSquare,
    description: 'Get personalized coaching'
  },
  {
    id: 'video-upload' as AnalysisStep,
    label: 'Upload Practice Video',
    icon: Video,
    description: 'Submit your audition'
  },
  {
    id: 'video-evaluation' as AnalysisStep,
    label: 'Video Analysis',
    icon: CheckCircle,
    description: 'Get feedback'
  }
];

const ScriptStepsNav: React.FC<ScriptStepsNavProps> = ({
  currentStep,
  onStepClick,
  className
}) => {
  // Get visible steps based on current step
  const getVisibleSteps = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (currentIndex <= 2) {
      // Show first 3 steps
      return steps.slice(0, 3);
    } else if (currentIndex === 3) {
      // Show results, coaching, video-upload
      return steps.slice(2, 5);
    } else {
      // Show coaching, video-upload, video-evaluation
      return steps.slice(3, 6);
    }
  };

  const getStepStatus = (stepId: AnalysisStep) => {
    const stepOrder = steps.map(s => s.id);
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const visibleSteps = getVisibleSteps();

  return (
    <nav className={cn(
      "w-full bg-card border border-border rounded-lg p-6",
      className
    )}>
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Scene Analysis Workflow
        </h2>
        <p className="text-sm text-muted-foreground">
          Follow these steps to complete your analysis
        </p>
      </div>

      <div className="flex items-center justify-between relative">
        {visibleSteps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          const isClickable = onStepClick && (status === 'completed' || status === 'current');

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1 relative">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-lg transition-all min-w-0 w-full max-w-[200px]",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    status === 'current' && [
                      "bg-primary/10 border border-primary/20",
                      "shadow-lg shadow-primary/10"
                    ],
                    status === 'completed' && [
                      "bg-accent/30 hover:bg-accent/50",
                      isClickable && "cursor-pointer"
                    ],
                    status === 'upcoming' && [
                      "opacity-60",
                      "cursor-not-allowed"
                    ]
                  )}
                >
                  {/* Step icon */}
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold",
                    status === 'completed' && "bg-primary text-primary-foreground",
                    status === 'current' && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                    status === 'upcoming' && "bg-muted text-muted-foreground"
                  )}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="text-center min-w-0 w-full">
                    <h3 className={cn(
                      "font-medium text-sm mb-1 truncate",
                      status === 'current' && "text-foreground",
                      status === 'completed' && "text-foreground",
                      status === 'upcoming' && "text-muted-foreground"
                    )}>
                      {step.label}
                    </h3>
                    <p className={cn(
                      "text-xs leading-relaxed line-clamp-2",
                      status === 'current' && "text-muted-foreground",
                      status === 'completed' && "text-muted-foreground",
                      status === 'upcoming' && "text-muted-foreground/70"
                    )}>
                      {step.description}
                    </p>
                  </div>
                </button>
              </div>

              {/* Connector line */}
              {index < visibleSteps.length - 1 && (
                <div 
                  className={cn(
                    "h-0.5 w-8 mx-2",
                    status === 'completed' 
                      ? "bg-primary" 
                      : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

export default ScriptStepsNav;