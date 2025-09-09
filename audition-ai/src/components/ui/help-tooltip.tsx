import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useHelpMode } from "@/contexts/HelpModeContext";

interface HelpTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  variant?: "info" | "warning" | "success";
}

const variantClasses: Record<NonNullable<HelpTooltipProps["variant"]>, string> = {
  info: "bg-[hsl(var(--help-bg))] text-[hsl(var(--help-fg))] border-[hsl(var(--help-fg)/0.15)]",
  warning: "bg-[hsl(var(--help-bg))] text-[hsl(var(--help-fg))] border-[hsl(var(--help-fg)/0.15)]",
  success: "bg-[hsl(var(--help-bg))] text-[hsl(var(--help-fg))] border-[hsl(var(--help-fg)/0.15)]",
};

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  children,
  side = "top",
  className,
  variant = "info",
}) => {
  const { enabled } = useHelpMode();

  if (!enabled) return <>{children}</>;

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={8}
        className={cn(
          "max-w-xs border shadow-md rounded-md px-3 py-2 font-medium leading-snug",
          variantClasses[variant],
          className
        )}
      >
        <div className="text-sm">{content}</div>
      </TooltipContent>
    </Tooltip>
  );
};
