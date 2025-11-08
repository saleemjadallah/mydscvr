# HeadShotHub Backend

AI-powered professional headshot generation platform backend. Generate 40-200 platform-optimized headshots from 12-20 uploaded photos within 1-3 hours.

## 🚀 Features

- **Multi-auth System**: Email/password, Google OAuth (Firebase), and OTP passwordless login
- **Email Verification**: Resend-powered OTP system with professional templates
- **AI Generation**: Google Gemini integration for headshot creation
- **Style Templates**: 8 pre-configured templates (LinkedIn, Corporate, Creative, etc.)
- **Background Jobs**: BullMQ + Redis for async processing
- **Cloud Storage**: Cloudflare R2 (S3-compatible) for image storage
- **Payment Processing**: Stripe one-time payments (3 pricing tiers)
- **PostgreSQL Database**: Drizzle ORM with type safety
- **Session Management**: PostgreSQL-backed sessions for security

## 📋 Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js + Firebase Admin SDK
- **Email**: Resend API
- **Storage**: Cloudflare R2 (S3-compatible)
- **Queue**: BullMQ + Redis
- **AI**: Google Gemini API
- **Payments**: Stripe
- **Image Processing**: Sharp

## 🏗️ Architecture

### Authentication Flow

**Email/Password Registration:**
1. User registers → Backend creates account
2. 6-digit OTP sent via Resend
3. User verifies email → Session created
4. Welcome email sent

**Google OAuth:**
1. Frontend gets Firebase ID token
2. Backend verifies with Firebase Admin SDK
3. User created/updated in PostgreSQL
4. Session created

**OTP Passwordless Login:**
1. User enters email
2. OTP code sent
3. Code verified → User logged in

### Database Schema

- **users**: User accounts (email, Google OAuth, Stripe customer ID)
- **headshot_batches**: Generation jobs and results
- **edit_requests**: User edit history
- **otp_codes**: Email verification codes
- **sessions**: User sessions (auto-created)

### API Routes

**Authentication:**
- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/verify-registration` - Verify OTP code
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/request-otp` - Request passwordless login code
- `POST /api/auth/login-otp` - Login with OTP
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

**Batches (Protected):**
- `GET /api/batches` - List user batches
- `POST /api/batches` - Create new batch (after payment)
- `GET /api/batches/:id` - Get batch details
- `POST /api/batches/:id/edit` - Request edit

**Stripe:**
- `POST /api/checkout/create-session` - Create checkout
- `POST /api/stripe/webhook` - Payment webhooks

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server
- Resend account
- Firebase project (for Google OAuth)
- Stripe account
- Cloudflare R2 bucket

### Quick Start

1. **Clone and install:**
```bash
git clone https://github.com/saleemjadallah/mydscvr.git
cd mydscvr
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup database:**
```bash
npm run db:push
```

4. **Start development server:**
```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Detailed Setup

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete setup instructions including:
- Firebase project creation
- Resend domain verification
- Stripe configuration
- Database migration
- Testing authentication flows

## 🔐 Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/headshothub

# Server
SESSION_SECRET=your_random_32_char_secret
FRONTEND_URL=http://localhost:5173

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Firebase (Google OAuth)
FIREBASE_PROJECT_ID=your-project-id
# OR: FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Cloudflare R2
R2_ENDPOINT=https://account_id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=headshot-storage
R2_PUBLIC_URL=https://cdn.yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_EXECUTIVE_PRICE_ID=price_...

# Redis
REDIS_URL=redis://localhost:6379

# AI
GEMINI_API_KEY=AIzaSy...
```

See `.env.example` for complete list with descriptions.

## 📝 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Run production build
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio (database UI)
```

## 🗂️ Project Structure

```
.
├── src/
│   ├── db/
│   │   ├── index.ts           # Database connection
│   │   └── schema.ts          # Drizzle schema definitions
│   ├── lib/
│   │   ├── auth.ts            # Authentication system
│   │   ├── firebase-admin.ts  # Firebase Admin SDK
│   │   ├── otp.ts             # OTP generation/verification
│   │   ├── mail.ts            # Resend email templates
│   │   ├── storage.ts         # R2 storage operations
│   │   ├── gemini.ts          # AI generation
│   │   ├── stripe.ts          # Payment processing
│   │   ├── queue.ts           # BullMQ setup
│   │   └── templates.ts       # Style templates
│   └── index.ts               # Express app entry point
├── .env.example               # Environment variables template
├── drizzle.config.ts          # Drizzle ORM configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
├── SETUP_GUIDE.md            # Detailed setup instructions
└── MIGRATION_SUMMARY.md      # Architecture documentation
```

## 🎨 Style Templates

HeadShotHub includes 8 professional templates:

1. **LinkedIn** (1:1, 1024x1024) - Business formal profiles
2. **Corporate** (4:5, 1080x1350) - Team pages, websites
3. **Creative** (3:4, 1080x1440) - Portfolio platforms
4. **Resume** (2:3, 800x1200) - CV applications
5. **Social** (1:1, 1080x1080) - Instagram, Facebook, Twitter
6. **Executive** (2:3, 1080x1620) - Leadership pages
7. **Casual** (4:5, 1080x1350) - Approachable team photos
8. **Speaker** (16:9, 1920x1080) - Conference promotion

Each template includes platform-specific dimensions, lighting, backgrounds, and AI prompts.

## 💰 Pricing Tiers

- **Basic** ($29): 40 headshots, 2 templates, 1 hour delivery
- **Professional** ($39): 100 headshots, 4 templates, 2 hours delivery
- **Executive** ($59): 200 headshots, 8 templates, 3 hours delivery

## 🧪 Testing

### Test Authentication

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Check email for OTP code, then verify
curl -X POST http://localhost:3000/api/auth/verify-registration \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

### Test Stripe Payments

Use Stripe test card: `4242 4242 4242 4242`

## 🚢 Deployment

### Railway (Recommended)

1. Create new project
2. Add PostgreSQL and Redis services
3. Connect GitHub repository
4. Set environment variables from `.env.example`
5. Deploy

**Important production variables:**
```bash
NODE_ENV=production
SESSION_SECRET=<strong_random_secret>
FIREBASE_SERVICE_ACCOUNT_JSON=<base64_encoded_json>
```

### Environment-specific Settings

**Development:**
- Uses `localhost` for CORS
- Session cookies: `secure=false`, `sameSite=lax`
- Email: Can use `onboarding@resend.dev`

**Production:**
- Multi-origin CORS via `ALLOWED_ORIGINS`
- Session cookies: `secure=true`, `sameSite=none`
- Email: Requires verified domain

## 📚 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup walkthrough
- [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Architecture details
- [.env.example](./.env.example) - All environment variables

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **Session Security**: HTTP-only, secure cookies in production
- **CORS Protection**: Configurable allowed origins
- **Input Validation**: Zod schemas on all endpoints
- **Firebase Token Verification**: Secure OAuth flow
- **Webhook Verification**: Stripe signature validation
- **Rate Limiting**: TODO (recommended for production)

## 🐛 Common Issues

### Firebase "auth/unauthorized-domain"
Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### Resend "Invalid API key"
Verify API key and domain verification in Resend dashboard

### Session not persisting
Check `SESSION_SECRET` is set and PostgreSQL connection is working

### CORS errors
Add frontend URL to `ALLOWED_ORIGINS` environment variable

## 📞 Support

For issues:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Verify environment variables
3. Check server logs
4. Review [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) for architecture

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

Saleem Jadallah

---

**Note**: This is the backend API. The frontend is in a separate repository.
