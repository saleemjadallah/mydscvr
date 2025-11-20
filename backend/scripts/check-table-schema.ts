#!/usr/bin/env tsx
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];
const client = new pg.Client({ connectionString: DATABASE_URL });

async function main() {
  await client.connect();

  console.log('\n=== employment_profiles schema ===');
  const schema = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'employment_profiles'
    ORDER BY ordinal_position;
  `);

  schema.rows.forEach(r => {
    console.log(`${r.column_name.padEnd(25)} ${r.data_type.padEnd(20)} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
  });

  await client.end();
}

main();
