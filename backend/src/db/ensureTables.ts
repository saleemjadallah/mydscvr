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

  } catch (error) {
    console.error('[DB] Error ensuring tables:', error);
    // Don't throw - let the app continue and fail naturally if tables are missing
  } finally {
    await sql.end();
  }
}