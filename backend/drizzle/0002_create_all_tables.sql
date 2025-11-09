-- Create all tables with proper schema
-- This migration creates tables if they don't exist

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT DEFAULT '',
    "profile_image_url" TEXT,
    "stripe_customer_id" TEXT,
    "auth_provider" TEXT DEFAULT 'email' NOT NULL,
    "firebase_uid" TEXT,
    "uploads_used" INTEGER DEFAULT 0 NOT NULL,
    "batches_created" INTEGER DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create headshot_batches table
CREATE TABLE IF NOT EXISTS "headshot_batches" (
    "id" SERIAL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'processing' NOT NULL,
    "uploaded_photos" JSON,
    "photo_count" INTEGER NOT NULL,
    "plan" TEXT NOT NULL,
    "style_templates" JSON,
    "backgrounds" JSON,
    "outfits" JSON,
    "generated_headshots" JSON,
    "headshot_count" INTEGER DEFAULT 0,
    "headshots_by_template" JSON,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "completed_at" TIMESTAMP,
    "processing_time_minutes" INTEGER,
    "amount_paid" INTEGER NOT NULL,
    "stripe_payment_id" TEXT
);

-- Create edit_requests table
CREATE TABLE IF NOT EXISTS "edit_requests" (
    "id" SERIAL PRIMARY KEY,
    "batch_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "headshot_id" TEXT NOT NULL,
    "edit_type" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "result_url" TEXT,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "completed_at" TIMESTAMP
);

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS "otp_codes" (
    "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "purpose" VARCHAR(32) NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create sessions table (for express-session)
CREATE TABLE IF NOT EXISTS "sessions" (
    "sid" VARCHAR PRIMARY KEY,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP NOT NULL
);

-- Add foreign key constraints only if they don't exist
DO $$
BEGIN
    -- Add foreign key for headshot_batches.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'headshot_batches_user_id_fkey'
    ) THEN
        ALTER TABLE "headshot_batches"
        ADD CONSTRAINT "headshot_batches_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id");
    END IF;

    -- Add foreign key for edit_requests.batch_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'edit_requests_batch_id_fkey'
    ) THEN
        ALTER TABLE "edit_requests"
        ADD CONSTRAINT "edit_requests_batch_id_fkey"
        FOREIGN KEY ("batch_id") REFERENCES "headshot_batches"("id");
    END IF;

    -- Add foreign key for edit_requests.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'edit_requests_user_id_fkey'
    ) THEN
        ALTER TABLE "edit_requests"
        ADD CONSTRAINT "edit_requests_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id");
    END IF;

    -- Add foreign key for otp_codes.user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'otp_codes_user_id_fkey'
    ) THEN
        ALTER TABLE "otp_codes"
        ADD CONSTRAINT "otp_codes_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_firebase_uid" ON "users"("firebase_uid");
CREATE INDEX IF NOT EXISTS "idx_headshot_batches_user_id" ON "headshot_batches"("user_id");
CREATE INDEX IF NOT EXISTS "idx_headshot_batches_status" ON "headshot_batches"("status");
CREATE INDEX IF NOT EXISTS "idx_otp_codes_user_id" ON "otp_codes"("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_expire" ON "sessions"("expire");