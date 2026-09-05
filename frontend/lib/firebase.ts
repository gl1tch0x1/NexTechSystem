import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
// Valid Google API keys always start with AIza
const isLiveKey = !!rawApiKey && rawApiKey.startsWith('AIza') && rawApiKey.length > 20;

export const firebaseConfig = {
  apiKey: isLiveKey ? rawApiKey : 'AIzaSyDemoStoreSSRSafeKey2026NexTechEnterprise',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'nextech-store-demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nextech-store-demo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'nextech-store-demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '102938475612',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:102938475612:web:9876543210abcdef',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DEMONEXTECH'
};

// Safe singleton Firebase app initialization
let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  app = initializeApp(firebaseConfig, 'nextech-fallback');
}

// Safe Auth initialization with SSR prerender protection
let auth: Auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = {} as Auth;
}

// Safe Firestore initialization
let db: Firestore;
try {
  db = getFirestore(app);
} catch (e) {
  db = {} as Firestore;
}

// Safe Storage initialization
let storage: FirebaseStorage;
try {
  storage = getStorage(app);
} catch (e) {
  storage = {} as FirebaseStorage;
}

// Safe Analytics initialization (Client-side browser only)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && isLiveKey && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn('Firebase Analytics initialization skipped:', err);
  });
}

export { app, auth, db, storage, analytics };
export default app;
