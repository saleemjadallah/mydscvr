import postgres from 'postgres';

interface ColumnDefinition {
  name: string;
  definition: string;
}

const userColumnDefinitions: ColumnDefinition[] = [
  { name: 'uploads_used', definition: 'integer DEFAULT 0 NOT NULL' },
  { name: 'batches_created', definition: 'integer DEFAULT 0 NOT NULL' },
  { name: 'profile_image_url', definition: 'text' },
  { name: 'stripe_customer_id', definition: 'text' },
  { name: 'auth_provider', definition: `text DEFAULT 'email' NOT NULL` },
  { name: 'firebase_uid', definition: 'text' },
  { name: 'updated_at', definition: 'timestamp DEFAULT now() NOT NULL' },
];

/**
 * Ensures critical user table columns exist even if the initial migration
 * wasn't applied on the target database.
 */
export async function ensureUserSchema() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[DB] Skipping schema verification - DATABASE_URL not set');
    return;
  }

  const sql = postgres(connectionString);

  try {
    for (const column of userColumnDefinitions) {
      await sql.unsafe(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${column.name} ${column.definition};`
      );
      console.log(`[DB] Ensured column '${column.name}' exists on users table`);
    }

    console.log('[DB] User table schema verified');
  } finally {
    await sql.end();
  }
}
