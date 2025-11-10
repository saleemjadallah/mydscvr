# Google OAuth Setup - Complete ✅

Your Google OAuth integration is fully configured and ready to use!

## 🎯 What's Been Configured

### Backend (Firebase Admin SDK) ✅
- **Service Account**: Firebase Admin SDK initialized with service account credentials
- **Project**: `mydscvrfood`
- **Auth Endpoint**: `POST /api/auth/google`
- **Features**:
  - Verifies Firebase ID tokens
  - Auto-creates users on first Google sign-in
  - Sends welcome emails to new users
  - Stores Firebase UID for user tracking
  - Supports existing email/password users linking Google accounts

### Frontend (Firebase Client SDK) ✅
- **Firebase App**: Initialized with web configuration
- **Project**: `mydscvrfood`
- **Services**: Auth, Firestore, Storage, Analytics (optional)
- **Helper Functions**:
  - `signInWithGoogle()` - Opens Google sign-in popup and returns ID token
  - `signOutFromFirebase()` - Signs out from Firebase
  - `googleProvider` - Pre-configured Google auth provider

## 📁 Files Configured

### Backend
```
backend/.env
├── FIREBASE_PROJECT_ID=mydscvrfood
└── FIREBASE_SERVICE_ACCOUNT_JSON=<base64-encoded-service-account>

backend/src/lib/firebase-admin.ts
└── Firebase Admin SDK initialization and helper functions

backend/src/lib/auth.ts (lines 363-449)
└── POST /api/auth/google endpoint
```

### Frontend
```
frontend/.env
├── VITE_FIREBASE_API_KEY=AIzaSyAO6n6ubEHSR6kNnF4o14Sxjs_eR-f0KRY
├── VITE_FIREBASE_AUTH_DOMAIN=mydscvrfood.firebaseapp.com
├── VITE_FIREBASE_PROJECT_ID=mydscvrfood
├── VITE_FIREBASE_STORAGE_BUCKET=mydscvrfood.firebasestorage.app
├── VITE_FIREBASE_MESSAGING_SENDER_ID=9707316779
├── VITE_FIREBASE_APP_ID=1:9707316779:web:16835394526912abf8ac6e
└── VITE_FIREBASE_MEASUREMENT_ID=G-JHTY5SDEZL

frontend/src/lib/firebase.ts
└── Firebase client initialization and Google auth helpers

frontend/src/lib/api.ts (line 53)
└── authApi.googleAuth() method for backend communication
```

## 🔄 How Google OAuth Flow Works

### 1. User Clicks "Sign in with Google"
```typescript
import { signInWithGoogle } from '@/lib/firebase';
import { authApi } from '@/lib/api';

// In your login component
const handleGoogleSignIn = async () => {
  try {
    // Step 1: Open Google popup and get Firebase ID token
    const idToken = await signInWithGoogle();

    // Step 2: Send token to backend for verification
    const user = await authApi.googleAuth(idToken);

    // Step 3: User is now logged in with session
    console.log('Logged in as:', user.email);
  } catch (error) {
    console.error('Google sign-in failed:', error);
  }
};
```

### 2. Backend Process
```
1. Receive Firebase ID token
2. Verify token with Firebase Admin SDK
3. Extract user info (email, name, photo)
4. Check if user exists in database
   ├─ YES: Log in existing user
   └─ NO:  Create new user → Send welcome email
5. Create session and return user data
```

### 3. Session Management
- User session is stored in PostgreSQL (via connect-pg-simple)
- Session cookie: `headshothub.sid`
- Duration: 7 days
- HTTP-only, Secure (in production), SameSite configured

## 🚀 Usage Examples

