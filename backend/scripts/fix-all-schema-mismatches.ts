#!/usr/bin/env tsx
/**
 * Fix ALL Schema Column Mismatches
 * Comprehensive fix for all column renames in production database
 */

import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not provided');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

async function renameColumn(table: string, oldName: string, newName: string) {
  try {
    const checkOld = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `, [table, oldName]);

    const checkNew = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `, [table, newName]);

    if (checkOld.rows.length > 0 && checkNew.rows.length === 0) {
      console.log(`  ➜ Renaming ${table}.${oldName} → ${newName}...`);
      await client.query(`ALTER TABLE ${table} RENAME COLUMN "${oldName}" TO "${newName}"`);
      console.log(`  ✅ Renamed successfully`);
      return true;
    } else if (checkNew.rows.length > 0) {
      console.log(`  ℹ️  ${table}.${newName} already exists, skipping`);
      return false;
    } else {
      console.log(`  ⚠️  ${table}.${oldName} not found, might be a new column`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error renaming ${table}.${oldName}:`, error);
    return false;
  }
}

async function main() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔧 Fixing employment_profiles table...\n');

    // employment_profiles fixes
    await renameColumn('employment_profiles', 'company_name', 'employer_name');
    await renameColumn('employment_profiles', 'company_address', 'employer_address');
    await renameColumn('employment_profiles', 'job_duties', 'department');
    await renameColumn('employment_profiles', 'monthly_salary', 'employer_phone');

    // Check if we need to add missing columns
    console.log('\n📋 Checking employment_profiles schema...');
    const schema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employment_profiles'
      ORDER BY ordinal_position;
    `);

    console.log('Current columns:');
    schema.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    // Check what columns are expected vs what exists
    const expectedColumns = [
      'id', 'user_id', 'profile_id', 'is_current', 'employer_name',
      'job_title', 'department', 'start_date', 'end_date',
      'employer_address', 'employer_phone', 'employer_email',
      'employer_website', 'employment_type', 'monthly_salary',
      'currency', 'responsibilities', 'supervisor_name',
      'supervisor_title', 'supervisor_phone', 'supervisor_email',
      'created_at', 'updated_at'
    ];

    const existingColumns = schema.rows.map(r => r.column_name);
    const missing = expectedColumns.filter(col => !existingColumns.includes(col));

    if (missing.length > 0) {
      console.log('\n⚠️  Missing columns that need to be added:');
      missing.forEach(col => console.log(`  - ${col}`));
      console.log('\n💡 These will be added automatically by drizzle-kit push');
    }

    console.log('\n✅ Schema column renames completed!');
    console.log('\n💡 Next: Run "npm run db:push" and accept new column additions');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
