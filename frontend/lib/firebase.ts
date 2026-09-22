import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

const hasValidClientConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const isLiveKey = hasValidClientConfig;

let app: FirebaseApp | null = null;
if (hasValidClientConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.warn('[Firebase] Client initialization failed:', error);
    app = null;
  }
} else {
  console.warn('[Firebase] Firebase client environment variables are missing. Frontend auth will remain disabled until they are configured in production.');
}

let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

if (app) {
  try {
    auth = getAuth(app);
  } catch (error) {
    console.warn('[Firebase] Auth initialization failed:', error);
  }

  try {
    db = getFirestore(app);
  } catch (error) {
    console.warn('[Firebase] Firestore initialization failed:', error);
  }

  try {
    storage = getStorage(app);
  } catch (error) {
    console.warn('[Firebase] Storage initialization failed:', error);
  }

  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('[Firebase] Analytics initialization failed:', error);
    }
  }
}

export { app, auth, db, storage, analytics };
export default app;
