/**
 * Script to completely rebuild the database from scratch
 * WARNING: This will DELETE ALL DATA!
 *
 * Usage: tsx scripts/rebuild-database.ts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import dotenv from 'dotenv';
import * as schema from '../src/db/schema.js';

dotenv.config();

const rebuildDatabase = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('🚨 WARNING: This will DELETE ALL DATA in your database!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    console.log('📦 Starting database rebuild...\n');

    // Drop all tables in correct order (respecting foreign key constraints)
    console.log('🗑️  Dropping existing tables...');

    await sql`DROP TABLE IF EXISTS edit_requests CASCADE`;
    console.log('   ✓ Dropped edit_requests');

    await sql`DROP TABLE IF EXISTS headshot_batches CASCADE`;
    console.log('   ✓ Dropped headshot_batches');

    await sql`DROP TABLE IF EXISTS otp_codes CASCADE`;
    console.log('   ✓ Dropped otp_codes');

    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    console.log('   ✓ Dropped sessions');

    await sql`DROP TABLE IF EXISTS users CASCADE`;
    console.log('   ✓ Dropped users');

    // Also drop the drizzle migration table if it exists
    await sql`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`;
    console.log('   ✓ Dropped __drizzle_migrations');

    console.log('\n🔨 Creating new tables...');

    // Create users table
    await sql`
      CREATE TABLE users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT DEFAULT '',
        profile_image_url TEXT,
        stripe_customer_id TEXT,
        auth_provider TEXT DEFAULT 'email' NOT NULL,
        firebase_uid TEXT,
        uploads_used INTEGER DEFAULT 0 NOT NULL,
        batches_created INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created users table');

    // Create headshot_batches table
    await sql`
      CREATE TABLE headshot_batches (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        status TEXT DEFAULT 'processing' NOT NULL,
        uploaded_photos JSON,
        photo_count INTEGER NOT NULL,
        plan TEXT NOT NULL,
        style_templates JSON,
        backgrounds JSON,
        outfits JSON,
        generated_headshots JSON,
        headshot_count INTEGER DEFAULT 0,
        headshots_by_template JSON,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMP,
        processing_time_minutes INTEGER,
        amount_paid INTEGER NOT NULL,
        stripe_payment_id TEXT
      )
    `;
    console.log('   ✓ Created headshot_batches table');

    // Create edit_requests table
    await sql`
      CREATE TABLE edit_requests (
        id SERIAL PRIMARY KEY,
        batch_id INTEGER NOT NULL REFERENCES headshot_batches(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        headshot_id TEXT NOT NULL,
        edit_type TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        result_url TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMP
      )
    `;
    console.log('   ✓ Created edit_requests table');

    // Create otp_codes table
    await sql`
      CREATE TABLE otp_codes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        purpose VARCHAR(32) NOT NULL,
        code VARCHAR(12) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('   ✓ Created otp_codes table');

    // Create sessions table (for express-session)
    await sql`
      CREATE TABLE sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `;
    console.log('   ✓ Created sessions table');

    // Create indexes for better performance
    console.log('\n📊 Creating indexes...');

    await sql`CREATE INDEX idx_users_email ON users(email)`;
    console.log('   ✓ Created index on users.email');

    await sql`CREATE INDEX idx_users_firebase_uid ON users(firebase_uid)`;
    console.log('   ✓ Created index on users.firebase_uid');

    await sql`CREATE INDEX idx_headshot_batches_user_id ON headshot_batches(user_id)`;
    console.log('   ✓ Created index on headshot_batches.user_id');

    await sql`CREATE INDEX idx_headshot_batches_status ON headshot_batches(status)`;
    console.log('   ✓ Created index on headshot_batches.status');

    await sql`CREATE INDEX idx_otp_codes_user_id ON otp_codes(user_id)`;
    console.log('   ✓ Created index on otp_codes.user_id');

    await sql`CREATE INDEX idx_sessions_expire ON sessions(expire)`;
    console.log('   ✓ Created index on sessions.expire');

    // Verify the schema
    console.log('\n✅ Verifying schema...');

    const userColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;

    console.log('\nUsers table columns:');
    userColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    // Create a test user to verify everything works
    console.log('\n🧪 Testing with a sample user creation...');

    const testUser = await sql`
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        auth_provider,
        uploads_used,
        batches_created
      )
      VALUES (
        'test@example.com',
        'hashed_password_here',
        'Test',
        'User',
        'email',
        0,
        0
      )
      RETURNING id, email, uploads_used, batches_created
    `;

    console.log('   ✓ Successfully created test user:', testUser[0]);

    // Clean up test user
    await sql`DELETE FROM users WHERE email = 'test@example.com'`;
    console.log('   ✓ Cleaned up test user');

    console.log('\n🎉 Database rebuilt successfully!');
    console.log('All tables have been created with the correct schema.');
    console.log('\nYou can now:');
    console.log('1. Register new users');
    console.log('2. Run the application without schema errors');

  } catch (error) {
    console.error('❌ Database rebuild failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
};

// Run the rebuild
rebuildDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });