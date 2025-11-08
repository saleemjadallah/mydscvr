# HeadShotHub - Project Overview

## 🎯 What is HeadShotHub?

HeadShotHub is a modern AI-powered SaaS application that generates professional headshots for various platforms. Users upload 12-20 photos of themselves, select a pricing plan and style templates, and receive 40-200 AI-generated professional headshots optimized for different use cases (LinkedIn, resumes, corporate websites, social media, etc.).

## 🌟 Key Differentiators

### 1. **8 Platform-Optimized Style Templates**
Unlike competitors who generate generic headshots, HeadShotHub offers 8 distinct style templates, each optimized for specific platforms:

- **LinkedIn Professional**: Square format (1:1) for professional networking
- **Corporate Website**: Portrait format (4:5) for team pages
- **Creative Portfolio**: Creative portrait (3:4) for portfolios
- **Resume/CV**: Traditional portrait (2:3) for job applications
- **Social Media**: Square format (1:1) for Instagram/Facebook/Twitter
- **Executive Leadership**: Editorial portrait (2:3) for leadership bios
- **Approachable Professional**: Casual portrait (4:5) for team pages
- **Conference Speaker**: Landscape format (16:9) for event promotion

### 2. **Platform Preview Mockups**
Users can see exactly how their headshots will look in context:
- LinkedIn profile preview
- Resume header preview
- Corporate website team card preview
- Instagram profile preview
- Conference speaker card preview

### 3. **One-Time Pricing (Not Subscription)**
Three simple one-time purchase options:
- **Basic**: $29 for 40 headshots
- **Professional**: $39 for 100 headshots (Most Popular)
- **Executive**: $59 for 200 headshots

## 🏗️ Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  React 19 + TypeScript + Vite + Tailwind CSS                │
│  - Modern component architecture                             │
│  - Type-safe development                                     │
│  - Fast hot module replacement                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────────────────┐
│                         Backend                              │
│  Node.js + Express + TypeScript                              │
│  - RESTful API design                                        │
│  - Passport.js authentication                                │
│  - BullMQ job queue for async processing                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
   ┌────────┐    ┌─────────┐   ┌──────────┐   ┌─────────┐
   │Postgres│    │  Redis  │   │ Gemini   │   │  R2     │
   │  DB    │    │  Queue  │   │   AI     │   │ Storage │
   └────────┘    └─────────┘   └──────────┘   └─────────┘
```

### Database Schema

#### Users Table
- `id`: Unique user identifier
- `email`: User email (unique)
- `password`: Hashed password
- `name`: User's full name
- `uploads_used`: Track photo uploads
- `batches_created`: Track generation batches
- `createdAt`: Account creation timestamp

#### Headshot Batches Table
- `id`: Batch identifier
- `userId`: Foreign key to users
- `status`: processing | completed | failed
- `uploadedPhotos`: Array of R2 URLs
- `photoCount`: Number of uploaded photos
- `plan`: basic | professional | executive
- `styleTemplates`: Array of selected template IDs
- `generatedHeadshots`: Array of generated headshot objects
- `headshotCount`: Total headshots generated
- `headshotsByTemplate`: Count per template
- `amountPaid`: Payment amount in cents
- `stripePaymentId`: Stripe payment reference
- `createdAt`, `completedAt`, `processingTimeMinutes`

#### Edit Requests Table
- `id`: Request identifier
- `batchId`: Foreign key to batches
- `userId`: Foreign key to users
- `headshotId`: Reference to specific headshot
- `editType`: background_change | outfit_change | regenerate
- `status`: pending | completed | failed
- `resultUrl`: URL of edited headshot
- `createdAt`, `completedAt`

## 🔄 User Flow

### 1. Registration & Authentication
```
User visits homepage → Clicks "Get Started"
  → Registers with email/password
    → Email verification (optional)
      → Logged in → Redirected to dashboard
```

### 2. Headshot Generation Flow
```
Dashboard → Click "Create Headshots"
  → Upload Page
    → Step 1: Upload 12-20 photos
      → Validates: format (JPG/PNG), size (max 10MB), dimensions (min 500x500)
    → Step 2: Choose pricing plan
      → Basic ($29), Professional ($39), or Executive ($59)
    → Step 3: Select style templates
      → User picks from 8 templates
      → Shows preview and platform specs for each
    → Step 4: Checkout with Stripe
      → One-time payment
      → No subscription required
  → Payment Success
    → Redirected to Processing Page
    → Background job starts generation
    → Email sent: "Generation started"
  → Generation Complete (1-3 hours)
    → Email sent: "Your headshots are ready!"
    → User redirected to Batch View Page
```

### 3. Viewing & Downloading
```
Batch View Page
  → Template tabs (All, LinkedIn, Corporate, etc.)
  → Platform preview cards
  → Headshot gallery with filtering
  → Individual download or bulk ZIP download
  → Edit credits for modifications
