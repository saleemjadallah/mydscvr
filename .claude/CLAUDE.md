# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HeadShotHub is an AI-powered SaaS that generates professional headshots optimized for different platforms (LinkedIn, corporate websites, resumes, social media, etc.). Users upload 12-20 photos, select a pricing plan and style templates, and receive 40-200 AI-generated headshots within 1-3 hours.

**Tech Stack:**
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express + TypeScript + PostgreSQL (Drizzle ORM) + Redis (BullMQ)
- **AI**: Google Gemini API for image generation
- **Storage**: Cloudflare R2 (S3-compatible)
- **Payments**: Stripe (one-time payments, no subscriptions)

## Development Commands

### Frontend (`frontend/`)
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production (runs tsc then vite build)
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend (`backend/`)
```bash
npm run dev          # Start dev server with tsx watch (http://localhost:3000)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled production build
npm run db:push      # Push schema changes to database (Drizzle)
npm run db:studio    # Open Drizzle Studio for database inspection
```

### Development Workflow
1. Start backend: `cd backend && npm run dev`
2. Start frontend in new terminal: `cd frontend && npm run dev`
3. Backend runs on port 3000, frontend on port 5173
4. For database changes: Edit `backend/src/db/schema.ts` then run `npm run db:push`

## Architecture

### Monorepo Structure
```
HeadShotHub/
├── frontend/          # React SPA
│   ├── src/
│   │   ├── pages/     # Route components (HomePage, DashboardPage, etc.)
│   │   ├── components/ # Reusable UI components
│   │   ├── lib/       # API client (api.ts), plans, templates, utils
│   │   └── types/     # TypeScript type definitions
│   └── public/assets/ # Static assets (template previews, sample images)
│
└── backend/           # Express API
    ├── src/
    │   ├── index.ts   # Main Express app with auth routes
    │   ├── db/        # Drizzle ORM schema and connection
    │   ├── lib/       # Core services (gemini, storage, stripe, queue, templates)
    │   ├── routes/    # API route handlers (TODO - mostly in index.ts currently)
    │   └── middleware/ # Express middleware (TODO)
    └── drizzle.config.ts # Drizzle Kit configuration
```

### Database Schema (PostgreSQL + Drizzle ORM)

**Users Table** (`users`):
- Authentication and user management
- Fields: `id`, `email`, `password`, `name`, `uploads_used`, `batches_created`, `createdAt`
- Password hashing with bcryptjs

**Headshot Batches Table** (`headshot_batches`):
- Core entity tracking each generation job
- Input: `uploadedPhotos` (R2 URLs), `photoCount`, `plan`, `styleTemplates`
- Output: `generatedHeadshots` (array of objects with URL, template, specs, etc.)
- Status tracking: `processing` → `completed` | `failed`
- Pricing: `amountPaid`, `stripePaymentId`

**Edit Requests Table** (`edit_requests`):
- Tracks user edit credits usage
- Types: `background_change`, `outfit_change`, `regenerate`
- Status: `pending` → `completed` | `failed`

### Style Template System

Eight templates defined in both `backend/src/lib/templates.ts` and `frontend/src/lib/templates.ts`:
1. **linkedin**: 1:1 (1024x1024) - Business formal for LinkedIn profiles
2. **corporate**: 4:5 (1080x1350) - Team pages, company websites
3. **creative**: 3:4 (1080x1440) - Portfolio platforms
4. **resume**: 2:3 (800x1200) - Resume/CV applications
5. **social**: 1:1 (1080x1080) - Instagram/Facebook/Twitter
6. **executive**: 2:3 (1080x1620) - Executive leadership pages
7. **casual**: 4:5 (1080x1350) - Approachable team photos
8. **speaker**: 16:9 (1920x1080) - Conference promotion

Each template includes:
- Platform-specific dimensions and aspect ratios
- Detailed `geminiPrompt` for AI generation
- Background, outfit, lighting, and expression guidelines

### Payment Flow (Stripe One-Time Payments)

1. User uploads photos on `/upload` page
2. Selects plan (Basic $29, Professional $39, Executive $59)
3. Selects style templates
4. Backend creates Stripe checkout session with metadata
5. Stripe redirects to success URL: `/processing?session_id={ID}`
6. Stripe webhook (`checkout.session.completed`) triggers:
   - Batch creation in database
   - Job enqueued in BullMQ/Redis
   - Confirmation email sent
7. Background worker processes generation job
8. Completion email sent when ready

**Important**: All payments are one-time purchases, no subscription logic needed.

