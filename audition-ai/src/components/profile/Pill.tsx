import React from "react";
import { cn } from "@/lib/utils";

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export function Pill({ className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-secondary text-secondary-foreground",
        "px-3 py-1 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Pill;