```

## 🎨 Style Template System

Each template has:

### Configuration
```typescript
{
  id: 'linkedin',
  name: 'LinkedIn Professional',
  description: 'Business formal, neutral background',

  // Generation parameters
  background: 'Professional gray gradient or modern office',
  outfit: 'Business suit, blazer, or professional attire',
  lighting: 'Studio lighting, front-facing',
  expression: 'Confident, approachable smile',
  pose: 'Shoulders squared, direct eye contact',

  // Platform specifications
  platformSpecs: {
    aspectRatio: '1:1',
    dimensions: '1024x1024',
    optimizedFor: 'LinkedIn profile photo',
    fileFormat: 'JPG',
    colorProfile: 'sRGB',
  },

  // Gemini AI prompt
  geminiPrompt: 'Detailed prompt for AI generation...',
}
```

### How It Works

1. **User selects templates**: e.g., LinkedIn + Corporate + Social Media
2. **System calculates distribution**: 100 headshots ÷ 3 templates = ~33 per template
3. **AI generates variations**: Each template generates multiple variations
4. **Images processed**: Resized and optimized per platform specs
5. **Uploaded to R2**: Stored with organized keys
6. **Thumbnails created**: For fast gallery loading

## 💳 Payment System

### Stripe Integration

1. **Checkout Creation**
```typescript
// User clicks "Pay & Generate"
→ Backend creates Stripe checkout session
  → Line item: Selected plan
  → Metadata: userId, plan, uploadedPhotos, styleTemplates
  → Success URL: /processing?session_id={CHECKOUT_SESSION_ID}
  → Cancel URL: /upload
```

2. **Webhook Processing**
```typescript
// Stripe sends webhook: checkout.session.completed
→ Backend receives webhook
  → Verifies signature
  → Creates batch record in database
  → Enqueues generation job
  → Sends confirmation email
```

3. **No Subscriptions**
- All payments are one-time
- No recurring charges
- No cancellation flow needed
- Simple refund process if needed

## 🤖 AI Generation Pipeline

### Step 1: Photo Upload
```
User uploads photos → Validated → Uploaded to R2
  → Stored in: /uploads/{userId}/{batchId}/{photoIndex}.jpg
```

### Step 2: Payment & Queue
```
Payment successful → Batch created → Job enqueued in Redis
```

### Step 3: Background Processing
```
Worker picks up job from queue
  → For each selected template:
    → For each variation (based on plan):
      → Call Gemini API with:
        - Input photos
        - Template's geminiPrompt
        - Variation instructions
      → Process generated image:
        - Resize to template dimensions
        - Optimize quality
        - Generate thumbnail
      → Upload to R2:
        - Full: /generated/{userId}/{batchId}/{headshotId}.jpg
        - Thumb: /thumbnails/{userId}/{batchId}/{headshotId}.jpg
    → Track progress
  → Update batch status to 'completed'
  → Send completion email
```

### Step 4: Delivery
```
User receives email → Clicks link → Views batch
  → Downloads individual headshots or ZIP
```

## 📦 File Storage Structure (R2)

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
│           ├── corporate-0.jpg
│           └── ...
└── thumbnails/
    └── {userId}/
        └── {batchId}/
            ├── linkedin-0.jpg
            ├── linkedin-1.jpg
            └── ...
```

## 🔐 Security Features

1. **Authentication**: Passport.js with bcrypt password hashing
2. **Session Management**: Secure HTTP-only cookies
3. **CORS**: Restricted to frontend domain
4. **Input Validation**: File type, size, dimension checks
5. **Rate Limiting**: (TODO) Prevent abuse
6. **Secure Storage**: R2 with signed URLs for downloads
7. **Stripe Webhooks**: Signature verification

## 📊 Business Metrics to Track

### User Metrics
- Registration rate
- Conversion rate (visitor → purchase)
- Average order value
- Repeat purchase rate

### Product Metrics
- Most popular plan (likely Professional)
- Most selected templates (likely LinkedIn)
- Average photos uploaded
- Generation success rate
- Average processing time
- Edit credit usage

### Technical Metrics
- API response times
- Job queue processing times
- R2 storage usage
- Database query performance
- Error rates by endpoint

## 🚀 Deployment Strategy

### Frontend (Cloudflare Pages)
```bash
Build command: npm run build
Build output: dist/
Environment variables: VITE_API_URL, VITE_STRIPE_PUBLISHABLE_KEY
```

### Backend (Railway)
```bash
Start command: npm start
Build command: npm run build
Environment variables: All backend .env vars
Add-ons: PostgreSQL, Redis
```

### Database Migrations
```bash
# Push schema changes
drizzle-kit push

# Generate migrations (for production)
drizzle-kit generate
```

## 🔮 Future Enhancements

### Phase 2 (Post-MVP)
- [ ] Team/bulk pricing for companies
- [ ] Advanced editing tools (background removal, outfit change)
- [ ] More style templates (Industry-specific)
- [ ] Video headshots (15-second clips)
- [ ] API for enterprise integration

### Phase 3 (Scale)
- [ ] Mobile app (iOS/Android)
- [ ] LinkedIn auto-upload integration
- [ ] Resume builder integration
- [ ] White-label solution for agencies
- [ ] Multi-language support

## 📝 Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow Airbnb style guide
- **Prettier**: Auto-format on save
- **Comments**: Document complex logic

### Git Workflow
```
main (production)
  ← develop (staging)
    ← feature/* (feature branches)
```

### Testing Strategy
- **Unit Tests**: Critical business logic
- **Integration Tests**: API endpoints
- **E2E Tests**: User flows (upload → pay → download)

## 🤝 Contributing

This is a private commercial project. Core team only.

---

**This document serves as the single source of truth for HeadShotHub's architecture and design decisions.**
