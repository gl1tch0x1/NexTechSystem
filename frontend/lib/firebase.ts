import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseEnabled = process.env.NEXT_PUBLIC_FIREBASE_ENABLED === 'true';
const rawApiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').trim();
const rawAuthDomain = (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '').trim();
const rawProjectId = (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim();
const rawAppId = (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '').trim();

const isPlaceholderValue = (value: string | undefined) => {
  if (!value) return true;
  return /REPLACE_WITH_VALID|DEMO|your-project|your_project|placeholder|000000000000/i.test(value);
};

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain,
  projectId: rawProjectId,
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: rawAppId,
  measurementId: (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '').trim(),
};

const hasSafeClientConfig = Boolean(
  firebaseEnabled &&
  !isPlaceholderValue(rawApiKey) &&
  rawApiKey.startsWith('AIza') &&
  rawApiKey.length > 20 &&
  !isPlaceholderValue(rawAuthDomain) &&
  !isPlaceholderValue(rawProjectId) &&
  !isPlaceholderValue(rawAppId) &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const isLiveKey = hasSafeClientConfig;

let app: FirebaseApp | null = null;
if (!firebaseEnabled) {
  console.info('[Firebase] Client SDK is disabled. Set NEXT_PUBLIC_FIREBASE_ENABLED=true with a valid Firebase web config to enable authentication and analytics.');
} else if (hasSafeClientConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.warn('[Firebase] Client initialization failed:', error);
    app = null;
  }
} else {
  console.warn('[Firebase] Firebase client configuration is incomplete or invalid. Frontend auth and analytics are disabled until a valid, enabled project key is configured.');
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

  if (typeof window !== 'undefined' && firebaseConfig.measurementId && firebaseConfig.measurementId.startsWith('G-')) {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('[Firebase] Analytics initialization failed:', error);
    }
  }
}

export { app, auth, db, storage, analytics };
export default app;
