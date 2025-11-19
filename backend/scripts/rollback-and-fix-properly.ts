#!/usr/bin/env tsx
/**
 * Rollback bad rename and fix properly
 */

import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not provided');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

async function main() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔄 Rolling back bad rename...\n');

    // Check if employer_phone exists and has numeric type (our mistake)
    const checkPhone = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employment_profiles'
      AND column_name = 'employer_phone';
    `);

    if (checkPhone.rows.length > 0 && checkPhone.rows[0].data_type === 'numeric') {
      console.log('  ➜ Found employer_phone with numeric type (was monthly_salary)');
      console.log('  ➜ Renaming back to monthly_salary...');

      await client.query(`
        ALTER TABLE employment_profiles
        RENAME COLUMN employer_phone TO monthly_salary;
      `);

      console.log('  ✅ Renamed back to monthly_salary');

      // Change type from numeric to text as expected by schema
      console.log('  ➜ Converting monthly_salary from numeric to text...');
      await client.query(`
        ALTER TABLE employment_profiles
        ALTER COLUMN monthly_salary TYPE text USING monthly_salary::text;
      `);
      console.log('  ✅ Converted to text type');
    } else {
      console.log('  ℹ️  employer_phone not found or already correct type');
    }

    console.log('\n📋 Current schema:');
    const schema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employment_profiles'
      ORDER BY ordinal_position;
    `);

    schema.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Rollback complete!');
    console.log('\n💡 Now run "npm run db:push" to let Drizzle add the missing columns');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
