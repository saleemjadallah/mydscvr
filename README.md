# MyDscvr Backend

Backend API for MyDscvr Food - Virtual Food Photographer application.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL (Railway)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (Local Strategy)
- **Payment Processing**: Stripe
- **AI**: OpenAI API (Image Generation)
- **Language**: TypeScript

## Prerequisites

- Node.js 20 or higher
- PostgreSQL database
- OpenAI API key
- Stripe account (test and production keys)

## Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your actual values:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `SESSION_SECRET`: Random string (at least 32 characters)
   - `FRONTEND_URL`: Your frontend URL (http://localhost:5173 for development)
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
   - `ZEPTO_MAIL_API_TOKEN`: Zepto Mail API token (Zoho enczapikey)
   - `ZEPTO_MAIL_FROM_EMAIL`: Default “from” address for transactional email
   - `ZEPTO_MAIL_FROM_NAME`: Display name for outgoing email (optional)
   - `ZEPTO_MAIL_BOUNCE_EMAIL`: Bounce handling address (optional)
   - `OTP_CODE_EXPIRY_MINUTES`: Minutes before login OTPs expire (default 10)

3. **Set up database**
   ```bash
   # Push schema to database
   npm run db:push

   # Or generate and run migrations
   npm run db:generate
   npm run db:migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`

## Railway Deployment

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Add a PostgreSQL database service
4. Add a new service from GitHub repo: https://github.com/saleemjadallah/mydscvr

### Step 2: Configure Environment Variables

In Railway dashboard, add these environment variables:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SESSION_SECRET=your_random_32_char_secret
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://mydscvr.ai
ALLOWED_ORIGINS=https://mydscvr.ai,https://www.mydscvr.ai
```

### Step 3: Deploy Database Schema

After first deployment, run migrations:

```bash
# Connect to Railway project
railway link

# Push database schema
npm run db:push
```

Or use Railway's terminal feature to run the command directly.

### Step 4: Configure Stripe Webhooks

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-railway-domain.railway.app/api/stripe/webhook`
3. Select events to listen for:
   - `payment_intent.succeeded`
4. Copy webhook signing secret and update `STRIPE_WEBHOOK_SECRET` in Railway

### Step 5: Generate Domain

Railway will automatically generate a domain like `your-app.railway.app`. You can also add a custom domain if needed.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Menu Items
- `GET /api/menu-items` - Get all menu items
- `GET /api/menu-items/:id` - Get single menu item
- `POST /api/menu-items` - Create menu item
- `PATCH /api/menu-items/:id` - Update menu item
- `DELETE /api/menu-items/:id` - Delete menu item

### Image Generation
- `POST /api/generate-images` - Generate food photos

### Subscriptions
- `GET /api/subscriptions/current` - Get active subscription
- `POST /api/subscriptions` - Create subscription
- `POST /api/create-subscription-intent` - Create payment intent
- `PATCH /api/subscriptions/:id` - Update subscription

### Usage Tracking
- `GET /api/usage/current` - Get current usage stats

### Webhooks
- `POST /api/stripe/webhook` - Stripe webhook handler

### Health Check
- `GET /health` - Health check endpoint

## Database Schema

The database schema is defined in `shared/schema.ts` and includes:

- **users** - User accounts with authentication
- **menu_items** - Restaurant menu items
- **subscriptions** - User subscription plans
- **usage_records** - Monthly usage tracking
- **sessions** - Express session storage

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check TypeScript
- `npm run db:push` - Push schema to database
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations

## Project Structure

```
backend/
├── src/
│   ├── index.ts        # Entry point with Express setup
│   ├── routes.ts       # API route handlers
│   ├── auth.ts         # Authentication with Passport
│   ├── db.ts           # Database connection
│   ├── storage.ts      # Database operations
│   └── openai.ts       # OpenAI client setup
├── shared/
│   └── schema.ts       # Database schema (shared with frontend)
├── migrations/         # Database migrations
├── dist/              # Compiled JavaScript
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── README.md
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `SESSION_SECRET` | Express session secret | Random 32+ char string |
| `NODE_ENV` | Environment | `development` or `production` |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://mydscvr.ai` |
| `ALLOWED_ORIGINS` | Allowed CORS origins | `https://mydscvr.ai,https://www.mydscvr.ai` |

## Security Notes

1. Always use HTTPS in production
2. Keep `SESSION_SECRET` secure and random
3. Use Stripe test keys in development
4. Never commit `.env` file to git
5. Rotate API keys regularly
6. Use Railway's secret management for sensitive data

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure database service is running
- Check firewall/network settings

### Stripe Webhook Failures
- Verify webhook endpoint is accessible
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Review webhook logs in Stripe dashboard

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check `FRONTEND_URL` is correct
- Ensure credentials are enabled

## Support

For issues, please open an issue on GitHub: https://github.com/saleemjadallah/mydscvr/issues
