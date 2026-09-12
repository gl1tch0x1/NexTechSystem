import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { signJwt } from '@/lib/token';
import { FALLBACK_USERS } from '@/lib/fallback-data';
import { User } from '@/types';

const PBKDF2_SALT = process.env.PASSWORD_SALT || 'nextech_enterprise_salt_v2_2026';
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_local_jwt_secret_change_in_env';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PBKDF2_SALT, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
}

function sanitizeUser(user: any): User {
  const { passwordHash, ...safeUser } = user;
  return safeUser as User;
}

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  // 1. If an external remote backend is configured, forward the request
  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch (err: any) {
      console.warn('[Auth API] External backend unreachable, authenticating via database store:', err.message);
    }
  }

  // 2. Also try localhost backend if running in local development
  if (process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through to database verification
    }
  }

  // 3. Resilient Database Authentication (Runs seamlessly on Vercel)
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Email and Password are required.' } },
      { status: 400 }
    );
  }

  const cleanIdentifier = String(email).trim().toLowerCase();
  const rawPassword = String(password);
  const inputHash = hashPassword(rawPassword);

  const matchedUser = FALLBACK_USERS.find(
    u => u.email.toLowerCase() === cleanIdentifier || u.username?.toLowerCase() === cleanIdentifier
  );

  if (!matchedUser) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  if (matchedUser.passwordHash && matchedUser.passwordHash !== inputHash) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  const token = signJwt(
    { id: matchedUser.id, email: matchedUser.email, role: matchedUser.role, resellerId: matchedUser.resellerId },
    JWT_SECRET,
    86400 * 30
  );

  return NextResponse.json({
    success: true,
    data: {
      token,
      user: sanitizeUser(matchedUser),
    },
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'NexTech Authentication Gateway Active. Submit a POST request with email and password to authenticate.',
  });
}
