
import React from 'react';

type AnalysisStep = 'upload' | 'analyze' | 'results' | 'coaching' | 'video-upload' | 'video-evaluation';

interface ScriptAnalysisWorkflowStepsProps {
  currentStep: AnalysisStep;
}

const ScriptAnalysisWorkflowSteps: React.FC<ScriptAnalysisWorkflowStepsProps> = ({ currentStep }) => {
  const getStepStatus = (step: AnalysisStep) => {
    const steps = ['upload', 'analyze', 'results'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'current':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getCircleClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400 text-black';
      case 'current':
        return 'bg-yellow-400 text-black';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${getStepClasses(getStepStatus('upload'))}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCircleClasses(getStepStatus('upload'))}`}>
            1
          </div>
          <span>Upload Script</span>
        </div>
        <div className="h-px bg-gray-600 flex-1"></div>
        <div className={`flex items-center space-x-2 ${getStepClasses(getStepStatus('analyze'))}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCircleClasses(getStepStatus('analyze'))}`}>
            2
          </div>
          <span>Configure Analysis</span>
        </div>
        <div className="h-px bg-gray-600 flex-1"></div>
        <div className={`flex items-center space-x-2 ${getStepClasses(getStepStatus('results'))}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCircleClasses(getStepStatus('results'))}`}>
            3
          </div>
          <span>View Results</span>
        </div>
      </div>
    </div>
  );
};

export default ScriptAnalysisWorkflowSteps;
