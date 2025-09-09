-- Clean up duplicate user subscriptions step by step
-- First, let's identify and clean up duplicates safely

-- Step 1: Create a temporary table to identify which subscriptions to keep (most recent ones per user per status)
CREATE TEMP TABLE subscriptions_to_keep AS
SELECT DISTINCT ON (user_id, status) 
    id, user_id, status, created_at
FROM user_subscriptions 
ORDER BY user_id, status, created_at DESC;

-- Step 2: Mark duplicate subscriptions for deletion (keep only the most recent one per user per status)
CREATE TEMP TABLE subscriptions_to_delete AS
SELECT id 
FROM user_subscriptions 
WHERE id NOT IN (SELECT id FROM subscriptions_to_keep);

-- Step 3: Delete orphaned usage records first
DELETE FROM user_usage 
WHERE subscription_id IN (SELECT id FROM subscriptions_to_delete);

-- Step 4: Delete duplicate subscriptions
DELETE FROM user_subscriptions 
WHERE id IN (SELECT id FROM subscriptions_to_delete);

-- Step 5: Create a partial unique index that only applies to active subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_active_subscription 
ON user_subscriptions (user_id) 
WHERE status = 'active';

-- Step 6: Log the cleanup results
DO $$
DECLARE
    remaining_duplicates INTEGER;
    total_active INTEGER;
    total_subscriptions INTEGER;
BEGIN
    -- Check remaining duplicates for active subscriptions
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
    
    -- Count total subscriptions
    SELECT COUNT(*)
    INTO total_subscriptions
    FROM user_subscriptions;
    
    RAISE NOTICE 'Cleanup complete. Active subscription duplicates: %, Total active: %, Total subscriptions: %', remaining_duplicates, total_active, total_subscriptions;
END $$;