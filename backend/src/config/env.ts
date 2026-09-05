import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try loading .env.local first, then .env
const envLocal = path.resolve(process.cwd(), '.env.local');
const envDefault = path.resolve(process.cwd(), '.env');
const frontendEnvLocal = path.resolve(process.cwd(), '../frontend/.env.local');

if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else if (fs.existsSync(envDefault)) {
  dotenv.config({ path: envDefault });
}

if (fs.existsSync(frontendEnvLocal)) {
  dotenv.config({ path: frontendEnvLocal });
}

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'nextech_super_secret_jwt_key_2026_enterprise',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nextechsystems-65aaa',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'nextechsystems-65aaa.firebasestorage.app',
  ENABLE_FIRESTORE_SYNC: process.env.ENABLE_FIRESTORE_SYNC !== 'false',
};
