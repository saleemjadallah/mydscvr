# HeadShotHub - Directory Structure

```
HeadShotHub/
├── README.md                          # Main project documentation
├── QUICKSTART.md                      # Quick setup guide
├── PROJECT_OVERVIEW.md                # Architecture and design decisions
├── NEXT_STEPS.md                      # Development roadmap
├── DIRECTORY_STRUCTURE.md             # This file
├── .gitignore                         # Git ignore rules
│
├── frontend/                          # React Frontend Application
│   ├── package.json                   # Frontend dependencies
│   ├── package-lock.json              # Lock file
│   ├── tsconfig.json                  # TypeScript config
│   ├── tsconfig.node.json             # Node TypeScript config
│   ├── vite.config.ts                 # Vite bundler config
│   ├── tailwind.config.ts             # Tailwind CSS config
│   ├── postcss.config.js              # PostCSS config
│   ├── index.html                     # HTML entry point
│   ├── .env.example                   # Example environment variables
│   │
│   ├── public/                        # Static assets
│   │   └── assets/
│   │       ├── templates/             # Template preview images
│   │       └── sample-uploads/        # Before/after examples
│   │
│   └── src/                           # Source code
│       ├── main.tsx                   # Application entry point
│       ├── App.tsx                    # Main app component with routing
│       ├── index.css                  # Global styles
│       │
│       ├── components/                # React components
│       │   ├── Layout.tsx            # Main layout with header/footer
│       │   ├── ui/                   # Reusable UI components (TODO)
│       │   ├── mockups/              # Platform preview components (TODO)
│       │   └── templates/            # Template-related components (TODO)
│       │
│       ├── pages/                     # Page components
│       │   ├── HomePage.tsx          # Landing page
│       │   ├── PricingPage.tsx       # Pricing page (placeholder)
│       │   ├── LoginPage.tsx         # Login page (placeholder)
│       │   ├── RegisterPage.tsx      # Registration page (placeholder)
│       │   ├── DashboardPage.tsx     # User dashboard (placeholder)
│       │   ├── UploadPage.tsx        # Photo upload & plan selection (placeholder)
│       │   ├── ProcessingPage.tsx    # Generation progress (placeholder)
│       │   └── BatchViewPage.tsx     # View generated headshots (placeholder)
│       │
│       ├── lib/                       # Utility libraries
│       │   ├── api.ts                # API client functions
│       │   ├── plans.ts              # Pricing plan configurations
│       │   ├── templates.ts          # Style template definitions
│       │   └── utils.ts              # Helper functions
│       │
│       └── types/                     # TypeScript type definitions
│           └── index.ts              # Shared types
│
├── backend/                           # Node.js Backend API
│   ├── package.json                   # Backend dependencies
│   ├── package-lock.json              # Lock file
│   ├── tsconfig.json                  # TypeScript config
│   ├── drizzle.config.ts              # Drizzle ORM config
│   ├── .env.example                   # Example environment variables
│   │
│   └── src/                           # Source code
│       ├── index.ts                   # Express server entry point
│       │
│       ├── db/                        # Database layer
│       │   ├── schema.ts             # Database schema with Drizzle
│       │   └── index.ts              # Database connection
│       │
│       ├── lib/                       # Core libraries
│       │   ├── gemini.ts             # Google Gemini AI integration
│       │   ├── storage.ts            # Cloudflare R2 storage operations
│       │   ├── stripe.ts             # Stripe payment processing
│       │   ├── queue.ts              # BullMQ job queue for async tasks
│       │   ├── plans.ts              # Pricing plan configurations
│       │   └── templates.ts          # Style template definitions
│       │
│       ├── routes/                    # API routes (TODO)
│       │   ├── auth.ts               # Authentication routes
│       │   ├── batches.ts            # Batch CRUD routes
│       │   └── checkout.ts           # Stripe checkout routes
│       │
│       ├── middleware/                # Express middleware (TODO)
│       │   ├── auth.ts               # Authentication middleware
│       │   ├── upload.ts             # File upload handler
│       │   └── errorHandler.ts       # Error handling
│       │
│       └── types/                     # TypeScript type definitions (TODO)
│           └── index.ts              # Shared types
│
└── [Future additions]
    ├── docs/                          # Additional documentation
    ├── scripts/                       # Deployment and utility scripts
    └── tests/                         # Test files
        ├── frontend/                  # Frontend tests
        └── backend/                   # Backend tests
```

