import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

interface DocumentTileProps {
  href: string;
  label?: string;
}

export function DocumentTile({ href, label = "Resume" }: DocumentTileProps) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" download>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">PDF Document</p>
          </div>
          <Download className="w-4 h-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </a>
  );
}

export default DocumentTile;
