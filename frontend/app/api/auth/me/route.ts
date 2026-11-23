import { NextRequest, NextResponse } from 'next/server';
import { proxyAuth } from '../../../../lib/auth-proxy';
import { getMongoDb } from '@/lib/mongodb';
import { verifyJwtToken, fetchBackendSettings } from '@/lib/proxy-helper';

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

export async function GET(request: NextRequest) {
  // 1. Try upstream Express backend proxy first
  try {
    const upstream = await proxyAuth(request, 'me');
    if (upstream.ok) {
      return upstream;
    }
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
    // Upstream unavailable, proceed to resilient fallback
  }

  // 2. Resilient fallback: verify token and load user directly
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
      { status: 401 }
    );
  }

  const decoded = verifyJwtToken(token);
  if (!decoded || !decoded.id) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Token is invalid or has expired.' } },
      { status: 401 }
    );
  }

  // Look up user in MongoDB
  let user: any = null;
  try {
    const db = await getMongoDb();
    if (db) {
      user = await db.collection('users').findOne({
        $or: [
          { id: decoded.id },
          { email: decoded.email?.toLowerCase() },
        ],
      });
    }
  } catch {}

  // Look up user in settings coAdmins
  if (!user) {
    try {
      const settings = await fetchBackendSettings();
      const coAdmins: any[] = settings?.coAdmins || [];
      user = coAdmins.find(
        (a: any) =>
          a.id === decoded.id ||
          (decoded.email && a.email?.toLowerCase() === decoded.email.toLowerCase())
      );
    } catch {}
  }

  // Look up user in local users.json
  if (!user) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const p = path.resolve(process.cwd(), 'backend', 'data_store', 'users.json');
      const raw = await fs.readFile(p, 'utf8');
      const users = JSON.parse(raw);
      user = users.find(
        (u: any) =>
          u.id === decoded.id ||
          (decoded.email && u.email?.toLowerCase() === decoded.email.toLowerCase())
      );
    } catch {}
  }

  if (!user || user.isActive === false) {
    return NextResponse.json(
      { success: false, error: { code: 'USER_NOT_FOUND', message: 'User record not found or account is deactivated.' } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      reseller: null,
    },
  });
}
