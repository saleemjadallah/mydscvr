-- Create visa_packages table if it doesn't exist (needed for chat_sessions FK)
CREATE TABLE IF NOT EXISTS "visa_packages" (
    "id" SERIAL PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"("id"),
    "destination_country" TEXT NOT NULL,
    "visa_type" TEXT NOT NULL,
    "current_stage" TEXT NOT NULL DEFAULT 'planning',
    "documents" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_visa_packages_user_id" ON "visa_packages"("user_id");
CREATE INDEX IF NOT EXISTS "idx_visa_packages_stage" ON "visa_packages"("current_stage");

-- Create chat_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "chat_sessions" (
    "id" SERIAL PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "users"("id"),
    "package_id" INTEGER REFERENCES "visa_packages"("id"),
    "visa_context" JSONB,
    "messages" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_chat_sessions_user_id" ON "chat_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "idx_chat_sessions_package_id" ON "chat_sessions"("package_id");
