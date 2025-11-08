# Migration Summary: MyDscvrFood → HeadShotHub

This document summarizes the complete architecture and configuration migration from MyDscvrFood to HeadShotHub.

## ✅ Completed Migrations

### 1. Database Schema Updates
**File:** `backend/src/db/schema.ts`

**Changes:**
- Updated `users` table with OAuth and Stripe fields:
  - `passwordHash` (nullable for OAuth users)
  - `firstName` and `lastName` (split from `name`)
  - `profileImageUrl`
  - `stripeCustomerId`
  - `authProvider` ('email' | 'google')
  - `firebaseUid` (for Google OAuth)
  - `updatedAt` timestamp
- Added `otpCodes` table for email verification and passwordless login
- Added `sessions` table schema reference (created by connect-pg-simple)
- Updated UUID generation to use `crypto.randomUUID()`

### 2. Backend Authentication System

#### **Firebase Admin SDK** (`backend/src/lib/firebase-admin.ts`)
- Supports 3 credential methods:
  1. Service account JSON file
  2. Environment variable (base64 or JSON string)
  3. Application default credentials
- Functions: `verifyFirebaseToken`, `getFirebaseUser`, `getFirebaseUserByEmail`, `deleteFirebaseUser`

#### **OTP System** (`backend/src/lib/otp.ts`)
- Generates 6-digit numeric codes
- Configurable expiry (default 10 minutes)
- Supports two purposes: `login` and `registration`
- Functions:
  - `requestLoginOtp()` - Send OTP for existing users
  - `verifyLoginOtp()` - Verify and log in with OTP
  - `requestRegistrationOtp()` - Send OTP after registration
  - `verifyRegistrationOtp()` - Verify email and complete registration
  - `cleanupExpiredOtpCodes()` - Maintenance function

#### **Complete Auth Module** (`backend/src/lib/auth.ts`)
- **Session management** with PostgreSQL store (connect-pg-simple)
- **Passport.js** with Local strategy
- **Auth routes:**
  - `POST /api/auth/register` - Email/password registration (sends OTP)
  - `POST /api/auth/verify-registration` - Verify email with OTP code
  - `POST /api/auth/login` - Email/password login
  - `POST /api/auth/request-otp` - Request OTP for passwordless login
  - `POST /api/auth/login-otp` - Login with OTP code
  - `POST /api/auth/google` - Google OAuth (Firebase ID token)
  - `POST /api/auth/logout` - Logout and destroy session
  - `GET /api/auth/me` - Get current user
- **Middleware:** `isAuthenticated` / `requireAuth` for protected routes
- **Validation:** Zod schemas for all inputs
- **Security:** Auto-detects production mode for secure cookies

### 3. Email System (Resend)

**File:** `backend/src/lib/mail.ts`

**Features:**
- Core `sendEmail()` function using Resend API
- Professional HTML email templates:
  - **Welcome Email** - Sent after email verification
  - **OTP Email** - 6-digit code with expiry warning
  - **Batch Completion Email** - Notify when headshots are ready
  - **Payment Confirmation Email** - Receipt after successful payment
