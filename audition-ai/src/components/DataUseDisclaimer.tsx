import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DataUseDisclaimerProps {
  size?: "sm" | "md";
  className?: string;
  showLinks?: boolean;
}

export function DataUseDisclaimer({ 
  size = "sm", 
  className,
  showLinks = true 
}: DataUseDisclaimerProps) {
  const textSizeClass = size === "md" ? "text-sm" : "text-xs sm:text-sm";
  
  return (
    <div className={cn(
      textSizeClass,
      "text-muted-foreground mt-3",
      className
    )}>
      <p>
        * We will never use your scripts, voice, video, likeness, or info outside of this app. 
        {showLinks ? (
          <>
            {" "}As a member, you can delete all scenes you've uploaded anytime from your{" "}
            <Link to="/dashboard" className="underline hover:text-foreground transition-colors">
              Dashboard
            </Link>
            . View our{" "}
            <Link to="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            {" "}and{" "}
            <Link to="/terms" className="underline hover:text-foreground transition-colors">
              Terms of Use
            </Link>
            .
          </>
        ) : (
          " As a member, you can delete all scenes you've uploaded anytime from your Dashboard."
        )}
      </p>
    </div>
  );
}