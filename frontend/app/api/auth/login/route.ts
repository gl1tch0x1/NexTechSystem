 import { NextRequest, NextResponse } from 'next/server';
import { proxyAuth } from '../../../../lib/auth-proxy';
import { getMongoDb } from '@/lib/mongodb';
import {
  createJwtToken,
  verifyPassword,
  fetchBackendSettings,
  readLocalStoreJson,
} from '@/lib/proxy-helper';

function sanitizeUser(u: any) {
  return {
    id: u.id || String(u._id),
    name: u.name || 'Administrator',
    email: u.email || '',
    username: u.username || (u.email ? u.email.split('@')[0] : 'admin'),
    role: u.role || 'ADMIN',
    avatar: u.avatar || '',
    phone: u.phone || '',
    isActive: u.isActive !== false,
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt,
  };
}

export async function POST(request: NextRequest) {
  let rawBodyText = '';
  let bodyJson: any = null;
  try {
    rawBodyText = await request.text();
    bodyJson = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON request payload.' } },
      { status: 400 }
    );
  }

  const { email, password } = bodyJson || {};
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Email / Username and Password are required.' } },
      { status: 400 }
    );
  }

  // 1. Attempt upstream Express backend authentication first
  try {
    const upstream = await proxyAuth(
      new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: rawBodyText,
      }),
      'login'
    );

    // If upstream authentication succeeded, return directly
    if (upstream.ok) {
      return upstream;
    }

    // Pass through client validation, rate limit, or MFA responses from upstream
    if (
      upstream.status !== 401 &&
      upstream.status !== 404 &&
      upstream.status !== 502 &&
      upstream.status !== 503 &&
      upstream.status !== 504
    ) {
      return upstream;
    }
  } catch {
    // Upstream service unavailable; continue to resilient fallback
  }

  // 2. Resilient Fallback: Authenticate directly against MongoDB users and coAdmins settings
  const cleanIdentifier = String(email).trim().toLowerCase().replace(/^@/, '');
  const rawPassword = String(password);

  let user: any = null;

  // Tier 1: Query MongoDB users and settings collections
  try {
    const db = await getMongoDb();
    if (db) {
      user = await db.collection('users').findOne({
        $or: [
          { email: cleanIdentifier },
          { username: cleanIdentifier },
        ],
      });
      if (!user) {
        const settingsDoc = await db.collection('settings').findOne({ id: 'global_settings' });
        const coAdmins: any[] = settingsDoc?.coAdmins || [];
        user = coAdmins.find(
          (a: any) =>
            a.email?.toLowerCase() === cleanIdentifier ||
            a.username?.toLowerCase() === cleanIdentifier
        );
      }
    }
  } catch (err: any) {
    console.warn('[Auth Login MongoDB Error]:', err?.message || err);
  }

  // Tier 2: Check backend settings coAdmins (including bundled settings fallback)
  if (!user) {
    try {
      const settings = await fetchBackendSettings();
      const coAdmins: any[] = settings?.coAdmins || [];
      const matched = coAdmins.find(
        (a: any) =>
          a.email?.toLowerCase() === cleanIdentifier ||
          a.username?.toLowerCase() === cleanIdentifier
      );
      if (matched) {
        user = matched;
      }
    } catch {}
  }

  // Tier 3: Check bundled and local users.json store via readLocalStoreJson
  if (!user) {
    try {
      const users = await readLocalStoreJson<any[]>('users.json');
      if (Array.isArray(users)) {
        user = users.find(
          (u: any) =>
            u.email?.toLowerCase() === cleanIdentifier ||
            u.username?.toLowerCase() === cleanIdentifier
        );
      }
    } catch {}
  }

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  if (user.isActive === false) {
    return NextResponse.json(
      { success: false, error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated. Please contact support.' } },
      { status: 403 }
    );
  }

  // Verify candidate passwords (raw candidate and trimmed)
  const candidatePasswords = [rawPassword];
  if (rawPassword.trim() !== rawPassword) {
    candidatePasswords.push(rawPassword.trim());
  }

  let isValid = false;
  if (user.passwordHash) {
    for (const pwd of candidatePasswords) {
      if (verifyPassword(pwd, user.passwordHash)) {
        isValid = true;
        break;
      }
    }
  }

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
      { status: 401 }
    );
  }

  // Issue authoritative JWT token
  const token = createJwtToken({
    id: user.id || String(user._id),
    email: user.email,
    role: user.role || 'ADMIN',
    resellerId: user.resellerId,
  });

  const response = NextResponse.json({
    success: true,
    data: {
      token,
      user: sanitizeUser(user),
    },
  });

  // Set httpOnly session cookie
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return response;
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'NexTech Authentication Gateway Active. Submit a POST request with email and password to authenticate.',
  });
}
