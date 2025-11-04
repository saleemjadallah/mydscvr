-- Add auth provider column to track authentication method
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';

-- Add Firebase UID column for Google Sign-In users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;

-- Update existing users to have 'email' as their provider
UPDATE users
SET auth_provider = 'email'
WHERE auth_provider IS NULL AND password_hash IS NOT NULL;

-- Create index for faster Firebase UID lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Create index for auth provider queries
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);