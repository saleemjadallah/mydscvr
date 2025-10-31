import 'dotenv/config';
import { Client } from 'pg';
import { uploadImagesToR2 } from './src/r2-storage.js';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:tVxmCgUiyZlDLhqIMVlyhIfkQZzgJemO@shortline.proxy.rlwy.net:16848/railway';

// Validate R2 configuration
if (!process.env.R2_BUCKET_NAME) {
  throw new Error('R2_BUCKET_NAME environment variable is required');
}
if (!process.env.R2_ENDPOINT) {
  throw new Error('R2_ENDPOINT environment variable is required');
}

console.log('R2 Configuration:');
console.log('  Bucket:', process.env.R2_BUCKET_NAME);
console.log('  Endpoint:', process.env.R2_ENDPOINT);
console.log('  Public URL:', process.env.R2_PUBLIC_URL);
console.log('');

async function migrateImagesToR2() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get all menu items with images
    const result = await client.query(`
      SELECT id, name, generated_images
      FROM menu_items
      WHERE generated_images IS NOT NULL
        AND array_length(generated_images, 1) > 0
    `);

    console.log(`Found ${result.rows.length} menu items with images\n`);

    for (const row of result.rows) {
      const { id, name, generated_images } = row;

      // Check if images are already R2 URLs
      const firstImage = generated_images[0];
      if (firstImage && firstImage.startsWith('http')) {
        console.log(`✓ [${name}] Already using R2 URLs, skipping...`);
        continue;
      }

      console.log(`→ [${name}] Migrating ${generated_images.length} images...`);

      try {
        // Upload base64 images to R2
        const r2Urls = await uploadImagesToR2(generated_images, `${id}`);

        // Update database with R2 URLs
        await client.query(
          'UPDATE menu_items SET generated_images = $1 WHERE id = $2',
          [r2Urls, id]
        );

        console.log(`✓ [${name}] Successfully migrated to R2`);

        // Calculate size savings
        const base64Size = generated_images.join('').length;
        const urlSize = r2Urls.join('').length;
        const savedMB = ((base64Size - urlSize) / 1024 / 1024).toFixed(2);
        console.log(`  Saved ~${savedMB} MB in database\n`);

      } catch (error) {
        console.error(`✗ [${name}] Failed to migrate:`, error);
      }
    }

    // Show final stats
    const sizeQuery = await client.query(`
      SELECT
        COUNT(*) as total_items,
        SUM(pg_column_size(generated_images)) as total_size
      FROM menu_items
      WHERE generated_images IS NOT NULL
    `);

    const totalSizeMB = (sizeQuery.rows[0].total_size / 1024 / 1024).toFixed(2);
    console.log(`\n✓ Migration complete!`);
    console.log(`Total items: ${sizeQuery.rows[0].total_items}`);
    console.log(`Current DB size for images: ${totalSizeMB} MB`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration
migrateImagesToR2()
  .then(() => {
    console.log('\n✓ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });
