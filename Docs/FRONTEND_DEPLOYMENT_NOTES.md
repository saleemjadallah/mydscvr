# Frontend Deployment Notes

## ✅ Changes Pushed to GitHub

**Repository**: https://github.com/saleemjadallah/mydscvr.frontend
**Commit**: `bedf4c4` - feat: Add Google OAuth sign-in and sign-out helper functions

### What Was Pushed
- ✅ `src/lib/firebase.ts` - Added Google OAuth helper functions
  - `signInWithGoogle()` - Returns Firebase ID token
  - `signOutFromFirebase()` - Signs out from Firebase
  - Comprehensive error handling for auth scenarios

### What Was NOT Pushed (Intentional)
- ❌ `.env` file - Contains secrets, properly gitignored ✓
- ❌ `node_modules/` - Dependencies, gitignored ✓
- ❌ `dist/` - Build output, gitignored ✓

## 🌐 Production Deployment Checklist

### 1. Environment Variables (Cloudflare Pages / Your Hosting)

You need to configure these environment variables in your production environment:

```bash
# Backend API
VITE_API_URL=https://your-railway-backend.up.railway.app

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here

# Firebase (Google OAuth)
VITE_FIREBASE_API_KEY=AIzaSyAO6n6ubEHSR6kNnF4o14Sxjs_eR-f0KRY
VITE_FIREBASE_AUTH_DOMAIN=mydscvrfood.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mydscvrfood
VITE_FIREBASE_STORAGE_BUCKET=mydscvrfood.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=9707316779
VITE_FIREBASE_APP_ID=1:9707316779:web:16835394526912abf8ac6e
VITE_FIREBASE_MEASUREMENT_ID=G-JHTY5SDEZL
```

### 2. Firebase Console Configuration

**Add Production Domain to Authorized Domains**:
1. Go to: https://console.firebase.google.com/
2. Select project: `mydscvrfood`
3. Navigate to: Authentication → Settings → Authorized domains
4. Click "Add domain"
5. Add your production domain (e.g., `yourdomain.com`)

### 3. Backend CORS Configuration

Ensure your backend (Railway) has the production frontend URL in `ALLOWED_ORIGINS`:

```bash
# In Railway backend environment variables
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Or in backend `.env`:
```bash
FRONTEND_URL=https://yourdomain.com
```

### 4. Build & Deploy

**For Cloudflare Pages**:
```bash
# Build command
npm run build

# Output directory
dist

# Environment variables
Set all VITE_* variables in Cloudflare Pages settings
```

**For Vercel**:
```bash
# Build command
npm run build

# Output directory
dist

# Environment variables
Set all VITE_* variables in Vercel project settings
```

**For Netlify**:
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
Set all VITE_* variables in Netlify site settings
```

## 🔒 Security Notes

### Local Development (.env)
- ✅ Uses `http://localhost:3000` for backend
- ✅ Uses Firebase test configuration
- ✅ File is gitignored (not in repository)

### Production (.env.production or hosting env vars)
- ⚠️ Must use HTTPS for backend URL
- ⚠️ Must use production Stripe publishable key
- ⚠️ Firebase config can stay the same (supports multiple domains)
- ⚠️ Add production domain to Firebase Authorized domains

## 📊 Current Setup Status

| Environment | Backend | Frontend | Firebase | Status |
|-------------|---------|----------|----------|--------|
| Local Dev | ✅ localhost:3000 | ✅ localhost:5173 | ✅ Configured | Ready |
| Production | ⏳ Railway | ⏳ Deploy needed | ⏳ Add domain | Pending |

## 🚀 Deployment Steps

### Step 1: Deploy Frontend
1. Push changes to GitHub (✅ Done)
2. Connect repository to hosting platform
3. Configure environment variables
4. Deploy

### Step 2: Configure Firebase
1. Add production domain to Authorized domains
2. Verify OAuth redirect works
3. Test Google sign-in on production

### Step 3: Update Backend
1. Add production frontend URL to CORS
2. Restart backend service
3. Test API calls from production frontend

### Step 4: Verify
1. Test Google OAuth flow
2. Test image upload
3. Test batch creation
4. Test downloads

## 🧪 Testing Production Deployment

After deploying, test these flows:

### Authentication
- [ ] Email/password registration
- [ ] Email/password login
- [ ] OTP login
- [ ] **Google OAuth login** ← New feature
- [ ] Logout

### Core Features
- [ ] Photo upload
- [ ] Batch creation
- [ ] Payment flow (Stripe)
- [ ] Headshot generation
- [ ] Single download
- [ ] ZIP download

## 📝 Local .env Example

For reference, your local `.env` should look like:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# Stripe Publishable Key (test mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Firebase Configuration (for Google OAuth)
VITE_FIREBASE_API_KEY=AIzaSyAO6n6ubEHSR6kNnF4o14Sxjs_eR-f0KRY
VITE_FIREBASE_AUTH_DOMAIN=mydscvrfood.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mydscvrfood
VITE_FIREBASE_STORAGE_BUCKET=mydscvrfood.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=9707316779
VITE_FIREBASE_APP_ID=1:9707316779:web:16835394526912abf8ac6e
VITE_FIREBASE_MEASUREMENT_ID=G-JHTY5SDEZL
```

## 🔗 Related Documentation

- `GOOGLE_OAUTH_SETUP.md` - Complete Google OAuth documentation
- `GOOGLE_AUTH_QUICK_START.md` - Quick start guide
- `R2_STORAGE_SETUP.md` - R2 storage configuration
- `R2_INTEGRATION_SUMMARY.md` - R2 integration overview

## ⚡ Quick Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

## 🐛 Troubleshooting

### Google OAuth Not Working in Production
1. Check Firebase Authorized domains includes your domain
2. Verify VITE_FIREBASE_* env vars are set
3. Check browser console for errors
4. Ensure backend CORS allows your domain

### Build Fails
1. Check all dependencies installed: `npm install`
2. Verify TypeScript types: `npm run type-check`
3. Check for missing environment variables

### API Calls Fail
1. Verify VITE_API_URL points to correct backend
2. Check backend CORS configuration
3. Ensure backend is running
4. Check network tab for 403/404 errors

---

**Status**: ✅ Frontend changes pushed to GitHub
**Next**: Deploy to production and configure environment variables
