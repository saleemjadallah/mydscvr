-- Check user details
SELECT id, email, stripe_customer_id, created_at
FROM users
WHERE email = 'saleem86@gmail.com';

-- Check subscriptions for this user
SELECT
  s.id,
  s.user_id,
  s.tier,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.created_at,
  s.updated_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.email = 'saleem86@gmail.com'
ORDER BY s.created_at DESC;

-- Check usage records
SELECT
  ur.id,
  ur.subscription_id,
  ur.dishes_generated,
  ur.images_generated,
  ur.billing_period_start,
  ur.billing_period_end,
  ur.created_at
FROM usage_records ur
JOIN users u ON ur.user_id = u.id
WHERE u.email = 'saleem86@gmail.com'
ORDER BY ur.created_at DESC;
