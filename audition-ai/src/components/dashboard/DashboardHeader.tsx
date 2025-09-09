
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { HelpTooltip } from "@/components/ui/help-tooltip";

interface DashboardHeaderProps {
  userName: string;
  onCreateAudition: () => void;
}

const DashboardHeader = ({ userName, onCreateAudition }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back, {userName}
        </h1>
        <p className="text-gray-400 text-lg">
          Manage your auditions and track your acting journey
        </p>
      </div>
      
      <HelpTooltip
        content="Create a new audition. Include role, project, and deadline; you can add reminders later."
        side="left"
      >
        <Button 
          onClick={onCreateAudition}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Audition
        </Button>
      </HelpTooltip>
    </div>
  );
};

export default DashboardHeader;
