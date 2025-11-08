# HeadShotHub Setup Guide

This guide will help you set up HeadShotHub from scratch with all the new authentication features.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server (for job queue)
- Resend account (for emails)
- Firebase project (for Google OAuth)
- Stripe account (for payments)
- Cloudflare R2 bucket (for storage)

---

## 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

---

## 2. Database Setup

### Create PostgreSQL Database

```sql
CREATE DATABASE headshothub;
```

### Run Migration

```bash
cd backend
npm run db:push
```

This creates the following tables:
- `users` - User accounts
- `headshot_batches` - Batch processing records
- `edit_requests` - Edit tracking
- `otp_codes` - Email verification codes
- `sessions` - User sessions

### Verify Tables

```bash
npm run db:studio
```

Visit `https://local.drizzle.studio` to inspect the database.

---

## 3. Firebase Setup (Google OAuth)

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: "HeadShotHub"
4. Enable Google Analytics (optional)
5. Click "Create project"

### Enable Google Sign-In

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Click **Google** provider
5. Enable and click **Save**

### Configure OAuth Consent

1. Click "Configure OAuth consent screen"
2. Choose **External** (or Internal for Google Workspace)
3. Fill in:
   - App name: "HeadShotHub"
   - User support email: your email
   - Developer contact: your email
4. Add scopes (default is fine)
5. Save and continue

### Get Frontend Config

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to "Your apps" section
3. Click **Web** app icon (`</>`)
4. Register app: "HeadShotHub Web"
5. Copy the config object

### Create Backend Service Account

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Save it in one of these ways:

   **Option A (Recommended for development):**
   ```bash
   # Save as firebase-service-account.json in backend folder
   mv ~/Downloads/headshothub-*.json backend/firebase-service-account.json

   # Add to .gitignore (already there)
   ```

   **Option B (For production/Railway):**
   ```bash
   # Base64 encode the file
   cat firebase-service-account.json | base64

   # Set as environment variable
   export FIREBASE_SERVICE_ACCOUNT_JSON="<base64_string>"
   ```

   **Option C (Using Google Cloud credentials):**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-service-account.json"
   ```

### Add Authorized Domains

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add:
   - `localhost` (for development)
   - Your production domain (e.g., `headshothub.com`)

---

## 4. Resend Email Setup

### Create Account

1. Sign up at [resend.com](https://resend.com)
2. Choose free plan (3,000 emails/month)

### Verify Domain

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `headshothub.com`)
4. Add DNS records (SPF, DKIM, DMARC)
5. Wait for verification (usually ~5 minutes)

**For development:** Use `onboarding@resend.dev` as the sender (100 emails/day limit)

### Generate API Key

1. Go to **API Keys**
2. Click **Create API Key**
3. Name: "HeadShotHub Production"
4. Permission: Full Access
5. Copy the key (starts with `re_`)

---

## 5. Configure Environment Variables

### Backend Environment

Create `backend/.env` (copy from `.env.example`):

```bash
# Server
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/headshothub

# Session
SESSION_SECRET=generate_a_random_32_char_secret_here_use_openssl_rand_base64_32

# Resend Email
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@headshothub.com
OTP_CODE_EXPIRY_MINUTES=10

# Firebase (if using service account file)
FIREBASE_PROJECT_ID=your-firebase-project-id
# Or set FIREBASE_SERVICE_ACCOUNT_JSON for production

# Cloudflare R2
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=headshot-storage
R2_PUBLIC_URL=https://cdn.headshothub.com

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

### Generate Session Secret

```bash
# On macOS/Linux
openssl rand -base64 32

# Or Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Frontend Environment

Create `frontend/.env` (copy from `.env.example`):

```bash
# Backend API
VITE_API_URL=http://localhost:3000

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Firebase (from step 3)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=headshothub.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=headshothub
VITE_FIREBASE_STORAGE_BUCKET=headshothub.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef...
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional
VITE_OTP_CODE_EXPIRY_MINUTES=10
```

---

## 6. Update Frontend Pages

### Add Verify Email Route

**File:** `frontend/src/main.tsx` (or your router file)

```tsx
import VerifyEmailPage from './pages/VerifyEmailPage';

// Add to routes:
<Route path="/verify-email" element={<VerifyEmailPage />} />
```

### Update Register Page

**File:** `frontend/src/pages/RegisterPage.tsx`

```tsx
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { authApi } from '../lib/api';

// In the component:
const [step, setStep] = useState<'form' | 'verify'>('form');
const [email, setEmail] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const result = await authApi.register({
      email,
      password,
      firstName,
      lastName,
    });

    // Redirect to verification page
    navigate(`/verify-email?email=${encodeURIComponent(email)}`);
  } catch (error) {
    // Handle error
  }
};

// In the JSX:
<form onSubmit={handleSubmit}>
  <input name="email" type="email" required />
  <input name="firstName" placeholder="First Name" required />
  <input name="lastName" placeholder="Last Name" />
  <input name="password" type="password" required />
  <button type="submit">Sign Up</button>
