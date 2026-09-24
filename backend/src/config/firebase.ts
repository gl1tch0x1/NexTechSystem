import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore as createFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { ENV } from './env.js';

let firebaseInitialized = false;
let firestoreInstance: Firestore | null = null;

export function initializeFirebase(): App | null {
  if (firebaseInitialized && getApps().length > 0) return getApp();

  const hasCredentials = Boolean(
    ENV.FIREBASE_PROJECT_ID &&
    ENV.FIREBASE_CLIENT_EMAIL &&
    ENV.FIREBASE_PRIVATE_KEY
  );
  if (!hasCredentials) {
    console.warn('[Firebase] Admin SDK not initialized because Firebase service-account credentials are missing or placeholder values were detected.');
    return null;
  }

  try {
    const app = initializeApp({
      credential: cert({
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
    });
    firebaseInitialized = true;
    console.log('[Firebase] Admin SDK initialized with service account for [%s].', ENV.FIREBASE_PROJECT_ID);

    firestoreInstance = createFirestore(app);
  } catch (err: any) {
    console.warn('[Firebase] Initialization notice:', err.message);
  }

  return getApps().length > 0 ? getApp() : null;
}

export const isFirebaseLive = (): boolean => firebaseInitialized && !!firestoreInstance;
export const getFirebaseAdmin = () => ({ getApp, getApps, initializeApp, cert, getAuth, getStorage });
export const getFirestore = (): Firestore | null => {
  if (!firestoreInstance) {
    initializeFirebase();
  }
  return firestoreInstance;
};
export const getFirebaseAuth = () => getAuth();
export const getFirebaseStorage = () => getStorage();
