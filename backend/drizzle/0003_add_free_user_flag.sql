-- Add is_free_user column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_free_user INTEGER DEFAULT 0 NOT NULL;

-- Grant free access to support@mydscvr.ai
UPDATE users
SET is_free_user = 1
WHERE email = 'support@mydscvr.ai';