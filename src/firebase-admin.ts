import type { App, AppOptions, ServiceAccount } from 'firebase-admin/app';
import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'mydscvrfood',
};

let firebaseApp: App | undefined;

try {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = getApp();
  } else {
    const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
    const options: AppOptions = {
      projectId: firebaseAdminConfig.projectId,
    };

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;
      options.credential = cert(serviceAccount);
      console.log('[Firebase] Initialized with service account');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '';
        const jsonString = raw.trim().startsWith('{')
          ? raw
          : Buffer.from(raw, 'base64').toString('utf8');
        options.credential = cert(JSON.parse(jsonString) as ServiceAccount);
        console.log('[Firebase] Initialized with service account from environment');
      } catch (envError) {
        console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', envError);
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        options.credential = applicationDefault();
        console.log('[Firebase] Initialized with application default credentials');
      } catch (credentialError) {
        console.warn('[Firebase] Application default credentials not available:', credentialError);
        console.warn('[Firebase] Continuing without explicit credentials (limited functionality)');
      }
    } else {
      console.warn('[Firebase] No service account or application default credentials found');
      console.warn('[Firebase] Initializing without explicit credentials (limited functionality)');
    }

    firebaseApp = initializeApp(options);
  }
} catch (error) {
  console.error('[Firebase] Failed to initialize app:', error);
}

// Export auth and firestore with error handling
let auth: Auth | null = null;
let firestore: Firestore | null = null;

try {
  if (!firebaseApp) {
    throw new Error('Firebase app is not initialized');
  }

  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
} catch (error) {
  console.error('[Firebase] Failed to initialize services:', error);
  console.log('[Firebase] Google Sign-In will be disabled');
}

export { auth, firestore };

/**
 * Verify a Firebase ID token and extract user information
 */
export async function verifyFirebaseToken(idToken: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Google Sign-In is disabled.');
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get or create user from Firebase token
 */
export async function getFirebaseUser(uid: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Google Sign-In is disabled.');
  }

  try {
    const firebaseUser = await auth.getUser(uid);
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      providerData: firebaseUser.providerData,
    };
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    throw new Error('User not found');
  }
}
