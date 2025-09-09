import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function SectionHeading({ className, children, ...props }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "text-xl font-semibold tracking-tight text-foreground flex items-center gap-3",
        "border-b-2 border-border pb-2",
        className
      )}
      {...props}
    >
      <span className="inline-block w-2 h-6 rounded-sm bg-[hsl(var(--brand-yellow))]" aria-hidden="true" />
      {children}
    </h2>
  );
}

export default SectionHeading;
