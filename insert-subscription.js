import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:tVxmCgUiyZlDLhqIMVlyhIfkQZzgJemO@shortline.proxy.rlwy.net:16848/railway',
});

async function insertSubscription() {
  const client = await pool.connect();

  try {
    // Subscription data from Stripe
    const userId = '74e8afd9-ff29-416f-b883-895602208331';
    const tier = 'pro';
    const status = 'active';
    const stripeCustomerId = 'cus_TKVJxEBsZHcLus';
    const stripeSubscriptionId = 'sub_1SNqJDFWxz5KcBumJaVtSNWt';
    const currentPeriodStart = new Date(1761809411 * 1000); // Oct 30, 2025
    const currentPeriodEnd = new Date(1764487811 * 1000);   // Jan 29, 2026
    const cancelAtPeriodEnd = 0;

    console.log('Inserting subscription...');
    console.log({
      userId,
      tier,
      status,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
    });

    // Insert subscription
    const subsResult = await client.query(`
      INSERT INTO subscriptions (
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `, [
      userId,
      tier,
      status,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd
    ]);

    console.log('\n✅ Subscription inserted:');
    console.log(JSON.stringify(subsResult.rows[0], null, 2));

    const subscriptionId = subsResult.rows[0].id;

    // Insert usage record
    console.log('\nInserting usage record...');
    const usageResult = await client.query(`
      INSERT INTO usage_records (
        user_id,
        subscription_id,
        dishes_generated,
        images_generated,
        billing_period_start,
        billing_period_end,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      userId,
      subscriptionId,
      0, // dishes_generated
      0, // images_generated
      currentPeriodStart,
      currentPeriodEnd
    ]);

    console.log('\n✅ Usage record inserted:');
    console.log(JSON.stringify(usageResult.rows[0], null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

insertSubscription().catch(console.error);
