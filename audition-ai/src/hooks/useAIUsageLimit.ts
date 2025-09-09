
import { useSubscription } from './useSubscription';
import { useEffect } from 'react';

export const useAIUsageLimit = () => {
  const { checkUsageLimit, updateUsage, subscription, usage } = useSubscription();

  // Clear old Gemini rate limit localStorage data on first load
  useEffect(() => {
    localStorage.removeItem('gemini_api_usage_stats');
  }, []);

  const checkLimit = (type: 'script_analyses' | 'ai_messages' | 'video_verifications'): boolean => {
    return checkUsageLimit(type);
  };

  const updateUsageCount = async (type: 'script_analyses' | 'ai_messages' | 'video_verifications'): Promise<boolean> => {
    return await updateUsage(type);
  };

  const showLimitNotification = (type: string) => {
    // This is now handled in the useSubscription hook
  };

  const getRemainingUses = (type: 'script_analyses' | 'ai_messages' | 'video_verifications'): number => {
    // This functionality is now handled by the subscription system
    if (!subscription || !usage) return 0;
    
    const plan = subscription.subscription_plans as any;
    const limit = plan?.limits?.[type];
    if (limit === -1) return 999; // Unlimited
    
    return Math.max(0, limit - usage[`${type}_used`]);
  };

  return {
    checkLimit,
    updateUsage: updateUsageCount,
    showLimitNotification,
    getRemainingUses,
    // Legacy compatibility
    usage: null,
    limits: null,
    isNearLimit: () => false,
  };
};
