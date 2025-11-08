import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

// Make sure environment variables are loaded
dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres client for Drizzle
export const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });

// Create pg Pool for connect-pg-simple session store
// Note: connect-pg-simple uses node-postgres (pg), not postgres-js
export const pool = new pg.Pool({
  connectionString,
  // Optional pool configuration
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export schema
export * from './schema.js';
