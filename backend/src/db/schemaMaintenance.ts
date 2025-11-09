import { pool } from './index.js';

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

async function ensureColumn(column: ColumnDefinition) {
  const sql = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS ${column.name} ${column.definition};
  `;

  try {
    await pool.query(sql);
    console.log(`[DB] Ensured column '${column.name}' exists on users table`);
  } catch (error) {
    console.error(`[DB] Failed ensuring column '${column.name}':`, error);
    throw error;
  }
}

/**
 * Ensures critical user table columns exist even if the initial migration
 * wasn't applied on the target database.
 */
export async function ensureUserSchema() {
  for (const column of userColumnDefinitions) {
    await ensureColumn(column);
  }

  console.log('[DB] User table schema verified');
}
