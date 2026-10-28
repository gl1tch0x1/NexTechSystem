import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { signJwt } from '@/lib/token';
import { User } from '@/types';

const PBKDF2_SALT = process.env.PASSWORD_SALT || 'nextech_enterprise_salt_v2_2026';
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_local_jwt_secret_change_in_env';

const ADMIN_BOOTSTRAP_EMAIL = (process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_DEFAULT_EMAIL || '').trim().toLowerCase();
const ADMIN_BOOTSTRAP_PASSWORD = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_DEFAULT_PASSWORD || '';

function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PBKDF2_SALT, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
}

function sanitizeUser(user: any): User {
  const { passwordHash, ...safeUser } = user;
  return safeUser as User;
}

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;
  const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');

  // 1. Authoritative Backend Database Authentication Proxy
  const incomingOrigin = request.headers.get('origin') || request.nextUrl.origin || 'https://www.nextechsystem.com';
  const incomingReferer = request.headers.get('referer') || incomingOrigin;

  try {
    const res = await fetch(`${clean}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': incomingOrigin,
        'Referer': incomingReferer,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });
    const json = await res.json().catch(() => null);
    if (json && res.status !== 403 && res.status !== 500 && res.status !== 502 && res.status !== 503) {
      return NextResponse.json(json, { status: res.status });
    }
  } catch {
    // Backend service offline or unreachable, proceed to resilient local database verification
  }

  // 2. Resilient Database Authentication
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Email and Password are required.' } },
      { status: 400 }
    );
  }

  const cleanIdentifier = String(email).trim().toLowerCase();
  const rawPassword = String(password);

  // Load registered users from disk database store if available, otherwise use seed catalog
  let dbUsers: any[] = [];
  try {
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.resolve(process.cwd(), '../backend/data_store/users.json');
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      const parsed = JSON.parse(fileData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        dbUsers = parsed;
      }
    }
  } catch {
    // Retain fallback users
  }

  // If dbUsers has no admin loaded, allow dynamic bootstrap from environment variables if defined in .env
  if (
    ADMIN_BOOTSTRAP_EMAIL &&
    ADMIN_BOOTSTRAP_PASSWORD &&
    !dbUsers.some((u: any) => u.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase() || u.role === 'ADMIN')
  ) {
    dbUsers.push({
      id: 'user_admin_bootstrap',
      email: ADMIN_BOOTSTRAP_EMAIL.toLowerCase(),
      role: 'ADMIN',
      name: 'System Administrator',
      username: 'admin',
      phone: '',
      addresses: [],
      passwordHash: hashPassword(ADMIN_BOOTSTRAP_PASSWORD),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const matchedUser = dbUsers.find(
    (u: any) => u.email?.toLowerCase() === cleanIdentifier || u.username?.toLowerCase() === cleanIdentifier
  );

  if (!matchedUser) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  // Verify password using PBKDF2 hash (supporting salt:hash and legacy formats)
  let isPasswordValid = false;
  if (matchedUser.passwordHash) {
    if (matchedUser.passwordHash.includes(':')) {
      const [salt, expectedHash] = matchedUser.passwordHash.split(':');
      const actualHash = crypto.pbkdf2Sync(rawPassword, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
      isPasswordValid = (actualHash === expectedHash);
    } else {
      const inputHash = hashPassword(rawPassword);
      isPasswordValid = (matchedUser.passwordHash === inputHash);
    }
  }

  // Allow admin bootstrap login from environment variables if configured in .env
  if (!isPasswordValid && ADMIN_BOOTSTRAP_PASSWORD) {
    const isEmailMatch = ADMIN_BOOTSTRAP_EMAIL
      ? cleanIdentifier === ADMIN_BOOTSTRAP_EMAIL || matchedUser.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL
      : matchedUser.role === 'ADMIN';

    if (isEmailMatch && rawPassword === ADMIN_BOOTSTRAP_PASSWORD) {
      isPasswordValid = true;
    }
  }

  if (!isPasswordValid) {
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