## Key Files Explanation

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies and scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `vite.config.ts` | Frontend build tool configuration |
| `tailwind.config.ts` | CSS framework configuration |
| `drizzle.config.ts` | Database ORM configuration |
| `.env.example` | Template for environment variables |

### Frontend Core Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | React application entry point |
| `src/App.tsx` | Main routing and authentication logic |
| `src/index.css` | Global CSS styles with Tailwind |
| `src/lib/api.ts` | Centralized API calls to backend |
| `src/lib/templates.ts` | 8 style template configurations |
| `src/lib/plans.ts` | Pricing plan definitions ($29/$39/$59) |
| `src/types/index.ts` | TypeScript interfaces and types |

### Backend Core Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Express server with routes and middleware |
| `src/db/schema.ts` | Database tables: users, batches, edits |
| `src/lib/gemini.ts` | AI headshot generation logic |
| `src/lib/storage.ts` | R2 file upload/download operations |
| `src/lib/stripe.ts` | Payment session creation and webhooks |
| `src/lib/queue.ts` | Background job processing with BullMQ |
| `src/lib/templates.ts` | Template definitions for AI prompts |

## Database Tables

### users
- User accounts and authentication
- Tracks upload and batch usage

### headshot_batches
- Generation batches with status tracking
- Stores input photos and generated results
- Links to payment information

### edit_requests
- Edit credit usage tracking
- Background/outfit change requests

## API Routes (To Be Implemented)

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Batches
- `POST /api/batches/upload` - Upload photos
- `POST /api/batches/create` - Create batch
- `GET /api/batches` - List user batches
- `GET /api/batches/:id` - Get batch details
- `DELETE /api/batches/:id` - Delete batch
- `GET /api/batches/:id/status` - Check status

### Checkout
- `POST /api/checkout/create-session` - Start payment
- `POST /api/checkout/webhook` - Stripe webhook
- `GET /api/checkout/verify/:id` - Verify payment

## Storage Structure (R2)

```
headshot-storage/
├── uploads/
│   └── {userId}/
│       └── {batchId}/
│           ├── 0.jpg
│           ├── 1.jpg
│           └── ...
├── generated/
│   └── {userId}/
│       └── {batchId}/
│           ├── linkedin-0.jpg
│           ├── linkedin-1.jpg
│           └── ...
└── thumbnails/
    └── {userId}/
        └── {batchId}/
            ├── linkedin-0.jpg
            └── ...
```

## Component Hierarchy (Frontend)

```
App
├── Layout
│   ├── Header (navigation, auth buttons)
│   ├── Main Content
│   │   ├── HomePage
│   │   ├── PricingPage
│   │   ├── LoginPage
│   │   ├── RegisterPage
│   │   ├── DashboardPage
│   │   │   └── BatchCard (multiple)
│   │   ├── UploadPage
│   │   │   ├── PhotoUploader
│   │   │   ├── PlanSelector
│   │   │   ├── TemplateSelector
│   │   │   └── CheckoutButton
│   │   ├── ProcessingPage
│   │   └── BatchViewPage
│   │       ├── TemplateTabs
│   │       ├── PlatformPreview (multiple)
│   │       ├── HeadshotGallery
│   │       │   └── HeadshotCard (multiple)
│   │       └── DownloadButtons
│   └── Footer
└── (Auth Context Provider)
```

## Data Flow

### Upload → Generate → View

```
1. User uploads photos
   ├── Frontend: UploadPage.tsx
   └── Backend: POST /api/batches/upload
       └── Storage: R2 /uploads/{userId}/{batchId}/

2. User selects plan & templates
   └── Frontend: UploadPage.tsx state

3. User pays via Stripe
   ├── Frontend: Stripe.js checkout
   ├── Backend: POST /api/checkout/create-session
   └── Stripe: Checkout page

4. Stripe confirms payment
   ├── Stripe: Webhook to backend
   ├── Backend: POST /api/checkout/webhook
   └── Database: Create batch record

5. Job enqueued for generation
   ├── Backend: queue.ts
   └── Redis: BullMQ job

6. Worker processes job
   ├── Backend: Worker picks up job
   ├── AI: Gemini API generates images
   ├── Processing: sharp resizes images
   └── Storage: R2 /generated/{userId}/{batchId}/

7. Batch marked complete
   ├── Database: Update status = 'completed'
   └── Email: Completion notification

8. User views results
   ├── Frontend: BatchViewPage.tsx
   └── Backend: GET /api/batches/:id
```

---

**This structure provides a scalable foundation for HeadShotHub's growth from MVP to enterprise solution.**
