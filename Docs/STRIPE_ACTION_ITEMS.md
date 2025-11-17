# Stripe Setup - Action Items

## Current Status
Your pricing plans are correctly configured in the code:
- Basic: $29 (10 headshots, 2 backgrounds, 2 outfits, 2 edit credits, 3hr turnaround)
- Professional: $39 (15 headshots, 3 backgrounds, 3 outfits, 5 edit credits, 2hr turnaround) - MOST POPULAR
- Executive: $59 (20 headshots, 5 backgrounds, 5 outfits, 10 edit credits, 1hr turnaround)

## What You Need to Do

### 1. Create Stripe Products (Go to stripe.com/dashboard)

#### In Stripe Dashboard:
1. Navigate to **Products** → **Add Product**
2. Create 3 products with these exact details:

**Product 1: Basic**
- Name: `HeadShotHub - Basic Plan`
- Price: `$29.00` (one-time)
- Description: `10 professional AI headshots with 2 backgrounds, 2 outfit styles, and 2 edit credits. 3-hour turnaround.`
- After saving, **COPY THE PRICE ID** → looks like `price_1AbC2DeFgHiJkLmN`

**Product 2: Professional**
- Name: `HeadShotHub - Professional Plan`
- Price: `$39.00` (one-time)
- Description: `15 professional AI headshots with 3 backgrounds, 3 outfit styles, and 5 edit credits. 2-hour turnaround with priority support.`
- After saving, **COPY THE PRICE ID** → looks like `price_1AbC2DeFgHiJkLmN`

**Product 3: Executive**
- Name: `HeadShotHub - Executive Plan`
- Price: `$59.00` (one-time)
- Description: `20 professional AI headshots with 5 backgrounds, 5 outfit styles, and 10 edit credits. 1-hour turnaround with priority support and satisfaction guarantee.`
- After saving, **COPY THE PRICE ID** → looks like `price_1AbC2DeFgHiJkLmN`

### 2. Get Your Stripe Keys

#### Publishable Key:
1. Go to **Developers** → **API keys**
2. Copy **Publishable key** (starts with `pk_test_`)

#### Secret Key:
1. Same location as above
2. Copy **Secret key** (starts with `sk_test_`)

#### Webhook Secret:
1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: For now, use `https://your-domain.com/api/stripe/webhook` (we'll test locally with Stripe CLI)
3. Select events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
4. After creating, **COPY THE SIGNING SECRET** (starts with `whsec_`)

### 3. Update Backend Environment Variables

Edit `backend/.env` and replace these lines:

```bash
# Find these lines and replace with your actual keys:
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE
STRIPE_PRICE_BASIC=price_YOUR_BASIC_PLAN_PRICE_ID_HERE
STRIPE_PRICE_PROFESSIONAL=price_YOUR_PROFESSIONAL_PLAN_PRICE_ID_HERE
STRIPE_PRICE_EXECUTIVE=price_YOUR_EXECUTIVE_PLAN_PRICE_ID_HERE
```

**Current placeholders in backend/.env:**
```bash
STRIPE_SECRET_KEY=sk_test_placeholder          # ← REPLACE THIS
STRIPE_WEBHOOK_SECRET=whsec_placeholder        # ← REPLACE THIS
STRIPE_PRICE_BASIC=price_placeholder_basic     # ← REPLACE THIS
STRIPE_PRICE_PROFESSIONAL=price_placeholder_pro # ← REPLACE THIS
STRIPE_PRICE_EXECUTIVE=price_placeholder_exec   # ← REPLACE THIS
```

### 4. Update Frontend Environment Variables

Edit `frontend/.env` and replace this line:

```bash
# Find this line and replace:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
```

**Current placeholder in frontend/.env:**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here  # ← REPLACE THIS
```

### 5. Update Frontend Plans Configuration

Edit `frontend/src/lib/plans.ts` and update the `stripePriceId` values:

**Lines to update:**
- Line 13: `stripePriceId: 'price_basic_xxx'` → Replace with actual Basic Price ID
- Line 33: `stripePriceId: 'price_pro_xxx'` → Replace with actual Professional Price ID
- Line 55: `stripePriceId: 'price_exec_xxx'` → Replace with actual Executive Price ID

### 6. Test the Integration

#### Start your servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Stripe CLI (for webhook testing)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

#### Test a purchase:
1. Go to http://localhost:5173
2. Upload photos
3. Select a plan
4. Use test card: `4242 4242 4242 4242`
   - Expiry: 12/34
   - CVC: 123
   - ZIP: 12345
5. Complete checkout
6. Verify webhook received in Terminal 3

## Quick Checklist

- [ ] Created 3 products in Stripe Dashboard
- [ ] Copied all 3 Price IDs
- [ ] Copied Publishable Key
- [ ] Copied Secret Key
- [ ] Created webhook endpoint and copied signing secret
- [ ] Updated `backend/.env` with 5 Stripe values
- [ ] Updated `frontend/.env` with Publishable Key
- [ ] Updated `frontend/src/lib/plans.ts` with 3 Price IDs
- [ ] Installed Stripe CLI: `brew install stripe/stripe-cli/stripe`
- [ ] Logged into Stripe CLI: `stripe login`
- [ ] Tested checkout flow with test card
- [ ] Verified webhook received

## Where to Find Everything

### Files to Edit:
1. `backend/.env` - Lines 18-22 (Stripe configuration)
2. `frontend/.env` - Line 5 (Publishable key)
3. `frontend/src/lib/plans.ts` - Lines 13, 33, 55 (Price IDs)

### Stripe Dashboard Locations:
- Products: https://dashboard.stripe.com/test/products
- API Keys: https://dashboard.stripe.com/test/apikeys
- Webhooks: https://dashboard.stripe.com/test/webhooks
- Events/Logs: https://dashboard.stripe.com/test/events

## Need Help?

See the detailed guides:
- [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md) - Complete walkthrough
- [STRIPE_PRODUCTS_QUICK_REFERENCE.md](./STRIPE_PRODUCTS_QUICK_REFERENCE.md) - Product details

## When You're Ready for Production

1. Switch Stripe Dashboard to **Live Mode**
2. Create the same 3 products in Live Mode
3. Get live keys (start with `pk_live_` and `sk_live_`)
4. Create live webhook with production URL
5. Update all environment variables with live keys
6. Test with a real card (small amount first!)

---

**Next Step:** Go to https://dashboard.stripe.com/test/products and create your first product!
