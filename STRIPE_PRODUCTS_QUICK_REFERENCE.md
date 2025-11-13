# Stripe Products Quick Reference

## Product 1: Basic Plan

**Product Details:**
```
Name: HeadShotHub - Basic Plan
Description: 10 professional AI headshots with 2 backgrounds, 2 outfit styles, and 2 edit credits. 3-hour turnaround.
Price: $29.00 (one-time payment)
```

**What customers get:**
- 10 AI-generated professional headshots
- 2 unique background styles
- 2 outfit variations
- 2 edit credits for revisions
- 3-hour delivery time
- High-resolution downloads
- Full commercial rights

---

## Product 2: Professional Plan (MOST POPULAR)

**Product Details:**
```
Name: HeadShotHub - Professional Plan
Description: 15 professional AI headshots with 3 backgrounds, 3 outfit styles, and 5 edit credits. 2-hour turnaround with priority support.
Price: $39.00 (one-time payment)
```

**What customers get:**
- 15 AI-generated professional headshots
- 3 unique background styles
- 3 outfit variations
- 5 edit credits for revisions
- 2-hour delivery time
- High-resolution downloads
- Full commercial rights
- Priority support

---

## Product 3: Executive Plan

**Product Details:**
```
Name: HeadShotHub - Executive Plan
Description: 20 professional AI headshots with 5 backgrounds, 5 outfit styles, and 10 edit credits. 1-hour turnaround with priority support and satisfaction guarantee.
Price: $59.00 (one-time payment)
```

**What customers get:**
- 20 AI-generated professional headshots
- 5 unique background styles
- 5 outfit variations
- 10 edit credits for revisions
- 1-hour express delivery
- High-resolution downloads
- Full commercial rights
- Priority support
- Satisfaction guarantee

---

## Environment Variables Template

After creating products, copy these Price IDs to your `.env` files:

### Backend `.env`:
```bash
# Replace with your actual Stripe keys from dashboard
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxx

# Replace with actual Price IDs after creating products
STRIPE_PRICE_BASIC=price_xxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL=price_xxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_EXECUTIVE=price_xxxxxxxxxxxxxxxxxxxx
```

### Frontend `.env`:
```bash
# Replace with your actual publishable key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
VITE_API_URL=http://localhost:3000
```

---

## Quick Setup Steps

1. **Create Products** (5 minutes)
   - Go to Stripe Dashboard > Products
   - Create 3 products with details above
   - Copy each Price ID (starts with `price_`)

2. **Set Up Webhook** (2 minutes)
   - Go to Developers > Webhooks > Add endpoint
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`
   - Copy signing secret (starts with `whsec_`)

3. **Update Environment Variables** (2 minutes)
   - Backend: Update `STRIPE_*` variables in `backend/.env`
   - Frontend: Update `VITE_STRIPE_PUBLISHABLE_KEY` in `frontend/.env`
   - Update Price IDs in `frontend/src/lib/plans.ts`

4. **Test** (5 minutes)
   - Run backend: `cd backend && npm run dev`
   - Run frontend: `cd frontend && npm run dev`
   - Use test card: `4242 4242 4242 4242`
   - Complete a purchase and verify webhook received

---

## Test Cards

**Success:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Requires Authentication (3D Secure):**
```
Card: 4000 0025 0000 3155
```

**Declined:**
```
Card: 4000 0000 0000 9995
```

---

## Price Comparison

| Plan | Price | Per Headshot | Best For |
|------|-------|--------------|----------|
| Basic | $29 | $2.90 | Single platform needs |
| Professional | $39 | $2.60 | Multi-platform presence (POPULAR) |
| Executive | $59 | $2.95 | Maximum variety & fast turnaround |

---

## Need Help?

See the full [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md) for detailed instructions.
