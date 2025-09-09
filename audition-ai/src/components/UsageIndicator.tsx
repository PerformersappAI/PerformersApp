import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionPlan, UserUsage } from '@/types/subscription';
interface UsageIndicatorProps {
  plan: SubscriptionPlan;
  usage: UserUsage;
}
const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  plan,
  usage
}) => {
  const getUsageData = (type: 'script_analyses' | 'ai_messages' | 'video_verifications') => {
    const limit = plan.limits[type];
    const used = usage[`${type}_used`];
    if (limit === -1) {
      return {
        used,
        limit: 'Unlimited',
        percentage: 0,
        isUnlimited: true
      };
    }
    return {
      used,
      limit,
      percentage: used / limit * 100,
      isUnlimited: false
    };
  };
  const scriptData = getUsageData('script_analyses');
  const messagesData = getUsageData('ai_messages');
  const videoData = getUsageData('video_verifications');
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Script Analyses</span>
            <span className="text-sm text-muted-foreground">
              {scriptData.used}/{scriptData.isUnlimited ? 'Unlimited' : scriptData.limit}
            </span>
          </div>
          {!scriptData.isUnlimited && (
            <Progress value={scriptData.percentage} className="h-2" />
          )}
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">AI Messages</span>
            <span className="text-sm text-muted-foreground">
              {messagesData.used}/{messagesData.isUnlimited ? 'Unlimited' : messagesData.limit}
            </span>
          </div>
          {!messagesData.isUnlimited && (
            <Progress value={messagesData.percentage} className="h-2" />
          )}
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Video Verifications</span>
            <span className="text-sm text-muted-foreground">
              {videoData.used}/{videoData.isUnlimited ? 'Unlimited' : videoData.limit}
            </span>
          </div>
          {!videoData.isUnlimited && (
            <Progress value={videoData.percentage} className="h-2" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export default UsageIndicator;