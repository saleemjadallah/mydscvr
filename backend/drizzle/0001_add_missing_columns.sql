-- Add missing columns to users table if they don't exist
DO $$
BEGIN
    -- Add uploads_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'uploads_used'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "uploads_used" integer DEFAULT 0 NOT NULL;
    END IF;

    -- Add batches_created column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'batches_created'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "batches_created" integer DEFAULT 0 NOT NULL;
    END IF;

    -- Add profile_image_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'profile_image_url'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "profile_image_url" text;
    END IF;

    -- Add stripe_customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;
    END IF;

    -- Add auth_provider column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'auth_provider'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "auth_provider" text DEFAULT 'email' NOT NULL;
    END IF;

    -- Add firebase_uid column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'firebase_uid'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "firebase_uid" text;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
    END IF;
END $$;
