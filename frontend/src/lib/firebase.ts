import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.warn(
    `[Firebase] Missing configuration keys: ${missingKeys.join(', ')}. ` +
    'Google authentication will not work. Please check your environment variables.'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (only in production)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('[Firebase] Analytics initialization failed:', error);
  }
}

// Setup Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account', // Always show account picker
});

// Optional: Add additional scopes if needed
// googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

export default app;
