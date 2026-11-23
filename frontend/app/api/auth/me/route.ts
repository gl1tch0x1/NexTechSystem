import { NextRequest, NextResponse } from 'next/server';
import { proxyAuth } from '../../../../lib/auth-proxy';
import { getMongoDb } from '@/lib/mongodb';
import {
  verifyJwtToken,
  fetchBackendSettings,
  readLocalStoreJson,
  getDynamicAdmins,
  verifyVaultToken,
  registerDynamicAdmin,
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

  // Look up user across persistent tiers:
  let user: any = null;

  // Tier 1: Check dynamic in-memory co-admins registry
  const dynamicList = getDynamicAdmins();
  user = dynamicList.find(
    (a: any) =>
      a.id === decoded.id ||
      (decoded.email && a.email?.toLowerCase() === decoded.email.toLowerCase())
  );

  // Tier 2: Check cookie vault for co-admins registered in this browser
  if (!user) {
    const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
    if (vaultCookie) {
      try {
        const vaultAdmins = verifyVaultToken(vaultCookie);
        user = vaultAdmins.find(
          (a: any) =>
            a.id === decoded.id ||
            (decoded.email && a.email?.toLowerCase() === decoded.email.toLowerCase())
        );
        if (user) {
          registerDynamicAdmin(user);
        }
      } catch {}
    }
  }

  // Tier 3: Look up user in bundled and local users.json store (0ms instant resolution)
  if (!user) {
    try {
      const users = await readLocalStoreJson<any[]>('users.json');
      if (Array.isArray(users)) {
        user = users.find(
          (u: any) =>
            u.id === decoded.id ||
            (decoded.email && u.email?.toLowerCase() === decoded.email.toLowerCase())
        );
      }
    } catch {}
  }

  // Tier 4: Look up user in settings coAdmins (including bundled settings fallback)
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

  // Tier 5: Look up user in MongoDB (if connected)
  if (!user) {
    try {
      const db = await getMongoDb();
      if (db) {
        user = await db.collection('users').findOne({
          $or: [
            { id: decoded.id },
            { email: decoded.email?.toLowerCase() },
            ...(decoded.username ? [{ username: decoded.username?.toLowerCase() }] : []),
          ],
        });
        if (!user) {
          const settingsDoc = await db.collection('settings').findOne({ id: 'global_settings' });
          const coAdmins: any[] = settingsDoc?.coAdmins || [];
          user = coAdmins.find(
            (a: any) =>
              a.id === decoded.id ||
              (decoded.email && a.email?.toLowerCase() === decoded.email.toLowerCase())
          );
        }
        if (user && user.role === 'ADMIN') {
          registerDynamicAdmin(user);
        }
      }
    } catch {}
  }

  // Fallback: If token was cryptographically verified as an ADMIN, ensure access is not blocked
  if (!user && decoded.role === 'ADMIN' && decoded.email) {
    user = {
      id: decoded.id || 'admin_session',
      name: decoded.name || 'Administrator',
      email: decoded.email,
      username: decoded.username || decoded.email.split('@')[0],
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
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
