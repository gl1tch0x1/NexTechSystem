import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret && nodeEnv === 'production') {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be set in production mode.');
} else if (!jwtSecret) {
  console.warn('⚠️ [Security Warning] JWT_SECRET is not set in environment. Using development fallback. Please define JWT_SECRET in .env.');
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

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: nodeEnv,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  ALLOWED_ORIGINS: rawAllowedOrigins.length > 0 ? rawAllowedOrigins : defaultAllowedOrigins,
  JWT_SECRET: jwtSecret || 'dev_insecure_local_jwt_secret_change_in_env',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  ENABLE_FIRESTORE_SYNC: process.env.ENABLE_FIRESTORE_SYNC !== 'false',
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
  ADMIN_DEFAULT_EMAIL: process.env.ADMIN_DEFAULT_EMAIL || '',
  PASSWORD_SALT: process.env.PASSWORD_SALT || 'nextech_enterprise_salt_v2_2026',
};

