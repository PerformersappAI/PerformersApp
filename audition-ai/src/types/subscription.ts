
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  paypal_plan_id?: string;
  features: Record<string, boolean>;
  limits: {
    script_analyses: number;
    ai_messages: number;
    video_verifications: number;
  };
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  paypal_subscription_id?: string;
  started_at: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  subscription_plans?: SubscriptionPlan;
}

export interface UserUsage {
  id: string;
  user_id: string;
  subscription_id: string;
  script_analyses_used: number;
  ai_messages_used: number;
  video_verifications_used: number;
  last_reset: string;
  created_at: string;
  updated_at: string;
}
