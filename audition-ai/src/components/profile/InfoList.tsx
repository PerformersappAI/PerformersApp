import React from "react";
import { cn } from "@/lib/utils";

export type InfoItem = {
  label: string;
  value?: React.ReactNode;
  href?: string;
};

interface InfoListProps extends React.HTMLAttributes<HTMLDListElement> {
  items: InfoItem[];
}

export function InfoList({ className, items, ...props }: InfoListProps) {
  if (!items.length) return null;
  return (
    <dl className={cn("space-y-2", className)} {...props}>
      {items.map((item, idx) => {
        if (!item.value) return null;
        const content = item.href ? (
          <a
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="text-primary hover:underline break-all"
          >
            {item.value}
          </a>
        ) : (
          <span className="text-foreground">{item.value}</span>
        );
        return (
          <div key={idx} className="grid grid-cols-3 gap-3">
            <dt className="col-span-1 text-sm text-muted-foreground">{item.label}</dt>
            <dd className="col-span-2 text-sm">{content}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export default InfoList;
