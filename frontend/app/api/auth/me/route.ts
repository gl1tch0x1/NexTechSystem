import { NextRequest, NextResponse } from 'next/server';
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
    role: u.role || 'CUSTOMER',
    avatar: u.avatar || '',
    phone: u.phone || '',
    isActive: u.isActive !== false,
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt,
  };
}

export async function GET(request: NextRequest) {
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

  if (decoded && decoded.id) {
    // Token is valid — look up the user across all local sources
    let user: any = null;

    // 1. MongoDB Atlas
    try {
      const db = await getMongoDb();
      if (db) {
        user = await db.collection('users').findOne({ id: decoded.id });
        if (!user) {
          const settingsDoc = await db.collection('settings').findOne({ id: 'global_settings' });
          const coAdmins: any[] = settingsDoc?.coAdmins || [];
          user = coAdmins.find((a: any) => a.id === decoded.id);
        }
        if (user && user.role === 'ADMIN') {
          registerDynamicAdmin(user);
        }
      }
    } catch {}

    // 2. Dynamic in-memory co-admins
    if (!user) {
      const dynamicList = getDynamicAdmins();
      user = dynamicList.find((a: any) => a.id === decoded.id);
    }

    // 3. Cookie vault
    if (!user) {
      const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
      if (vaultCookie) {
        try {
          const vaultAdmins = verifyVaultToken(vaultCookie);
          user = vaultAdmins.find((a: any) => a.id === decoded.id);
          if (user) {
            registerDynamicAdmin(user);
          }
        } catch {}
      }
    }

    // 4. Bundled users.json
    if (!user) {
      try {
        const users = await readLocalStoreJson<any[]>('users.json');
        if (Array.isArray(users)) {
          user = users.find((u: any) => u.id === decoded.id);
        }
      } catch {}
    }

    // 5. Backend settings coAdmins
    if (!user) {
      try {
        const settings = await fetchBackendSettings();
        const coAdmins: any[] = settings?.coAdmins || [];
        user = coAdmins.find((a: any) => a.id === decoded.id);
      } catch {}
    }

    if (user && user.isActive !== false) {
      return NextResponse.json({
        success: true,
        data: {
          user: sanitizeUser(user),
          reseller: null,
        },
      });
    }
  }

  // ─── BACKEND PROXY FALLBACK ───────────────────────────────────────────────────
  // If the frontend couldn't verify the token (e.g. it was issued by the backend
  // with a different secret), try the backend as a fallback.
  // ──────────────────────────────────────────────────────────────────────────────

  try {
    const { proxyAuth } = await import('../../../../lib/auth-proxy');
    const upstream = await proxyAuth(request, 'me');

    if (upstream.ok) {
      return upstream;
    }

    if (upstream.status === 401 || upstream.status === 403) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Token is invalid or has expired.' } },
        { status: 401 }
      );
    }

    if (upstream.status === 404 || upstream.status === 502 || upstream.status === 503 || upstream.status === 504) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Unable to verify session right now. Please try again.' } },
        { status: 503 }
      );
    }

    return upstream;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Unable to verify session right now. Please try again.' } },
      { status: 503 }
    );
  }
}