### Image Storage (Cloudflare R2)

```
headshot-storage/
├── uploads/{userId}/{batchId}/*.jpg       # Original uploaded photos
├── generated/{userId}/{batchId}/*.jpg     # AI-generated headshots
└── thumbnails/{userId}/{batchId}/*.jpg    # Thumbnail versions
```

## Key Integration Points

### Authentication (Passport.js + Session)
- Strategy: Local strategy with email/password
- Session stored with express-session (HTTP-only cookies)
- Routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- Backend: `src/index.ts` lines 39-156

### API Client (Frontend)
- Centralized in `frontend/src/lib/api.ts`
- Uses Axios with credentials: true for session cookies
- Base URL from `VITE_API_URL` environment variable

### Job Queue (BullMQ + Redis)
- Background processing for AI generation (avoids long request timeouts)
- Queue setup in `backend/src/lib/queue.ts`
- Jobs enqueued after successful Stripe payment
- Worker processes jobs asynchronously

### AI Generation (Google Gemini)
- Integration in `backend/src/lib/gemini.ts`
- Uses template-specific prompts from `templates.ts`
- Processes multiple variations per template based on plan

## Important Architectural Notes

### Shared Configuration
- **Plans**: Defined in both `backend/src/lib/plans.ts` and `frontend/src/lib/plans.ts`. Keep in sync.
- **Templates**: Defined in both `backend/src/lib/templates.ts` and `frontend/src/lib/templates.ts`. Keep in sync.
- When modifying plans or templates, update both frontend and backend versions.

### Environment Variables
Backend requires: `DATABASE_URL`, `GEMINI_API_KEY`, `SESSION_SECRET`, `FRONTEND_URL`, `R2_*` credentials, `REDIS_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*` IDs.

Frontend requires: `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`.

### Type Safety
- Strict TypeScript mode enabled in both frontend and backend
- Database types auto-generated from Drizzle schema via `$inferSelect` and `$inferInsert`
- Shared types should be duplicated or kept in sync between frontend/backend

### Current Implementation Status
- ✅ User authentication (register/login)
- ✅ Database schema defined
- ✅ Style templates configured
- ✅ Frontend pages scaffolded (8 pages)
- ✅ Pricing plans defined
- ⏳ API routes for batches/checkout (TODO placeholders exist)
- ⏳ Gemini AI integration (setup code exists, needs completion)
- ⏳ Stripe webhook handling (needs implementation)
- ⏳ BullMQ job processing (queue setup exists, worker needs implementation)
- ⏳ Email notifications (nodemailer in dependencies)

### Testing Payments
Use Stripe test mode:
- Test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP code

## Development Guidelines

### Adding New API Routes
1. Create route handler (consider organizing in `backend/src/routes/`)
2. Add to Express app in `backend/src/index.ts`
3. Update frontend API client (`frontend/src/lib/api.ts`)
4. Ensure authentication middleware if needed

### Adding New Style Templates
1. Add to `backend/src/lib/templates.ts` with geminiPrompt
2. Add to `frontend/src/lib/templates.ts` with UI metadata
3. Create preview image in `frontend/public/assets/templates/`
4. Update template selection UI if needed

### Database Migrations
For development: `npm run db:push` (directly pushes schema changes)
For production: Use `drizzle-kit generate` then apply migrations

### Image Processing Pipeline
1. User uploads → validated → stored in R2 `/uploads/`
2. Payment confirmed → batch created → job enqueued
3. Worker fetches uploads → calls Gemini API per template
4. Generated images → processed with Sharp (resize/optimize)
5. Uploaded to R2 `/generated/` and `/thumbnails/`
6. Batch updated with results → user notified

## Common Patterns

### Creating Protected Routes (Backend)
```typescript
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  next();
};

app.get('/api/protected', requireAuth, (req, res) => {
  // Handler
});
```

### API Response Format
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Error message" }
```

### File Upload Handling
Use multer middleware for multipart/form-data, then upload to R2 via `@aws-sdk/client-s3`.

## Deployment

- **Frontend**: Cloudflare Pages (build: `npm run build`, output: `dist/`)
- **Backend**: Railway (with PostgreSQL and Redis add-ons)
- **Storage**: Cloudflare R2 bucket
- Set all environment variables in respective platforms

## Reference Documentation

For detailed architecture decisions, see:
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Complete architecture and design
- [README.md](./README.md) - Setup and tech stack
- [QUICKSTART.md](./QUICKSTART.md) - Local development setup