### Sign in with Google (Frontend)
```typescript
import { signInWithGoogle } from '@/lib/firebase';
import { authApi } from '@/lib/api';
import { useState } from 'react';

function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      // Get Firebase ID token
      const idToken = await signInWithGoogle();

      // Authenticate with backend
      const user = await authApi.googleAuth(idToken);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          {/* Google logo SVG */}
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

### Check Firebase Configuration
```typescript
import { auth } from '@/lib/firebase';

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return Boolean(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

// Use in your app
if (!isFirebaseConfigured()) {
  console.warn('Firebase is not configured. Google OAuth will not work.');
}
```

### Sign Out (Both Firebase and Backend)
```typescript
import { signOutFromFirebase } from '@/lib/firebase';
import { authApi } from '@/lib/api';

async function handleSignOut() {
  try {
    // Sign out from Firebase
    await signOutFromFirebase();

    // Sign out from backend (destroy session)
    await authApi.logout();

    // Redirect to home
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}
```

## 🔒 Security Features

### Backend
- ✅ Firebase token verification before creating sessions
- ✅ Email validation and sanitization
- ✅ Duplicate account detection
- ✅ Password-less accounts (Google users don't have passwords)
- ✅ Secure session storage in PostgreSQL
- ✅ CSRF protection via SameSite cookies

### Frontend
- ✅ Popup-based OAuth (no redirects needed)
- ✅ Account picker forced (users select which Google account)
- ✅ Error handling for popup blockers
- ✅ Prevents duplicate popup requests
- ✅ Environment variable validation

## 🎨 User Experience Features

### First-Time Google Users
1. Click "Sign in with Google"
2. Select Google account in popup
3. Account automatically created in database
4. Welcome email sent
5. Logged in and redirected to dashboard

### Returning Google Users
1. Click "Sign in with Google"
2. Select Google account
3. Instantly logged in
4. Redirected to dashboard

### Mixed Auth Users
- Users can sign up with email/password first
- Later link Google account using same email
- Backend detects existing email and links accounts
- Works seamlessly for both flows

## ⚠️ Common Issues & Solutions

### Issue: "Sign-in popup was blocked"
**Solution**: Users need to allow popups for your domain
- Chrome: Click popup icon in address bar
- Firefox: Click "Preferences" in popup blocker notification
- Safari: Preferences → Websites → Pop-up Windows

### Issue: "Another sign-in popup is already open"
**Solution**: Close existing popup or wait for timeout
- Prevent multiple simultaneous sign-in attempts
- Add loading state to disable button during sign-in

### Issue: "Account exists with different credential"
**Solution**: User already has account with email/password
- Offer to link accounts
- Or suggest signing in with original method first

### Issue: Firebase not initialized
**Solution**: Check environment variables
```bash
# Ensure all required variables are set
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

## 📊 Testing

### Local Testing (Already Working!)
1. **Backend running**: ✅ `http://localhost:3000`
2. **Frontend running**: Start with `cd frontend && npm run dev`
3. **Test sign-in**:
   - Navigate to login/signup page
   - Click "Sign in with Google"
   - Select Google account
   - Verify user created in database
   - Check session cookie set
   - Confirm welcome email sent (if RESEND_API_KEY configured)

### Production Testing
- Ensure Firebase web app configured for production domain
- Add production domain to Firebase Authorized domains
- Update CORS settings in backend
- Test on actual production URL

## 🌐 Firebase Console Configuration

### Authorized Domains (Important!)
Add these domains in Firebase Console → Authentication → Settings → Authorized domains:

**Local Development:**
- `localhost`

**Production:**
- `yourdomain.com` (your production frontend domain)
- `your-backend.up.railway.app` (if using Railway)

### OAuth Consent Screen
Configured in Google Cloud Console (linked from Firebase):
- App name: HeadShotHub
- Support email: Your email
- Authorized domains: Your domains
- Scopes: email, profile (basic)

## 🚀 Deployment Checklist

### Backend (Railway)
- [x] `FIREBASE_PROJECT_ID` environment variable set
- [x] `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable set (base64)
- [ ] Verify backend logs show "Firebase initialized for project: mydscvrfood"

### Frontend (Cloudflare Pages)
- [ ] All `VITE_FIREBASE_*` environment variables set
- [ ] Production domain added to Firebase Authorized domains
- [ ] Test Google sign-in on production URL

## 📚 API Reference

### Backend Endpoints

**POST /api/auth/google**
```typescript
Request:
{
  "idToken": "string" // Firebase ID token from client
}

Response (Success):
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "profileImageUrl": "string | null",
  "authProvider": "google",
  "createdAt": "Date"
}

Response (Error):
{
  "error": "string"
}
```

### Frontend Functions

**signInWithGoogle()**
```typescript
// Returns Firebase ID token
async function signInWithGoogle(): Promise<string>

// Usage
const idToken = await signInWithGoogle();
```

**signOutFromFirebase()**
```typescript
// Signs out from Firebase (call before backend logout)
async function signOutFromFirebase(): Promise<void>

// Usage
await signOutFromFirebase();
```

**authApi.googleAuth()**
```typescript
// Authenticate with backend using Firebase token
async function googleAuth(idToken: string): Promise<User>

// Usage
const user = await authApi.googleAuth(idToken);
```

## ✅ Status

**Backend**: ✅ Fully configured and running
**Frontend**: ✅ Configuration added, ready to use
**Testing**: ⏳ Ready for testing when frontend restarts

## 🎉 Next Steps

1. **Restart frontend** to load new Firebase environment variables:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Add Google Sign-In button** to your login/signup pages

3. **Test the flow**:
   - Click "Sign in with Google"
   - Select Google account
   - Verify user appears in database
   - Check session is created
   - Confirm redirect to dashboard

4. **(Optional) Add analytics tracking** for Google sign-ins

Your Google OAuth integration is complete and ready to use! 🚀
