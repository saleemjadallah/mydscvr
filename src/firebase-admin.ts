import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'mydscvrfood',
};

// Initialize the admin SDK if not already initialized
// Use a try-catch to handle cases where admin.apps might not be defined
try {
  if (!admin.apps || admin.apps.length === 0) {
  let credential: admin.credential.Credential;

  // Check if service account file exists
  const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    // Use service account file if it exists
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
    console.log('[Firebase] Initialized with service account');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use Google Application Default Credentials if set
    credential = admin.credential.applicationDefault();
    console.log('[Firebase] Initialized with application default credentials');
  } else {
    // Fallback: Initialize without credentials (limited functionality)
    // This will work for verifying tokens but not for admin operations
    credential = admin.credential.applicationDefault();
    console.log('[Firebase] Initialized with default credentials (limited functionality)');
  }

    admin.initializeApp({
      credential,
      projectId: firebaseAdminConfig.projectId,
    });
  }
} catch (error) {
  console.log('[Firebase] Initialization check error, attempting to initialize:', error);
  // Fallback initialization if apps check fails
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseAdminConfig.projectId,
  });
}

// Export auth and firestore with error handling
let auth: admin.auth.Auth | null = null;
let firestore: admin.firestore.Firestore | null = null;

try {
  auth = admin.auth();
  firestore = admin.firestore();
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