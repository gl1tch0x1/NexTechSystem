import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const rawApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
// Valid Google API keys always start with AIza and are not demo placeholders
export const isLiveKey = !!rawApiKey && rawApiKey.startsWith('AIza') && rawApiKey.length > 20 && !rawApiKey.includes('DemoStore');

export const firebaseConfig = {
  apiKey: isLiveKey ? rawApiKey : 'AIzaSyDemoStoreSSRSafeKey2026NexTechEnterprise',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'nextech-store-demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nextech-store-demo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'nextech-store-demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '102938475612',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:102938475612:web:9876543210abcdef',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-DEMONEXTECH'
};

// Safe singleton Firebase app initialization: only initialize when a live Google API key is configured
// to prevent automated background pings to Google Identity Toolkit with placeholder keys
let app: FirebaseApp;
try {
  if (isLiveKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } else {
    app = (getApps().length > 0 ? getApp() : ({} as FirebaseApp));
  }
} catch {
  app = {} as FirebaseApp;
}

// Safe Auth initialization with SSR prerender protection
let auth: Auth;
try {
  auth = isLiveKey && app && typeof (app as any).name === 'string' ? getAuth(app) : ({} as Auth);
} catch {
  auth = {} as Auth;
}

// Safe Firestore initialization
let db: Firestore;
try {
  db = isLiveKey && app && typeof (app as any).name === 'string' ? getFirestore(app) : ({} as Firestore);
} catch {
  db = {} as Firestore;
}

// Safe Storage initialization
let storage: FirebaseStorage;
try {
  storage = isLiveKey && app && typeof (app as any).name === 'string' ? getStorage(app) : ({} as FirebaseStorage);
} catch {
  storage = {} as FirebaseStorage;
}

// Analytics: Google Analytics 4 (GA4) is safely handled via gtag in GoogleAnalytics.tsx
const analytics = null;

export { app, auth, db, storage, analytics };
export default app;
