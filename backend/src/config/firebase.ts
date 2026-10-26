import { ENV } from './env.js';

let firebaseInitialized = false;
let firestoreInstance: any = null;
let firebaseAppInstance: any = null;

export function initializeFirebase(): any | null {
  if (firebaseInitialized && firebaseAppInstance) return firebaseAppInstance;

  const hasCredentials = Boolean(
    ENV.FIREBASE_PROJECT_ID &&
    ENV.FIREBASE_CLIENT_EMAIL &&
    ENV.FIREBASE_PRIVATE_KEY
  );
  if (!hasCredentials) {
    console.warn('[Firebase] Admin SDK not initialized because Firebase service-account credentials are missing.');
    return null;
  }

  try {
    // Dynamic require so missing optional Firestore/JWKS packages don't crash startup
    const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');

    if (getApps().length > 0) {
      firebaseAppInstance = getApp();
      firebaseInitialized = true;
      return firebaseAppInstance;
    }

    const app = initializeApp({
      credential: cert({
        projectId: ENV.FIREBASE_PROJECT_ID,
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
        privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
    });
    firebaseInitialized = true;
    firebaseAppInstance = app;
    console.log('[Firebase] Admin SDK initialized with service account for [%s].', ENV.FIREBASE_PROJECT_ID);

    try {
      const { getFirestore: createFirestore } = require('firebase-admin/firestore');
      firestoreInstance = createFirestore(app);
    } catch (fsErr: any) {
      console.warn('[Firebase] Firestore initialization notice:', fsErr.message);
    }
  } catch (err: any) {
    console.warn('[Firebase] Initialization notice (optional SDK skipped):', err.message);
  }

  return firebaseAppInstance;
}

export const isFirebaseLive = (): boolean => firebaseInitialized && !!firestoreInstance;

export const getFirebaseAdmin = () => {
  try {
    const { getApp, getApps, initializeApp, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    const { getStorage } = require('firebase-admin/storage');
    return { getApp, getApps, initializeApp, cert, getAuth, getStorage };
  } catch {
    return {
      getApp: () => null,
      getApps: () => [],
      initializeApp: () => null,
      cert: () => null,
      getAuth: () => null,
      getStorage: () => null
    };
  }
};

export const getFirestore = (): any | null => {
  if (!firestoreInstance && Boolean(ENV.FIREBASE_PROJECT_ID)) {
    initializeFirebase();
  }
  return firestoreInstance;
};

export const getFirebaseAuth = () => {
  try {
    const { getAuth } = require('firebase-admin/auth');
    return getAuth();
  } catch {
    return null;
  }
};

export const getFirebaseStorage = () => {
  try {
    const { getStorage } = require('firebase-admin/storage');
    return getStorage();
  } catch {
    return null;
  }
};
