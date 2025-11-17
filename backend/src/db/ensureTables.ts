import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Ensures all required tables exist in the database
 * This is a failsafe that runs on every startup
 */
export async function ensureTables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[DB] DATABASE_URL is not set - cannot ensure tables');
    return;
  }

  console.log('[DB] Ensuring all tables exist...');

  const sql = postgres(connectionString);

  try {
    // Read and execute the migration SQL
    const migrationPath = join(__dirname, '..', '..', 'drizzle', '0002_create_all_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the entire migration
    await sql.unsafe(migrationSQL);

    console.log('[DB] All tables verified/created successfully');

    // Apply free user flag migration
    const freeUserMigrationPath = join(__dirname, '..', '..', 'drizzle', '0003_add_free_user_flag.sql');
    const freeUserMigrationSQL = readFileSync(freeUserMigrationPath, 'utf-8');
    await sql.unsafe(freeUserMigrationSQL);

    console.log('[DB] Free user privileges updated');

    // Apply chat sessions migration (creates visa_packages + chat_sessions if missing)
    const chatSessionsMigrationPath = join(__dirname, '..', '..', 'drizzle', '0004_create_chat_sessions.sql');
    const chatSessionsMigrationSQL = readFileSync(chatSessionsMigrationPath, 'utf-8');
    await sql.unsafe(chatSessionsMigrationSQL);

    console.log('[DB] Chat sessions tables verified/created');

    // Verify critical columns exist
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('uploads_used', 'batches_created')
    `;

    if (result.length === 2) {
      console.log('[DB] ✓ Critical columns verified: uploads_used, batches_created');
    } else {
      console.log('[DB] ⚠ Some critical columns may be missing');
    }

    // Add onboarding columns if they don't exist
    console.log('[DB] Checking for onboarding columns...');

    const onboardingColumnsExist = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('onboarding_completed', 'travel_profile')
    `;

    if (onboardingColumnsExist.length < 2) {
      console.log('[DB] Adding onboarding columns...');

      // Add onboarding_completed if missing
      const hasOnboardingCompleted = onboardingColumnsExist.some(
        (col) => (col as { column_name: string }).column_name === 'onboarding_completed'
      );
      if (!hasOnboardingCompleted) {
        await sql`ALTER TABLE users ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0`;
        console.log('[DB] ✓ Added onboarding_completed column');
      }

      // Add travel_profile if missing
      const hasTravelProfile = onboardingColumnsExist.some(
        (col) => (col as { column_name: string }).column_name === 'travel_profile'
      );
      if (!hasTravelProfile) {
        await sql`ALTER TABLE users ADD COLUMN travel_profile JSONB`;
        console.log('[DB] ✓ Added travel_profile column');
      }
    } else {
      console.log('[DB] ✓ Onboarding columns already exist');
    }

    // Create visa_packages table if it doesn't exist (needed for chat_sessions FK)
    console.log('[DB] Checking for visa_packages table...');

    const visaPackagesExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'visa_packages'
      )
    `;

    if (!visaPackagesExists[0]?.exists) {
      console.log('[DB] Creating visa_packages table...');
      await sql`
        CREATE TABLE IF NOT EXISTS visa_packages (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          destination_country TEXT NOT NULL,
          visa_type TEXT NOT NULL,
          current_stage TEXT NOT NULL DEFAULT 'planning',
          documents JSONB,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_visa_packages_user_id ON visa_packages(user_id);
        CREATE INDEX IF NOT EXISTS idx_visa_packages_stage ON visa_packages(current_stage);
      `;

      console.log('[DB] ✓ Created visa_packages table');
    } else {
      console.log('[DB] ✓ visa_packages table already exists');
    }

    // Create chat_sessions table if it doesn't exist
    console.log('[DB] Checking for chat_sessions table...');

    const chatSessionsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'chat_sessions'
      )
    `;

    if (!chatSessionsExists[0]?.exists) {
      console.log('[DB] Creating chat_sessions table...');
      await sql`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          package_id INTEGER REFERENCES visa_packages(id),
          visa_context JSONB,
          messages JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      // Create indexes for faster lookups
      await sql`
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_package_id ON chat_sessions(package_id);
      `;

      console.log('[DB] ✓ Created chat_sessions table');
    } else {
      console.log('[DB] ✓ chat_sessions table already exists');
    }

  } catch (error) {
    console.error('[DB] Error ensuring tables:', error);
    // Don't throw - let the app continue and fail naturally if tables are missing
  } finally {
    await sql.end();
  }
}
