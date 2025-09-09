-- Remove tier limits and make all features unlimited for both Demo and Pro plans
UPDATE public.subscription_plans 
SET limits = '{"script_analyses": -1, "ai_messages": -1, "video_verifications": -1}'::jsonb
WHERE name IN ('Demo', 'Pro');