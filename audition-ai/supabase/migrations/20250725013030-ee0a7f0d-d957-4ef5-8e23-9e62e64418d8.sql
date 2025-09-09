-- Update Pro plan price to $19.99
UPDATE subscription_plans 
SET price = 19.99, updated_at = NOW()
WHERE name = 'Pro';