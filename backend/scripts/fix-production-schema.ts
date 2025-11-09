/**
 * Emergency script to fix production database schema
 * Run this manually if auto-migrations aren't working
 *
 * Usage: tsx scripts/fix-production-schema.ts
 */

import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const fixProductionSchema = async () => {
  console.log('🔧 Starting production schema fix...');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = postgres(connectionString);

  try {
    console.log('📋 Checking current users table schema...');

    // Check what columns exist
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    console.log('Current columns:', columns.map(c => c.column_name).join(', '));

    console.log('\n🔨 Adding missing columns...');

    // Add uploads_used
    try {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS uploads_used integer DEFAULT 0 NOT NULL;
      `;
      console.log('✅ Added uploads_used column');
    } catch (err: any) {
      console.log('⚠️  uploads_used:', err.message);
    }

    // Add batches_created
    try {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS batches_created integer DEFAULT 0 NOT NULL;
      `;
      console.log('✅ Added batches_created column');
    } catch (err: any) {
      console.log('⚠️  batches_created:', err.message);
    }

    // Add profile_image_url
    try {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS profile_image_url text;
      `;
      console.log('✅ Added profile_image_url column');
    } catch (err: any) {
      console.log('⚠️  profile_image_url:', err.message);
    }

    // Add stripe_customer_id
    try {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS stripe_customer_id text;
      `;
      console.log('✅ Added stripe_customer_id column');
    } catch (err: any) {
      console.log('⚠️  stripe_customer_id:', err.message);
    }

    // Add auth_provider
    try {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email' NOT NULL;
      `;
      console.log('✅ Added auth_provider column');
    } catch (err: any) {
      console.log('⚠️  auth_provider:', err.message);
    }

    // Add firebase_uid
    try {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS firebase_uid text;
      `;
      console.log('✅ Added firebase_uid column');
    } catch (err: any) {
      console.log('⚠️  firebase_uid:', err.message);
    }

    // Add updated_at
    try {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL;
      `;
      console.log('✅ Added updated_at column');
    } catch (err: any) {
      console.log('⚠️  updated_at:', err.message);
    }

    // Verify final schema
    console.log('\n📋 Final users table schema:');
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    console.table(finalColumns);

    console.log('\n✅ Schema fix completed successfully!');
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
};

// Run the fix
fixProductionSchema()
  .then(() => {
    console.log('\n🎉 All done! You can now test registration.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Fatal error:', err);
    process.exit(1);
  });