- Responsive table-based layouts
- HeadShotHub branding (blue gradient #3b82f6)
- Automatic text fallback generation

### 4. R2 Storage Enhancements

**File:** `backend/src/lib/storage.ts`

**Added functions:**
- `deleteImages()` - Delete multiple images by URL
- `uploadBase64Image()` - Upload base64-encoded images
- `uploadBuffer()` - Upload buffer with custom content type
- `deleteBatchFiles()` - Now actually lists and deletes all files

**Configuration:**
- Supports both `R2_ENDPOINT` and `R2_ACCOUNT_ID`
- Added cache control headers (1-year cache)

### 5. Backend Entry Point

**File:** `backend/src/index.ts`

**Improvements:**
- Integrated new auth system via `setupAuth()`
- Multi-origin CORS support from `ALLOWED_ORIGINS` env var
- Raw body preservation for Stripe webhooks
- Better error handling and logging
- Protected route examples

### 6. Frontend Firebase Configuration

**File:** `frontend/src/lib/firebase.ts`

**Features:**
- Initializes Firebase app with env variables
- Exports: `auth`, `db`, `storage`, `analytics`
- Google Auth Provider with `select_account` prompt
- Validates configuration and warns if missing

### 7. Frontend Components

#### **Google Sign-In Button** (`frontend/src/components/GoogleSignInButton.tsx`)
- Firebase popup authentication
- Sends ID token to backend
- Loading states and error handling
- Custom redirect support
- Accessible design with proper disabled states

#### **Email Verification Page** (`frontend/src/pages/VerifyEmailPage.tsx`)
- 6-digit OTP input with auto-focus
- Paste support (auto-submit on complete code)
- Auto-submit when all digits filled
- Resend code functionality
- Success animation and redirect
- Responsive design

### 8. Frontend API Client

**File:** `frontend/src/lib/api.ts`

**New Auth Endpoints:**
- `authApi.register()` - Register with firstName/lastName
- `authApi.verifyRegistration()` - Verify OTP code
- `authApi.login()` - Email/password login
- `authApi.requestOtp()` - Request passwordless login code
- `authApi.loginWithOtp()` - Login with OTP
- `authApi.googleAuth()` - Google OAuth with Firebase token
- `authApi.logout()` - Logout
- `authApi.me()` - Get current user

### 9. Dependencies

#### **Backend** (`backend/package.json`)
**Added:**
- `firebase-admin@^12.0.0` - Google OAuth backend
- `resend@^3.2.0` - Email service
- `connect-pg-simple@^9.0.1` - PostgreSQL session store
- `pg@^8.11.3` - PostgreSQL driver for sessions
- `zod@^3.22.4` - Input validation
- `@types/pg@^8.10.0` - TypeScript types

#### **Frontend** (`frontend/package.json`)
**Added:**
- `firebase@^10.8.0` - Firebase SDK for Google OAuth

### 10. Environment Variables

#### **Backend** (`.env.example`)
**New variables:**
- `ALLOWED_ORIGINS` - Comma-separated CORS origins
- `SESSION_SECRET` - Session encryption key
- `SESSION_COOKIE_DOMAIN` - For cross-domain sessions
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Sender email address
- `OTP_CODE_EXPIRY_MINUTES` - OTP lifetime
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Service account JSON/base64
- Plus all Stripe, R2, Redis, Gemini variables

#### **Frontend** (`.env.example`)
**New variables:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_OTP_CODE_EXPIRY_MINUTES`

---

## 🔧 Next Steps (TODO)

### 1. Stripe Integration (One-Time Payments)
**Required files to create:**
- `backend/src/lib/stripe.ts` - Stripe client and checkout logic
- Update `backend/src/index.ts` with:
  - `POST /api/checkout/create-session` - Create Stripe checkout
  - `POST /api/stripe/webhook` - Handle payment events

**Key differences from MyDscvrFood:**
- One-time payments instead of subscriptions
- No customer portal needed
- Simpler webhook handling (just `checkout.session.completed`)

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 3. Database Migration
```bash
cd backend
npm run db:push
```

This will create the new tables:
- Updated `users` table with new columns
- New `otp_codes` table
- New `sessions` table (auto-created by connect-pg-simple)

### 4. Firebase Setup

**Step 1: Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "HeadShotHub"
3. Enable Google Analytics (optional)

**Step 2: Enable Google Authentication**
1. Go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Set up OAuth consent screen in Google Cloud Console
4. Add authorized domains (localhost, your production domain)

**Step 3: Get Firebase Config**
1. Go to **Project Settings** → **General**
2. Scroll to "Your apps" → Add web app
3. Copy configuration object
4. Add to `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=headshothub.firebaseapp.com
# ... etc
```

**Step 4: Generate Service Account**
1. Go to **Project Settings** → **Service Accounts**
2. Click "Generate new private key"
3. Download JSON file
4. Choose one option:
   - **Option A:** Save as `backend/firebase-service-account.json`
   - **Option B:** Base64 encode and set `FIREBASE_SERVICE_ACCOUNT_JSON` env var
   - **Option C:** Set `GOOGLE_APPLICATION_CREDENTIALS` to file path

### 5. Resend Email Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain
3. Generate API key
4. Add to `backend/.env`:
```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 6. Update Frontend Auth Pages

**Files that need updates to use new components:**

1. **RegisterPage** (`frontend/src/pages/RegisterPage.tsx`):
   - Split `name` into `firstName` and `lastName`
   - Add `<GoogleSignInButton />`
   - Redirect to `/verify-email?email={email}` after registration
   - Update API call to use `authApi.register()`

2. **LoginPage** (`frontend/src/pages/LoginPage.tsx`):
   - Add `<GoogleSignInButton />`
   - Add "Login with code" option (OTP flow)
   - Update API call to use `authApi.login()`

3. **Add Route** (`frontend/src/main.tsx` or router config):
```tsx
import VerifyEmailPage from './pages/VerifyEmailPage';

// Add route:
<Route path="/verify-email" element={<VerifyEmailPage />} />
```

### 7. Update Types

**File:** `frontend/src/types/index.ts`

Update User type:
```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  authProvider: 'email' | 'google';
  firebaseUid?: string;
  stripeCustomerId?: string;
  uploads_used: number;
  batches_created: number;
  createdAt: string;
  updatedAt: string;
}
```

### 8. Testing Checklist

#### Backend Testing:
```bash
cd backend
npm run dev

# Test endpoints with curl or Postman:
# 1. Health check
curl http://localhost:3000/api/health

# 2. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# 3. Verify registration (check email for code)
curl -X POST http://localhost:3000/api/auth/verify-registration \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'

# 4. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Frontend Testing:
```bash
cd frontend
npm run dev

# Visit http://localhost:5173
# Test:
# 1. Register flow (email + OTP verification)
# 2. Google Sign-In button
# 3. Login flow
# 4. OTP login flow
# 5. Logout
```

### 9. Production Deployment

**Environment Variables to Set:**
1. **Backend (Railway/similar):**
   - All variables from `.env.example`
   - Use production values for DATABASE_URL, STRIPE_SECRET_KEY, etc.
   - Set `NODE_ENV=production`
   - Set `SESSION_COOKIE_DOMAIN` if needed for cross-domain
   - Add `ALLOWED_ORIGINS` with production frontend URL

2. **Frontend (Cloudflare Pages):**
   - All `VITE_*` variables from `.env.example`
   - Use production Firebase config
   - Use production Stripe publishable key

**Firebase:**
- Add production domain to authorized domains in Firebase Console
- Update OAuth consent screen with production URLs

**Cloudflare:**
- Same R2 bucket can be used (already configured)
- Just update `R2_PUBLIC_URL` if using custom domain

---

## 📋 Architecture Summary

### Authentication Flow

**Email/Password Registration:**
1. User submits registration form
2. Backend creates user with hashed password
3. Backend generates 6-digit OTP and sends via email
4. User enters OTP on verification page
5. Backend verifies OTP and logs user in
6. Backend sends welcome email

**Google OAuth:**
1. User clicks "Continue with Google" button
2. Firebase shows Google account picker
3. User selects account and authorizes
4. Frontend gets Firebase ID token
5. Frontend sends token to backend `/api/auth/google`
6. Backend verifies token with Firebase Admin SDK
7. Backend creates/updates user in PostgreSQL
8. Backend creates session and logs user in
9. Welcome email sent for new users

**Passwordless Login (OTP):**
1. User enters email on login page
2. Backend generates OTP and sends via email
3. User enters 6-digit code
4. Backend verifies OTP and logs user in

### Session Management
- PostgreSQL-backed sessions via `connect-pg-simple`
- 7-day session lifetime
- HTTP-only, secure (in production), SameSite cookies
- Auto-detection of production mode for security settings

### Email Templates
All emails use HeadShotHub branding:
- Blue gradient header (#3b82f6 → #2563eb)
- Professional typography
- Responsive table-based layout
- Plain text fallback

---

## 🎯 Key Improvements from MyDscvrFood

1. **Better Session Management:** PostgreSQL-backed sessions (more reliable than in-memory)
2. **Enhanced Security:** Auto-detection of production mode, better CORS handling
3. **Improved OTP System:** Automatic cleanup, better error messages
4. **Better Email Templates:** HeadShotHub-branded, professional design
5. **Frontend Components:** Reusable GoogleSignInButton and VerifyEmailPage
6. **Type Safety:** Zod validation on all inputs
7. **Better Logging:** Contextual logging throughout
8. **Environment Flexibility:** Multiple ways to configure Firebase credentials

---

## 📞 Support

For issues with the migration:
1. Check environment variables are set correctly
2. Ensure dependencies are installed (`npm install`)
3. Run database migration (`npm run db:push`)
4. Check Firebase console for OAuth configuration
5. Verify Resend domain is verified

Common issues:
- **Firebase errors:** Check service account credentials
- **Email not sending:** Verify Resend API key and domain
- **Session issues:** Check `SESSION_SECRET` is set
- **CORS errors:** Add frontend URL to `ALLOWED_ORIGINS`
