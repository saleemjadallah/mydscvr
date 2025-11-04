import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'mydscvrfood',
};

// Initialize the admin SDK if not already initialized
if (!admin.apps.length) {
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

export const auth = admin.auth();
export const firestore = admin.firestore();

/**
 * Verify a Firebase ID token and extract user information
 */
export async function verifyFirebaseToken(idToken: string) {
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