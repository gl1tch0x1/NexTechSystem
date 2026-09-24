import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Try loading environment files in order of precedence: .env.local, .env, root .env, and frontend envs
const candidateEnvPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../frontend/.env.local'),
  path.resolve(process.cwd(), '../frontend/.env'),
];

for (const envPath of candidateEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';
const generatedDevelopmentJwtSecret = crypto.randomBytes(32).toString('hex');
const jwtSecret = process.env.JWT_SECRET ?? (nodeEnv === 'production' ? '' : generatedDevelopmentJwtSecret);

if (!process.env.JWT_SECRET && nodeEnv === 'production') {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set in production mode.');
} else if (!process.env.JWT_SECRET && nodeEnv !== 'production') {
  console.warn('⚠️ [Security Warning] JWT_SECRET is not set. Generated a development-only secret for local runtime.');
}

if (nodeEnv === 'production' && !process.env.PASSWORD_SALT) {
  throw new Error('FATAL SECURITY ERROR: PASSWORD_SALT environment variable must be set in production mode.');
}

const rawAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
];

const isPlaceholderValue = (value: string | undefined) => {
  if (!value) return true;
  return /REPLACE_WITH_VALID|DEMO|your_project|your-project|placeholder|000000000000/i.test(value);
};

const firebaseProjectId = (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim();
const firebaseClientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
const firebasePrivateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();
const firebaseStorageBucket = (process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim();
const firebaseServiceAccountConfigured = Boolean(
  firebaseProjectId &&
  !isPlaceholderValue(firebaseProjectId) &&
  firebaseClientEmail &&
  !isPlaceholderValue(firebaseClientEmail) &&
  firebasePrivateKey &&
  firebasePrivateKey.includes('BEGIN PRIVATE KEY') &&
  !isPlaceholderValue(firebasePrivateKey) &&
  firebaseStorageBucket &&
  !isPlaceholderValue(firebaseStorageBucket)
);

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: nodeEnv,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  ALLOWED_ORIGINS: rawAllowedOrigins.length > 0 ? rawAllowedOrigins : defaultAllowedOrigins,
  JWT_SECRET: jwtSecret || generatedDevelopmentJwtSecret,
  FIREBASE_PROJECT_ID: firebaseProjectId,
  FIREBASE_CLIENT_EMAIL: firebaseClientEmail,
  FIREBASE_PRIVATE_KEY: firebasePrivateKey,
  FIREBASE_STORAGE_BUCKET: firebaseStorageBucket,
  FIREBASE_SERVICE_ACCOUNT_CONFIGURED: firebaseServiceAccountConfigured,
  ENABLE_FIRESTORE_SYNC: process.env.ENABLE_FIRESTORE_SYNC !== 'false' && firebaseServiceAccountConfigured,
  // Cloudflare Edge & Bot Security
  CLOUDFLARE_TURNSTILE_SECRET_KEY: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '',
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '',
  CLOUDFLARE_ZONE_ID: process.env.CLOUDFLARE_ZONE_ID || '',
  CLOUDFLARE_SECURITY_ENABLED: process.env.CLOUDFLARE_SECURITY_ENABLED !== 'false',
  // Google Analytics 4 Secrets
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
  GA_PROPERTY_ID: process.env.GA_PROPERTY_ID || '',
  GA_API_SECRET: process.env.GA_API_SECRET || '',
  // Admin & Security Defaults
  ADMIN_DEFAULT_EMAIL: process.env.ADMIN_DEFAULT_EMAIL || process.env.ADMIN_BOOTSTRAP_EMAIL || '',
  ADMIN_BOOTSTRAP_EMAIL: (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase(),
  ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD || '',
  PASSWORD_SALT: process.env.PASSWORD_SALT || (nodeEnv === 'production' ? '' : 'nextech_enterprise_salt_v2_2026'),
};
