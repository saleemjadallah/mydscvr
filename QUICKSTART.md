# HeadShotHub - Quick Start Guide

This guide will help you get HeadShotHub running locally in under 10 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL database ready (local or Railway)
- [ ] Redis instance ready (local or Railway)
- [ ] Cloudflare R2 bucket created
- [ ] Google Gemini API key obtained
- [ ] Stripe account with test keys

## Step 1: Install Dependencies (2 minutes)

```bash
# Navigate to project
cd ~/Desktop/HeadShotHub

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

## Step 2: Configure Environment Variables (3 minutes)

### Backend Configuration

Create `backend/.env`:

```bash
cd backend
cp .env.example .env
```

**Edit `backend/.env` with your values:**

```env
# Minimum required for local development:
DATABASE_URL=postgresql://localhost:5432/headshotsdb
GEMINI_API_KEY=your_actual_gemini_key
SESSION_SECRET=any_random_string_here
FRONTEND_URL=http://localhost:5173

# Optional for full functionality:
R2_ACCOUNT_ID=your_cloudflare_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=headshot-storage
R2_PUBLIC_URL=https://your-bucket.r2.dev

REDIS_URL=redis://localhost:6379

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PROFESSIONAL=price_xxx
STRIPE_PRICE_EXECUTIVE=price_xxx
```

### Frontend Configuration

Create `frontend/.env`:

```bash
cd ../frontend
cp .env.example .env
```

**Edit `frontend/.env`:**

```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Step 3: Setup Database (2 minutes)

```bash
cd backend

# Push schema to database
npm run db:push

# Verify database (optional)
npm run db:studio
```

## Step 4: Start Development Servers (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
✅ HeadShotHub API running on http://localhost:3000
📝 Environment: development
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
```

## Step 5: Test the Application (2 minutes)

1. **Open** `http://localhost:5173` in your browser
2. **Register** a new account
3. **Verify** you can see the homepage and pricing page
4. **Check** the API health: `http://localhost:3000/api/health`

## Common Issues & Fixes

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Create database if needed
createdb headshotsdb
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis (macOS)
brew services start redis

# Start Redis (Linux)
sudo systemctl start redis
```

### Port Already in Use

```bash
# Backend (port 3000)
lsof -ti:3000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

### 1. Set Up Stripe Products

Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products) and create three products:

- **Basic Plan**: $29.00 USD
- **Professional Plan**: $39.00 USD
- **Executive Plan**: $59.00 USD

Copy the Price IDs and add them to `backend/.env`.

### 2. Configure Cloudflare R2

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → R2
2. Create a new bucket (e.g., `headshot-storage`)
3. Create API tokens with read/write permissions
4. Update `backend/.env` with credentials

### 3. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `backend/.env` as `GEMINI_API_KEY`

### 4. Test Full Workflow

1. **Upload photos** → Go to `/upload`
2. **Select plan** → Choose a pricing tier
3. **Select templates** → Pick style templates
4. **Checkout** → Use Stripe test card: `4242 4242 4242 4242`
5. **View results** → Check dashboard for generated headshots

## Development Workflow

### Making Frontend Changes

```bash
cd frontend
# Edit files in src/
# Hot reload is automatic
```

### Making Backend Changes

```bash
cd backend
# Edit files in src/
# tsx watch will auto-restart
```

### Database Schema Changes

```bash
cd backend
# Edit src/db/schema.ts
npm run db:push
```

## Production Deployment

See [README.md](./README.md) for full production deployment instructions.

## Getting Help

- **Check logs**: Backend terminal shows API errors
- **Check browser console**: Frontend shows client-side errors
- **Database issues**: Run `npm run db:studio` to inspect data
- **API testing**: Use `curl` or Postman to test endpoints

## Useful Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Verification Checklist

Before starting development, verify:

- [ ] `node --version` shows 18+
- [ ] `npm --version` works
- [ ] `psql --version` works (PostgreSQL)
- [ ] `redis-cli ping` returns PONG
- [ ] Backend `.env` file exists with required vars
- [ ] Frontend `.env` file exists
- [ ] Database schema pushed successfully
- [ ] Both servers start without errors
- [ ] Homepage loads at localhost:5173
- [ ] API health check returns OK

---

**You're ready to build! 🚀**
