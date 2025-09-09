import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface VideoCardProps {
  url: string;
  title?: string | null;
}

export function VideoCard({ url, title }: VideoCardProps) {
  if (!url) return null;
  return (
    <Card className="overflow-hidden">
      {title ? (
        <div className="px-4 pt-4">
          <h3 className="text-base font-medium">{title}</h3>
        </div>
      ) : null}
      <CardContent className="pt-4">
        <div className="aspect-video bg-black rounded-md overflow-hidden">
          <video controls className="w-full h-full">
            <source src={url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </CardContent>
    </Card>
  );
}

export default VideoCard;
