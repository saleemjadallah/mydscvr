import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:tVxmCgUiyZlDLhqIMVlyhIfkQZzgJemO@shortline.proxy.rlwy.net:16848/railway',
});

async function checkSubscription() {
  const client = await pool.connect();

  try {
    console.log('=== USER INFO ===');
    const userResult = await client.query(`
      SELECT id, email, stripe_customer_id, created_at
      FROM users
      WHERE email = 'saleem86@gmail.com'
    `);
    console.log(JSON.stringify(userResult.rows, null, 2));

    if (userResult.rows.length === 0) {
      console.log('User not found!');
      return;
    }

    const userId = userResult.rows[0].id;

    console.log('\n=== SUBSCRIPTIONS ===');
    const subsResult = await client.query(`
      SELECT
        id,
        user_id,
        tier,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        created_at,
        updated_at
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    console.log(JSON.stringify(subsResult.rows, null, 2));

    console.log('\n=== USAGE RECORDS ===');
    const usageResult = await client.query(`
      SELECT
        id,
        subscription_id,
        dishes_generated,
        images_generated,
        billing_period_start,
        billing_period_end,
        created_at
      FROM usage_records
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);
    console.log(JSON.stringify(usageResult.rows, null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

checkSubscription().catch(console.error);
