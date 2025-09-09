
-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  paypal_plan_id TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  paypal_subscription_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) NOT NULL,
  script_analyses_used INTEGER NOT NULL DEFAULT 0,
  ai_messages_used INTEGER NOT NULL DEFAULT 0,
  video_verifications_used INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Subscription plans are public (everyone can view)
CREATE POLICY "Anyone can view subscription plans" 
  ON public.subscription_plans 
  FOR SELECT 
  TO public
  USING (true);

-- User subscriptions policies
CREATE POLICY "Users can view their own subscriptions" 
  ON public.user_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
  ON public.user_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
  ON public.user_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- User usage policies
CREATE POLICY "Users can view their own usage" 
  ON public.user_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage records" 
  ON public.user_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
  ON public.user_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add status constraints
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_status_check 
CHECK (status IN ('active', 'cancelled', 'expired', 'pending'));

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX idx_user_usage_subscription_id ON public.user_usage(subscription_id);

-- Insert the two subscription plans
INSERT INTO public.subscription_plans (name, price, features, limits) VALUES 
(
  'Demo', 
  0.00, 
  '{"script_analysis": true, "ai_coaching": true, "video_verification": true}',
  '{"script_analyses": 1, "ai_messages": 10, "video_verifications": 1}'
),
(
  'Pro', 
  14.99, 
  '{"script_analysis": true, "ai_coaching": true, "video_verification": true, "unlimited_messages": true, "unlimited_videos": true}',
  '{"script_analyses": 15, "ai_messages": -1, "video_verifications": -1}'
);

-- Create trigger to update updated_at
CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON public.subscription_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON public.user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at 
  BEFORE UPDATE ON public.user_usage 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
