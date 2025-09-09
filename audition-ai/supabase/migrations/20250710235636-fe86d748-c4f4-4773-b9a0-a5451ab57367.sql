-- Clean up duplicate user subscriptions and fix the multiple active subscriptions issue
-- First, let's see what we're dealing with
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count users with multiple active subscriptions
    SELECT COUNT(*)
    INTO duplicate_count
    FROM (
        SELECT user_id, COUNT(*) as sub_count
        FROM user_subscriptions 
        WHERE status = 'active'
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Found % users with multiple active subscriptions', duplicate_count;
END $$;

-- Create a temporary table to identify which subscriptions to keep (most recent ones)
CREATE TEMP TABLE subscriptions_to_keep AS
SELECT DISTINCT ON (user_id) 
    id, user_id, created_at
FROM user_subscriptions 
WHERE status = 'active'
ORDER BY user_id, created_at DESC;

-- Update duplicate subscriptions to 'cancelled' status (keep only the most recent one per user)
UPDATE user_subscriptions 
SET status = 'cancelled', updated_at = now()
WHERE status = 'active' 
  AND id NOT IN (SELECT id FROM subscriptions_to_keep);

-- Add a unique constraint to prevent multiple active subscriptions per user
ALTER TABLE user_subscriptions 
ADD CONSTRAINT unique_active_subscription_per_user 
UNIQUE (user_id, status) 
DEFERRABLE INITIALLY DEFERRED;

-- However, the above constraint would prevent having any inactive subscriptions
-- So let's drop it and create a better solution with a partial unique index
ALTER TABLE user_subscriptions 
DROP CONSTRAINT IF EXISTS unique_active_subscription_per_user;

-- Create a partial unique index that only applies to active subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_active_subscription 
ON user_subscriptions (user_id) 
WHERE status = 'active';

-- Clean up any orphaned usage records that don't have corresponding subscriptions
DELETE FROM user_usage 
WHERE subscription_id NOT IN (SELECT id FROM user_subscriptions);

-- Log the cleanup results
DO $$
DECLARE
    remaining_duplicates INTEGER;
    total_active INTEGER;
BEGIN
    -- Check remaining duplicates
    SELECT COUNT(*)
    INTO remaining_duplicates
    FROM (
        SELECT user_id, COUNT(*) as sub_count
        FROM user_subscriptions 
        WHERE status = 'active'
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- Count total active subscriptions
    SELECT COUNT(*)
    INTO total_active
    FROM user_subscriptions 
    WHERE status = 'active';
    
    RAISE NOTICE 'Cleanup complete. Remaining duplicates: %, Total active subscriptions: %', remaining_duplicates, total_active;
END $$;