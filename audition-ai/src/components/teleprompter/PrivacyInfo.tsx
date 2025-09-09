import React from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function PrivacyInfo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground p-1 h-auto"
        >
          <Info className="w-4 h-4 mr-1" />
          <span className="text-xs">Privacy</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 text-xs text-muted-foreground" 
        align="end" 
        side="bottom"
      >
        <p>
          * We will never use your scripts, voice, video, likeness, or info outside of this app. 
          As a member, you can delete all scenes you've uploaded anytime from your Dashboard.
        </p>
      </PopoverContent>
    </Popover>
  );
}