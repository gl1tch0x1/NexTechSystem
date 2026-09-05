import admin from 'firebase-admin';
import { ENV } from './env.js';

let firebaseInitialized = false;
let firestoreInstance: admin.firestore.Firestore | null = null;

export function initializeFirebase(): admin.app.App | null {
  if (firebaseInitialized && admin.apps.length > 0) return admin.app();

  try {
    if (ENV.FIREBASE_CLIENT_EMAIL && ENV.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: ENV.FIREBASE_PROJECT_ID,
          clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
          privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
      });
      firebaseInitialized = true;
      console.log(`[Firebase] Admin SDK initialized with service account for [${ENV.FIREBASE_PROJECT_ID}].`);
    } else if (ENV.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: ENV.FIREBASE_PROJECT_ID,
        storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
      });
      firebaseInitialized = true;
      console.log(`[Firebase] Admin SDK initialized with Project ID [${ENV.FIREBASE_PROJECT_ID}].`);
    }
    
    if (admin.apps.length > 0) {
      firestoreInstance = admin.firestore();
    }
  } catch (err: any) {
    console.warn('[Firebase] Initialization notice:', err.message);
  }

  return admin.apps.length > 0 ? admin.app() : null;
}

export const isFirebaseLive = (): boolean => firebaseInitialized && !!firestoreInstance;
export const getFirebaseAdmin = () => admin;
export const getFirestore = (): admin.firestore.Firestore | null => {
  if (!firestoreInstance) {
    initializeFirebase();
  }
  return firestoreInstance;
};
export const getFirebaseAuth = () => admin.auth();
export const getFirebaseStorage = () => admin.storage();
