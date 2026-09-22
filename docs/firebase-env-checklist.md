# Firebase Environment Checklist for Live Firestore

This project requires two Firebase config sets to work end-to-end:

1. Frontend web config for browser auth and app initialization
2. Backend service-account config for Firestore admin access

## 1) Frontend environment variables

Required in frontend/.env.local or frontend/.env:

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
- NEXT_PUBLIC_API_URL
- API_PROXY_TARGET
- BACKEND_URL

Current project status:
- Present in frontend/.env
- Firebase web app is configured for project nextechsystems-65aaa

## 2) Backend environment variables

Required in backend/.env:

- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- FIREBASE_STORAGE_BUCKET
- ENABLE_FIRESTORE_SYNC
- JWT_SECRET
- PASSWORD_SALT in production

Important:
- FIREBASE_PRIVATE_KEY must be the raw service-account private key, including the full PEM block.
- The key must contain escaped newline characters when written into a dotenv file, for example:
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
- If the value is missing or invalid, the Admin SDK cannot authenticate to Firestore.

## 3) Required Firebase project setup

Before running the live migration, confirm the following in the Google Cloud / Firebase console:

- A Firebase project exists for nextechsystems-65aaa
- Firestore Database is enabled
- The service account has the Cloud Datastore User or Firebase Admin role
- The project has billing enabled if required by the Firestore configuration
- The backend is using the service-account JSON generated from the Firebase project

## 4) Migration command

Run this after the credentials are populated:

- cd backend
- npm run seed:firestore

## 5) Live database status for this workspace

Current status:
- Frontend web config is populated
- Backend Admin SDK credentials are not populated
- Firestore migration is blocked because the service account private key is missing

This is the exact reason the migration fails today with:

- Could not load the default credentials.

Once FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are added to backend/.env, the backend will authenticate and the Firestore seed flow can start populating product, category, brand, settings, and user data.
