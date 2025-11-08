import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';
import fs from 'fs';
import path from 'path';

/**
 * Initialize Firebase Admin SDK
 * Supports 3 methods for providing credentials:
 * 1. Service account JSON file (firebase-service-account.json)
 * 2. FIREBASE_SERVICE_ACCOUNT_JSON env var (base64 or JSON string)
 * 3. GOOGLE_APPLICATION_CREDENTIALS (application default)
 */
let firebaseApp: admin.app.App;

try {
  // Method 1: Try loading from file
  const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log('[Firebase] Initializing with service account file');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
  // Method 2: Try loading from environment variable
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    console.log('[Firebase] Initializing with FIREBASE_SERVICE_ACCOUNT_JSON env var');

    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    // Check if it's base64 encoded
    if (!serviceAccountJson.trim().startsWith('{')) {
      serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
    }

    const serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }
  // Method 3: Use application default credentials
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_PROJECT_ID) {
    console.log('[Firebase] Initializing with application default credentials');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  // No credentials found
  else {
    console.warn('[Firebase] No credentials found. Firebase features will be disabled.');
    console.warn('[Firebase] To enable, provide one of:');
    console.warn('[Firebase]   1. firebase-service-account.json file');
    console.warn('[Firebase]   2. FIREBASE_SERVICE_ACCOUNT_JSON env var');
    console.warn('[Firebase]   3. GOOGLE_APPLICATION_CREDENTIALS env var');

    // Initialize with minimal config (will throw errors if used)
    firebaseApp = admin.initializeApp({
      projectId: 'headshothub',
    });
  }

  console.log(`[Firebase] Successfully initialized for project: ${firebaseApp.options.projectId}`);
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
  throw error;
}

/**
 * Verify a Firebase ID token
 * @param idToken - Firebase ID token from client
 * @returns Decoded token with user info
 */
export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log(`[Firebase] Token verified for user: ${decodedToken.uid}`);
    return decodedToken;
  } catch (error) {
    console.error('[Firebase] Token verification failed:', error);
    throw new Error('Invalid Firebase token');
  }
}

/**
 * Get Firebase user data by UID
 * @param uid - Firebase user UID
 * @returns Firebase user record
 */
export async function getFirebaseUser(uid: string) {
  try {
    const userRecord = await admin.auth().getUser(uid);
    console.log(`[Firebase] Retrieved user: ${userRecord.email}`);
    return userRecord;
  } catch (error) {
    console.error(`[Firebase] Error fetching user ${uid}:`, error);
    throw new Error('Failed to fetch Firebase user');
  }
}

/**
 * Get Firebase user by email
 * @param email - User email address
 * @returns Firebase user record or null
 */
export async function getFirebaseUserByEmail(email: string) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    console.error(`[Firebase] Error fetching user by email ${email}:`, error);
    throw new Error('Failed to fetch Firebase user by email');
  }
}

/**
 * Delete a Firebase user
 * @param uid - Firebase user UID
 */
export async function deleteFirebaseUser(uid: string) {
  try {
    await admin.auth().deleteUser(uid);
    console.log(`[Firebase] Deleted user: ${uid}`);
  } catch (error) {
    console.error(`[Firebase] Error deleting user ${uid}:`, error);
    throw new Error('Failed to delete Firebase user');
  }
}

export { firebaseApp };
export default admin;
