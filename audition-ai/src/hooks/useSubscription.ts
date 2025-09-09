
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan, UserSubscription, UserUsage } from '@/types/subscription';

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans((data || []) as SubscriptionPlan[]);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    }
  };

  // Fetch user subscription
  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        toast({
          title: "Error",
          description: "Failed to load subscription data",
          variant: "destructive",
        });
        return;
      }
      
      setSubscription(data as UserSubscription | null);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive",
      });
    }
  };

  // Fetch user usage
  const fetchUserUsage = async () => {
    if (!user || !subscription) return;

    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('subscription_id', subscription.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching usage:', error);
        return;
      }
      
      setUsage(data as UserUsage | null);
    } catch (error: any) {
      console.error('Error fetching usage:', error);
    }
  };

  // Create default demo subscription for new users
  const createDemoSubscription = async () => {
    if (!user || subscription) return;

    try {
      const demoplan = plans.find(p => p.name === 'Demo');
      if (!demoplan) return;

      const { data: newSubscription, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: demoplan.id,
          status: 'active'
        })
        .select(`
          *,
          subscription_plans(*)
        `)
        .single();

      if (subError) throw subError;

      const { error: usageError } = await supabase
        .from('user_usage')
        .insert({
          user_id: user.id,
          subscription_id: newSubscription.id
        });

      if (usageError) throw usageError;

      setSubscription(newSubscription as UserSubscription);
      await fetchUserUsage();
    } catch (error: any) {
      console.error('Error creating demo subscription:', error);
    }
  };

  // Check usage limits
  const checkUsageLimit = (type: 'script_analyses' | 'ai_messages' | 'video_verifications'): boolean => {
    if (!subscription || !usage) return false;

    const plan = subscription.subscription_plans as SubscriptionPlan;
    const limit = plan.limits[type];
    
    // -1 means unlimited
    if (limit === -1) return true;
    
    return usage[`${type}_used`] < limit;
  };

  // Update usage
  const updateUsage = async (type: 'script_analyses' | 'ai_messages' | 'video_verifications') => {
    if (!user || !subscription || !usage) return false;

    if (!checkUsageLimit(type)) {
      const plan = subscription.subscription_plans as SubscriptionPlan;
      const planName = plan?.name || 'current plan';
      const typeName = type.replace('_', ' ').replace('script analyses', 'scene analysis');
      
      toast({
        title: "Usage Limit Reached",
        description: `You've reached your ${typeName} limit for the ${planName} plan. Please upgrade to continue.`,
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_usage')
        .update({
          [`${type}_used`]: usage[`${type}_used`] + 1
        })
        .eq('id', usage.id);

      if (error) throw error;
      
      setUsage(prev => prev ? {
        ...prev,
        [`${type}_used`]: prev[`${type}_used`] + 1
      } : prev);
      
      return true;
    } catch (error: any) {
      console.error('Error updating usage:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeSubscription = async () => {
      setLoading(true);
      await fetchPlans();
      if (user) {
        await fetchUserSubscription();
      }
      setLoading(false);
    };

    initializeSubscription();
  }, [user]);

  useEffect(() => {
    if (subscription) {
      fetchUserUsage();
    } else if (user && plans.length > 0 && !loading) {
      createDemoSubscription();
    }
  }, [subscription, user, plans, loading]);

  return {
    subscription,
    usage,
    plans,
    loading,
    checkUsageLimit,
    updateUsage,
    refetch: fetchUserSubscription
  };
};
