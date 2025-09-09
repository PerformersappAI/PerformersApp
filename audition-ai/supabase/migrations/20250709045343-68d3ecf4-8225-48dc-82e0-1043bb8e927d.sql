-- Update the Pro plan to include the PayPal plan ID
UPDATE public.subscription_plans 
SET paypal_plan_id = 'P-1SW37381TF060682WNBWVZ4Q'
WHERE name = 'Pro' AND price = 14.99;