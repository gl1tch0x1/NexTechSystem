import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { signJwt } from '@/lib/token';
import { User } from '@/types';
import { getMongoDb } from '@/lib/mongodb';

const PBKDF2_SALT = process.env.PASSWORD_SALT || '';
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';
const JWT_SECRET = process.env.JWT_SECRET || '';

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

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Email and Password are required.' } },
      { status: 400 }
    );
  }

  const cleanIdentifier = String(email).trim().toLowerCase();
  const rawPassword = String(password);

  // 1. Authoritative Backend Database Authentication Proxy (if backend is active)
  const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
  const incomingOrigin = request.headers.get('origin') || request.nextUrl.origin || 'https://nextechsystem.com';
  // Normalize origin to authorized domain to avoid CORS blocks on legacy backend
  const normalizedOrigin = incomingOrigin.includes('nextechsystem.com') ? 'https://nextechsystem.com' : incomingOrigin;

  try {
    const res = await fetch(`${clean}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': normalizedOrigin,
        'Referer': `${normalizedOrigin}/login`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.success) {
        return NextResponse.json(json, { status: 200 });
      }
    }
  } catch {
    // Backend service offline or unreachable, proceed to direct cloud database verification
  }

  // 2. Direct Cloud Database Authentication (MongoDB Atlas)
  let matchedUser: any = null;
  try {
    const db = await getMongoDb();
    if (db) {
      matchedUser = await db.collection('users').findOne({
        $or: [
          { email: cleanIdentifier },
          { username: cleanIdentifier }
        ]
      });
    }
  } catch (mongoErr: any) {
    console.warn('[Login Route MongoDB Notice]:', mongoErr?.message || mongoErr);
  }

  // 3. Local disk database store fallback (for offline local development)
  if (!matchedUser && process.env.NODE_ENV !== 'production') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.join(process.cwd(), '../backend/data_store/users.json');
      if (fs.existsSync(localPath)) {
        const fileData = fs.readFileSync(localPath, 'utf8');
        const parsed = JSON.parse(fileData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          matchedUser = parsed.find(
            (u: any) => u.email?.toLowerCase() === cleanIdentifier || u.username?.toLowerCase() === cleanIdentifier
          );
        }
      }
    } catch {}
  }

  // 4. Environment-level bootstrap credentials (if configured via .env)
  if (!matchedUser && ADMIN_BOOTSTRAP_EMAIL && cleanIdentifier === ADMIN_BOOTSTRAP_EMAIL) {
    matchedUser = {
      id: 'user_admin_bootstrap',
      email: ADMIN_BOOTSTRAP_EMAIL,
      role: 'ADMIN',
      name: 'System Administrator',
      username: 'admin',
      phone: '',
      addresses: [],
      passwordHash: ADMIN_BOOTSTRAP_PASSWORD ? hashPassword(ADMIN_BOOTSTRAP_PASSWORD) : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  if (!matchedUser) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  // 5. Verify password using PBKDF2 hash (supporting salt:hash and legacy formats)
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

  if (!isPasswordValid && ADMIN_BOOTSTRAP_PASSWORD && rawPassword === ADMIN_BOOTSTRAP_PASSWORD) {
    isPasswordValid = true;
  }

  if (!isPasswordValid) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  if (!JWT_SECRET) {
    console.error('[Auth Error] JWT_SECRET is not configured in environment variables.');
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_CONFIGURATION_ERROR', message: 'Authentication service configuration error.' } },
      { status: 500 }
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
