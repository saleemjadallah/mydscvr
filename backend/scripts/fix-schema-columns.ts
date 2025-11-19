#!/usr/bin/env tsx
/**
 * Fix Schema Column Mismatches
 * Renames columns in production database to match current schema
 */

import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not provided');
  console.error('Usage: tsx scripts/fix-schema-columns.ts <DATABASE_URL>');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

async function main() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check current schema
    console.log('📋 Checking employment_profiles table...');
    const checkSchema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employment_profiles'
      ORDER BY ordinal_position;
    `);

    console.log('Current columns:');
    checkSchema.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    console.log('');

    // Fix company_name -> employer_name
    console.log('🔧 Applying fixes...\n');

    const hasCompanyName = checkSchema.rows.some(row => row.column_name === 'company_name');
    const hasEmployerName = checkSchema.rows.some(row => row.column_name === 'employer_name');

    if (hasCompanyName && !hasEmployerName) {
      console.log('  ➜ Renaming company_name to employer_name...');
      await client.query(`
        ALTER TABLE employment_profiles
        RENAME COLUMN company_name TO employer_name;
      `);
      console.log('  ✅ Renamed company_name to employer_name');
    } else if (hasEmployerName) {
      console.log('  ℹ️  employer_name already exists, skipping');
    } else if (!hasCompanyName) {
      console.log('  ⚠️  Neither company_name nor employer_name found - table might be empty or different');
    }

    // Check for company_address -> employer_address
    const hasCompanyAddress = checkSchema.rows.some(row => row.column_name === 'company_address');
    const hasEmployerAddress = checkSchema.rows.some(row => row.column_name === 'employer_address');

    if (hasCompanyAddress && !hasEmployerAddress) {
      console.log('  ➜ Renaming company_address to employer_address...');
      await client.query(`
        ALTER TABLE employment_profiles
        RENAME COLUMN company_address TO employer_address;
      `);
      console.log('  ✅ Renamed company_address to employer_address');
    } else if (hasEmployerAddress) {
      console.log('  ℹ️  employer_address already exists, skipping');
    }

    console.log('\n📋 Final schema:');
    const finalSchema = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employment_profiles'
      ORDER BY ordinal_position;
    `);

    finalSchema.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Schema fixes completed successfully!');
    console.log('\n💡 Next step: Run "npm run db:push" to verify no schema changes remain');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