</form>

<div className="divider">OR</div>

<GoogleSignInButton redirectTo="/dashboard" />
```

### Update Login Page

**File:** `frontend/src/pages/LoginPage.tsx`

```tsx
import { GoogleSignInButton } from '../components/GoogleSignInButton';

// Add Google Sign-In:
<GoogleSignInButton redirectTo="/dashboard" />

// Optional: Add OTP login flow
<button onClick={() => setLoginMethod('otp')}>
  Login with code
</button>
```

---

## 7. Start Development Servers

### Terminal 1: Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ HeadShotHub API running on http://localhost:3000
📝 Environment: development
🌐 CORS Origins: http://localhost:5173
🔐 Session store: PostgreSQL
[Auth] Authentication routes registered
[Firebase] Successfully initialized for project: headshothub
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev
```

Visit: `http://localhost:5173`

---

## 8. Test Authentication Flows

### Test 1: Email/Password Registration

1. Go to `/register`
2. Fill in:
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Password: `password123`
3. Click "Sign Up"
4. Check your email for 6-digit code
5. Enter code on `/verify-email` page
6. Should redirect to `/dashboard`

### Test 2: Google Sign-In

1. Go to `/login` or `/register`
2. Click "Continue with Google"
3. Select Google account
4. Should redirect to `/dashboard`

### Test 3: OTP Login

1. Go to `/login`
2. Click "Login with code" (if implemented)
3. Enter email
4. Check email for 6-digit code
5. Enter code
6. Should be logged in

### Test 4: Session Persistence

1. Log in
2. Refresh page
3. Should still be logged in
4. Open DevTools → Application → Cookies
5. Should see `headshothub.sid` cookie

---

## 9. Verify Email Delivery

### Check Resend Logs

1. Go to [Resend Dashboard](https://resend.com/emails)
2. Click on sent emails
3. Verify:
   - OTP email was sent
   - Welcome email was sent
   - No errors

### Test Email Content

Send test email via backend:

```bash
# In backend folder
node -e "
const { sendWelcomeEmail } = require('./dist/lib/mail.js');
sendWelcomeEmail('your-email@example.com', 'Test').then(() => console.log('Sent!'));
"
```

---

## 10. Common Issues & Solutions

### Issue: Firebase "auth/unauthorized-domain"

**Solution:** Add domain to Firebase authorized domains
1. Go to Firebase Console → Authentication → Settings
2. Add `localhost` and your production domain

### Issue: Resend "Invalid API key"

**Solution:** Regenerate API key
1. Go to Resend → API Keys
2. Delete old key
3. Create new key
4. Update `RESEND_API_KEY` in `.env`

### Issue: "Failed to send email"

**Solution:** Check domain verification
1. Go to Resend → Domains
2. Verify DNS records are correct
3. Wait for propagation (~5 min)
4. For development, use `onboarding@resend.dev`

### Issue: CORS errors

**Solution:** Check ALLOWED_ORIGINS
```bash
# In backend/.env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Issue: Session not persisting

**Solution:** Check session secret
```bash
# Generate new secret
openssl rand -base64 32

# Add to backend/.env
SESSION_SECRET=<generated_secret>
```

### Issue: Database connection error

**Solution:** Verify DATABASE_URL
```bash
# Test connection
psql "postgresql://user:password@localhost:5432/headshothub"
```

---

## 11. Production Deployment

### Railway (Backend)

1. Create new project on [Railway](https://railway.app)
2. Add PostgreSQL and Redis services
3. Deploy from GitHub
4. Set environment variables from `backend/.env.example`
5. Important production variables:
   ```bash
   NODE_ENV=production
   SESSION_SECRET=<strong_random_secret>
   FIREBASE_SERVICE_ACCOUNT_JSON=<base64_encoded>
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

### Cloudflare Pages (Frontend)

1. Connect GitHub repo
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variables from `frontend/.env.example`
5. Add all `VITE_*` variables

### Update Firebase

1. Add production domain to authorized domains
2. Update OAuth consent screen with production URLs

### Test Production

1. Register new account
2. Verify Google Sign-In works
3. Check email delivery
4. Test payment flow (when implemented)

---

## 12. Next Steps

Now that authentication is set up:

1. **Implement Stripe Integration** - Add one-time payment checkout
2. **Build Upload Flow** - Photo upload with batch creation
3. **Integrate Gemini AI** - Headshot generation
4. **Add BullMQ Workers** - Background job processing
5. **Create Dashboard** - Display batches and generated photos

---

## 📞 Need Help?

- Check `MIGRATION_SUMMARY.md` for detailed architecture
- Review `CLAUDE.md` for project conventions
- Check logs in terminal for error messages
- Verify all environment variables are set correctly

---

## 🎉 Success!

If you've completed all steps and can:
- ✅ Register with email/password
- ✅ Receive and verify OTP codes
- ✅ Sign in with Google
- ✅ Stay logged in after refresh
- ✅ Receive welcome emails

**You're ready to continue building HeadShotHub!** 🚀
