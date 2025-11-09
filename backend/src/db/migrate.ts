import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const runMigrations = async () => {
  console.log('Running migrations...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  // Create connection for migrations
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Determine migrations folder based on environment
    // In dev (src/db/migrate.ts): go up 2 levels to project root, then into drizzle
    // In prod (dist/db/migrate.js): go up 1 level to dist, then into drizzle
    let migrationsFolder;
    if (__dirname.includes('/dist/')) {
      // Production: dist/db -> dist/drizzle
      migrationsFolder = join(__dirname, '..', 'drizzle');
    } else {
      // Development: src/db -> drizzle
      migrationsFolder = join(__dirname, '..', '..', 'drizzle');
    }
    console.log(`Looking for migrations in: ${migrationsFolder}`);

    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
};

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { runMigrations };
