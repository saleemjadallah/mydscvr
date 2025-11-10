# Google OAuth - Quick Start Guide

## ✅ Setup Status

**Backend**: ✅ Firebase Admin SDK initialized (`mydscvrfood`)
**Frontend**: ✅ Firebase Web SDK configured
**Status**: Ready to use!

## 🚀 Quick Usage

### 1. Add Google Sign-In Button to Your Component

```tsx
import { signInWithGoogle } from '@/lib/firebase';
import { authApi } from '@/lib/api';
import { useState } from 'react';

function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      // Get Firebase ID token
      const idToken = await signInWithGoogle();

      // Authenticate with backend
      const user = await authApi.googleAuth(idToken);

      // Success! Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <button onClick={handleGoogleSignIn} disabled={loading}>
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </button>
  );
}
```

### 2. Start Frontend (to load new env variables)

```bash
cd frontend
npm run dev
```

### 3. Test It!

1. Navigate to your login page
2. Click "Sign in with Google"
3. Select Google account in popup
4. You're logged in! 🎉

## 📋 Environment Variables

### Backend (.env) - Already Set ✅
```bash
FIREBASE_PROJECT_ID=mydscvrfood
FIREBASE_SERVICE_ACCOUNT_JSON=<base64-credentials>
```

### Frontend (.env) - Already Set ✅
```bash
VITE_FIREBASE_API_KEY=AIzaSyAO6n6ubEHSR6kNnF4o14Sxjs_eR-f0KRY
VITE_FIREBASE_AUTH_DOMAIN=mydscvrfood.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mydscvrfood
VITE_FIREBASE_STORAGE_BUCKET=mydscvrfood.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=9707316779
VITE_FIREBASE_APP_ID=1:9707316779:web:16835394526912abf8ac6e
VITE_FIREBASE_MEASUREMENT_ID=G-JHTY5SDEZL
```

## 🔄 Complete Sign-In Flow

```typescript
// 1. Import functions
import { signInWithGoogle } from '@/lib/firebase';
import { authApi } from '@/lib/api';

// 2. Call on button click
const idToken = await signInWithGoogle();  // Opens Google popup
const user = await authApi.googleAuth(idToken);  // Authenticates with backend

// 3. User is now logged in with session
console.log('Welcome', user.firstName);
```

## 🎯 What Happens Automatically

### First-Time Users
✅ Google popup opens
✅ User selects account
✅ Account created in database
✅ Welcome email sent
✅ Logged in with session
✅ Redirected to dashboard

### Returning Users
✅ Google popup opens
✅ User selects account
✅ Instantly logged in
✅ Redirected to dashboard

## 🔧 Available Functions

```typescript
// Sign in with Google
import { signInWithGoogle } from '@/lib/firebase';
const idToken = await signInWithGoogle();

// Authenticate with backend
import { authApi } from '@/lib/api';
const user = await authApi.googleAuth(idToken);

// Sign out
import { signOutFromFirebase } from '@/lib/firebase';
await signOutFromFirebase();
await authApi.logout();
```

## ⚡ Error Handling

```typescript
try {
  const idToken = await signInWithGoogle();
  const user = await authApi.googleAuth(idToken);
} catch (error: any) {
  // Handle specific errors
  if (error.message.includes('popup')) {
    console.error('Popup was blocked or closed');
  } else if (error.message.includes('exists')) {
    console.error('Account exists with different method');
  } else {
    console.error('Sign-in failed:', error.message);
  }
}
```

## 📱 Testing Checklist

- [ ] Restart frontend: `cd frontend && npm run dev`
- [ ] Open app in browser
- [ ] Click "Sign in with Google"
- [ ] Select Google account
- [ ] Verify logged in
- [ ] Check user in database
- [ ] Test sign out
- [ ] Test sign in again

## 🎉 That's It!

Your Google OAuth is fully configured and ready to use. See `GOOGLE_OAUTH_SETUP.md` for detailed documentation.

## 📚 Backend API

**Endpoint**: `POST /api/auth/google`

**Request**:
```json
{
  "idToken": "firebase-id-token"
}
```

**Response**:
```json
{
  "id": "user-id",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "authProvider": "google",
  "createdAt": "2025-11-09T..."
}
```

## 🐛 Common Issues

**Popup blocked**: Enable popups for localhost
**Firebase not configured**: Restart frontend to load .env
**401 Unauthorized**: Check Firebase token is valid
**CORS error**: Verify CORS settings in backend

---

**Status**: ✅ Ready to use
**Backend**: ✅ Running on localhost:3000
**Frontend**: ⏳ Restart to load new .env
