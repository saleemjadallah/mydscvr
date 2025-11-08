# HeadShotHub - AI Headshot Generator SaaS

Professional AI headshots in minutes. Built with React 19, TypeScript, Node.js, PostgreSQL, and Google Gemini API.

## 🌟 Features

- **8 Style Templates**: LinkedIn, Corporate, Creative, Resume, Social Media, Executive, Casual, and Conference Speaker
- **Platform-Optimized**: Each template generates headshots optimized for specific platforms with correct dimensions and aspect ratios
- **One-Time Payments**: Three pricing tiers ($29, $39, $59) with Stripe integration
- **Fast Generation**: 1-3 hour turnaround time depending on plan
- **High Quality**: Studio-quality headshots using Google Gemini AI
- **Full Rights**: Users get full commercial rights to all generated headshots

## 📋 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS v4** for styling
- **React Router** for navigation
- **Stripe** for payments
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** with Drizzle ORM
- **Google Gemini API** for AI image generation
- **Cloudflare R2** for image storage (S3-compatible)
- **BullMQ + Redis** for job queue
- **Passport.js** for authentication
- **Stripe** for payment processing

### Infrastructure
- **Cloudflare Pages** (Frontend deployment)
- **Railway** (Backend + PostgreSQL + Redis)
- **Cloudflare R2** (Image storage)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Railway account)
- Redis instance (or Railway Redis)
- Cloudflare R2 bucket
- Google Gemini API key
- Stripe account

### Installation

1. **Clone the repository**
```bash
cd ~/Desktop/HeadShotHub
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Install backend dependencies**
```bash
cd ../backend
npm install
```

### Configuration

#### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/headshotsdb

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=headshot-storage
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Redis
REDIS_URL=redis://default:password@host:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_xxx
STRIPE_PRICE_PROFESSIONAL=price_xxx
STRIPE_PRICE_EXECUTIVE=price_xxx

# Email (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
FROM_EMAIL=noreply@headshotsaas.com

# App
SESSION_SECRET=your_random_secret_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
```

#### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Database Setup

1. **Push schema to database**
```bash
cd backend
npm run db:push
```

2. **Optional: Open Drizzle Studio**
```bash
npm run db:studio
```

### Running Locally

1. **Start backend**
```bash
cd backend
npm run dev
```

2. **Start frontend** (in a new terminal)
```bash
cd frontend
npm run dev
```

3. **Visit** `http://localhost:5173`

## 📁 Project Structure

```
HeadShotHub/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # UI components
│   │   │   ├── mockups/         # Platform mockup components
│   │   │   ├── templates/       # Template-related components
│   │   │   └── Layout.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── PricingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── UploadPage.tsx
│   │   │   ├── ProcessingPage.tsx
│   │   │   └── BatchViewPage.tsx
│   │   ├── lib/
│   │   │   ├── api.ts           # API client
│   │   │   ├── plans.ts         # Pricing plans
│   │   │   ├── templates.ts     # Style templates
│   │   │   └── utils.ts         # Utility functions
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   └── assets/
│   │       ├── templates/       # Template preview images
│   │       └── sample-uploads/  # Sample before/after images
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts        # Database schema
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── gemini.ts        # Gemini AI integration
│   │   │   ├── storage.ts       # Cloudflare R2 storage
│   │   │   ├── stripe.ts        # Stripe payments
│   │   │   ├── queue.ts         # BullMQ job queue
│   │   │   ├── plans.ts         # Pricing plans
│   │   │   └── templates.ts     # Style templates
│   │   ├── routes/              # API routes (TODO)
│   │   ├── middleware/          # Express middleware (TODO)
│   │   └── index.ts             # Express server
│   ├── package.json
│   ├── tsconfig.json
│   └── drizzle.config.ts
│
└── README.md
```

## 💳 Pricing Plans

### Basic Plan - $29
- 40 professional headshots
- 4 unique backgrounds
- 4 outfit styles
- 4 edit credits
- 3-hour turnaround
- High-resolution downloads
- Full commercial rights

### Professional Plan - $39 (Most Popular)
- 100 professional headshots
- 10 unique backgrounds
- 10 outfit styles
- 10 edit credits
- 2-hour turnaround
- High-resolution downloads
- Full commercial rights
- Priority support

### Executive Plan - $59
- 200 professional headshots
- 20 unique backgrounds
- 20 outfit styles
- 20 edit credits
- 1-hour turnaround
- High-resolution downloads
- Full commercial rights
- Priority support
- Satisfaction guarantee

## 🎨 Style Templates

1. **LinkedIn Professional** (1:1, 1024x1024) - Business formal, optimized for LinkedIn profiles
2. **Corporate Website** (4:5, 1080x1350) - Team consistency, company website pages
3. **Creative Portfolio** (3:4, 1080x1440) - Personality-forward, portfolio platforms
4. **Resume / CV** (2:3, 800x1200) - Traditional conservative, print-ready
5. **Social Media** (1:1, 1080x1080) - Friendly warm, Instagram/Facebook/Twitter
6. **Executive Leadership** (2:3, 1080x1620) - Premium authoritative, leadership pages
7. **Approachable Professional** (4:5, 1080x1350) - Relaxed friendly, team pages
8. **Conference Speaker** (16:9, 1920x1080) - Confident engaging, event promotion

## 🔧 Stripe Setup

1. **Create Products in Stripe Dashboard**

```bash
# Basic Plan
stripe prices create \
  --unit-amount=2900 \
  --currency=usd \
  --product-data='{"name":"Basic Headshot Plan"}'

# Professional Plan
stripe prices create \
  --unit-amount=3900 \
  --currency=usd \
  --product-data='{"name":"Professional Headshot Plan"}'

# Executive Plan
stripe prices create \
  --unit-amount=5900 \
  --currency=usd \
  --product-data='{"name":"Executive Headshot Plan"}'
```

2. **Update `.env` with price IDs**

3. **Set up webhook endpoint** at `/api/checkout/webhook`

## 📦 Deployment

### Frontend (Cloudflare Pages)

```bash
cd frontend
npm run build
# Deploy dist/ folder to Cloudflare Pages
```

### Backend (Railway)

```bash
cd backend
# Connect to Railway and deploy
railway up
```

### Environment Variables

Set all environment variables in Railway dashboard for production.

## 🎯 Roadmap

### Phase 1: MVP (Current)
- ✅ 8 style templates
- ✅ One-time payment system
- ✅ Photo upload & generation
- ✅ User authentication
- ⏳ Complete frontend pages
- ⏳ Complete API routes
- ⏳ Gemini integration
- ⏳ Email notifications

### Phase 2: Enhancement
- [ ] Before/after comparison slider
- [ ] Platform preview mockups
- [ ] Favorite/star system
- [ ] Bulk download as ZIP
- [ ] Edit credits system
- [ ] Admin dashboard

### Phase 3: Advanced
- [ ] Team/bulk pricing
- [ ] API for enterprise clients
- [ ] Video headshots
- [ ] LinkedIn auto-upload
- [ ] Mobile app

## 🤝 Contributing

This is a private SaaS project. For questions or issues, please contact the repository owner.

## 📄 License

Proprietary - All rights reserved.

---

**Built with ❤️ using React, TypeScript, Node.js, and Google Gemini AI**
