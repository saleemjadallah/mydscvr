# Stripe Product Setup Guide

This guide will help you create and map Stripe products for HeadShotHub's pricing plans.

## Current Pricing Plans

| Plan | Price | Headshots | Backgrounds | Outfits | Edit Credits | Turnaround |
|------|-------|-----------|-------------|---------|--------------|------------|
| Basic | $29 | 10 | 2 | 2 | 2 | 3 hours |
| Professional | $39 | 15 | 3 | 3 | 5 | 2 hours |
| Executive | $59 | 20 | 5 | 5 | 10 | 1 hour |

## Step 1: Log into Stripe Dashboard

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right) for testing
3. Switch to **Live Mode** when ready for production

## Step 2: Create Products

Navigate to **Products** > **Add Product** for each plan:

### Basic Plan Product

1. Click **Add Product**
2. Fill in the details:
   - **Name**: `HeadShotHub - Basic Plan`
   - **Description**: `10 professional AI headshots with 2 backgrounds, 2 outfit styles, and 2 edit credits. 3-hour turnaround.`
   - **Image**: (Optional) Upload a product image
3. Under **Pricing**:
   - **Price**: `$29.00`
   - **Billing period**: One time (not recurring)
   - **Currency**: USD
4. Click **Save Product**
5. **COPY THE PRICE ID** - it will look like `price_xxxxxxxxxxxxx`

### Professional Plan Product

1. Click **Add Product**
2. Fill in the details:
   - **Name**: `HeadShotHub - Professional Plan`
   - **Description**: `15 professional AI headshots with 3 backgrounds, 3 outfit styles, and 5 edit credits. 2-hour turnaround with priority support.`
3. Under **Pricing**:
   - **Price**: `$39.00`
   - **Billing period**: One time (not recurring)
   - **Currency**: USD
4. Click **Save Product**
5. **COPY THE PRICE ID** - it will look like `price_xxxxxxxxxxxxx`

### Executive Plan Product

1. Click **Add Product**
2. Fill in the details:
   - **Name**: `HeadShotHub - Executive Plan`
   - **Description**: `20 professional AI headshots with 5 backgrounds, 5 outfit styles, and 10 edit credits. 1-hour turnaround with priority support and satisfaction guarantee.`
3. Under **Pricing**:
   - **Price**: `$59.00`
   - **Billing period**: One time (not recurring)
   - **Currency**: USD
4. Click **Save Product**
5. **COPY THE PRICE ID** - it will look like `price_xxxxxxxxxxxxx`

## Step 3: Set Up Webhook Endpoint

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL:
   - **Development**: `http://localhost:3000/api/stripe/webhook` (requires ngrok or similar)
   - **Production**: `https://your-production-domain.com/api/stripe/webhook`
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.async_payment_succeeded`
   - ✅ `checkout.session.async_payment_failed`
5. Click **Add endpoint**
6. **COPY THE SIGNING SECRET** - it will look like `whsec_xxxxxxxxxxxxx`

## Step 4: Update Environment Variables

### Backend (.env)

Update your `backend/.env` file with the actual values:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx    # Or sk_live_xxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PRICE_BASIC=price_xxxxxxxxxxxxx      # From Step 2 - Basic Plan
STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxx  # From Step 2 - Professional Plan
STRIPE_PRICE_EXECUTIVE=price_xxxxxxxxxxxxx   # From Step 2 - Executive Plan
```

### Frontend (.env)

Update your `frontend/.env` file:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx  # Or pk_live_xxx for production
```

To find your publishable key:
1. Go to **Developers** > **API keys**
2. Copy the **Publishable key** (starts with `pk_test_` or `pk_live_`)

## Step 5: Update Frontend Plans Configuration

Update `frontend/src/lib/plans.ts` with the actual Stripe Price IDs:

```typescript
export const HEADSHOT_PLANS: { [key: string]: PlanConfig } = {
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    price: 2900,
    headshots: 10,
    backgrounds: 2,
    outfits: 2,
    editCredits: 2,
    turnaroundHours: 3,
    stripePriceId: 'price_xxxxxxxxxxxxx', // Replace with actual Basic Plan Price ID
    features: [/* ... */],
  },
  professional: {
    id: 'professional',
    name: 'Professional Plan',
    price: 3900,
    headshots: 15,
    backgrounds: 3,
    outfits: 3,
    editCredits: 5,
    turnaroundHours: 2,
    stripePriceId: 'price_xxxxxxxxxxxxx', // Replace with actual Professional Plan Price ID
    popular: true,
    features: [/* ... */],
  },
  executive: {
    id: 'executive',
    name: 'Executive Plan',
    price: 5900,
    headshots: 20,
    backgrounds: 5,
    outfits: 5,
    editCredits: 10,
    turnaroundHours: 1,
    stripePriceId: 'price_xxxxxxxxxxxxx', // Replace with actual Executive Plan Price ID
    features: [/* ... */],
  },
};
```

## Step 6: Testing the Integration

### Test with Stripe Test Cards

Use these test card numbers in Test Mode:

- **Success**: `4242 4242 4242 4242`
- **Requires authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 9995`

For all test cards:
- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any ZIP code (e.g., 12345)

### Testing Checklist

1. ✅ Start your backend: `cd backend && npm run dev`
2. ✅ Start your frontend: `cd frontend && npm run dev`
3. ✅ Upload photos and select a plan
4. ✅ Complete checkout with test card
5. ✅ Verify redirect to `/processing?session_id=...`
6. ✅ Check webhook received in Stripe Dashboard > **Developers** > **Webhooks**
7. ✅ Verify batch created in database
8. ✅ Check job added to Redis queue

## Step 7: Webhook Testing (Local Development)

For local webhook testing, use **Stripe CLI**:

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward events to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Use the webhook signing secret provided by the CLI in your `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

## Step 8: Going Live

When ready for production:

1. Switch Stripe Dashboard to **Live Mode**
2. Create the same 3 products in Live Mode
3. Update environment variables with **live** keys:
   - `STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx`
   - `STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx` (from live webhook)
   - `STRIPE_PRICE_BASIC=price_xxxxxxxxxxxxx` (live price ID)
   - `STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxx` (live price ID)
   - `STRIPE_PRICE_EXECUTIVE=price_xxxxxxxxxxxxx` (live price ID)
4. Update frontend with live publishable key:
   - `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx`
5. Set up live webhook endpoint with your production URL
6. Test with a real card in a small amount first

## Verification Checklist

- [ ] All 3 products created in Stripe
- [ ] Price IDs copied and saved
- [ ] Webhook endpoint created
- [ ] Webhook secret copied
- [ ] Backend `.env` updated with all Stripe keys
- [ ] Frontend `.env` updated with publishable key
- [ ] Frontend `plans.ts` updated with Price IDs
- [ ] Tested checkout flow with test card
- [ ] Webhook events being received
- [ ] Database batches being created
- [ ] Jobs being enqueued

## Troubleshooting

### Webhook not receiving events
- Check webhook endpoint URL is correct
- Ensure backend server is running
- Use Stripe CLI for local testing
- Check webhook signing secret matches

### Checkout session fails
- Verify Price IDs are correct in both frontend and backend
- Check STRIPE_SECRET_KEY is set correctly
- Ensure price exists in current mode (test vs live)

### Price mismatch errors
- Make sure frontend plan prices (in cents) match Stripe product prices
- Verify currency is USD in Stripe products

## Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

## Support

If you encounter issues:
1. Check Stripe Dashboard > **Developers** > **Logs** for API errors
2. Check backend console for webhook processing errors
3. Verify all environment variables are set correctly
4. Ensure you're in the correct mode (test vs live)
