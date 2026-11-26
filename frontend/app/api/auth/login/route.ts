import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import {
  createJwtToken,
  verifyPassword,
  fetchBackendSettings,
  readLocalStoreJson,
  getDynamicAdmins,
  registerDynamicAdmin,
  verifyVaultToken,
  getBackendApiUrl,
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

  const rawIdentifier = String(email).trim().toLowerCase();
  const cleanIdentifier = rawIdentifier.replace(/^@/, '');
  const rawPassword = String(password);

  let user: any = null;

  // 1. MongoDB Atlas — the authoritative store for frontend-created admins
  try {
    const db = await getMongoDb();
    if (db) {
      user = await db.collection('users').findOne({
        $or: [
          { email: cleanIdentifier },
          { username: cleanIdentifier },
          { email: rawIdentifier },
          { username: rawIdentifier },
        ],
      });
      if (!user) {
        // Also check coAdmins in settings collection
        const settingsDoc = await db.collection('settings').findOne({ id: 'global_settings' });
        const coAdmins: any[] = settingsDoc?.coAdmins || [];
        user = coAdmins.find(
          (a: any) =>
            a.email?.toLowerCase() === cleanIdentifier ||
            a.username?.toLowerCase() === cleanIdentifier
        );
      }
      if (user && user.role === 'ADMIN') {
        registerDynamicAdmin(user);
      }
    }
  } catch (err: any) {
    console.warn('[Auth Login MongoDB]:', err?.message || err);
  }

  // 2. Dynamic in-memory co-admins (survives across warm serverless invocations)
  if (!user || !user.passwordHash) {
    const dynamicList = getDynamicAdmins();
    const dynMatch = dynamicList.find(
      (a: any) =>
        a.email?.toLowerCase() === cleanIdentifier ||
        a.username?.toLowerCase() === cleanIdentifier ||
        a.email?.toLowerCase() === rawIdentifier ||
        a.username?.toLowerCase() === rawIdentifier
    );
    if (dynMatch) {
      user = user ? { ...user, passwordHash: dynMatch.passwordHash || user.passwordHash } : dynMatch;
    }
  }

  // 3. Cookie vault — co-admins registered from this browser session
  if (!user || !user.passwordHash) {
    const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
    if (vaultCookie) {
      try {
        const vaultAdmins = verifyVaultToken(vaultCookie);
        const vaultMatch = vaultAdmins.find(
          (a: any) =>
            a.email?.toLowerCase() === cleanIdentifier ||
            a.username?.toLowerCase() === cleanIdentifier ||
            a.email?.toLowerCase() === rawIdentifier ||
            a.username?.toLowerCase() === rawIdentifier
        );
        if (vaultMatch) {
          user = user ? { ...user, passwordHash: vaultMatch.passwordHash || user.passwordHash } : vaultMatch;
          registerDynamicAdmin(user);
        }
      } catch {}
    }
  }

  // 4. Bundled users.json (compiled into the Next.js deployment)
  if (!user || !user.passwordHash) {
    try {
      const users = await readLocalStoreJson<any[]>('users.json');
      if (Array.isArray(users)) {
        const bundledMatch = users.find(
          (u: any) =>
            u.email?.toLowerCase() === cleanIdentifier ||
            u.username?.toLowerCase() === cleanIdentifier ||
            u.email?.toLowerCase() === rawIdentifier ||
            u.username?.toLowerCase() === rawIdentifier
        );
        if (bundledMatch) {
          user = user ? { ...user, passwordHash: bundledMatch.passwordHash || user.passwordHash } : bundledMatch;
          if (user.role === 'ADMIN') {
            registerDynamicAdmin(user);
          }
        }
      }
    } catch {}
  }

  // 5. Backend settings coAdmins (fetched from Express API)
  if (!user || !user.passwordHash) {
    try {
      const settings = await fetchBackendSettings();
      const coAdmins: any[] = settings?.coAdmins || [];
      const settingsMatch = coAdmins.find(
        (a: any) =>
          a.email?.toLowerCase() === cleanIdentifier ||
          a.username?.toLowerCase() === cleanIdentifier ||
          a.email?.toLowerCase() === rawIdentifier ||
          a.username?.toLowerCase() === rawIdentifier
      );
      if (settingsMatch) {
        user = user ? { ...user, passwordHash: settingsMatch.passwordHash || user.passwordHash } : settingsMatch;
        registerDynamicAdmin(user);
      }
    } catch {}
  }

  // ─── VERIFY PASSWORD LOCALLY IF USER WAS FOUND ────────────────────────────────
  if (user) {
    if (user.isActive === false) {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated. Please contact support.' } },
        { status: 403 }
      );
    }

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

    if (isValid) {
      // Self-heal: ensure verified administrator is stored in MongoDB users collection with passwordHash
      try {
        const db = await getMongoDb();
        if (db) {
          const usersCol = db.collection('users');
          await usersCol.updateOne(
            { $or: [{ email: user.email.toLowerCase() }, { id: user.id }] },
            {
              $set: {
                ...user,
                email: user.email.toLowerCase(),
                passwordHash: user.passwordHash,
                isActive: true,
                updatedAt: new Date().toISOString(),
              },
            },
            { upsert: true }
          );
        }
      } catch {}

      return issueLoginResponse(user);
    }


    user = null;
  }


  try {
    const backendUrl = getBackendApiUrl();
    const headers = new Headers();
    for (const name of ['content-type', 'authorization', 'cookie', 'origin', 'referer', 'x-csrf-token']) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }

    const upstream = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers,
      body: rawBodyText,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });

    const upstreamBody = await upstream.text();
    let backendJson: any = null;
    try {
      backendJson = JSON.parse(upstreamBody);
    } catch {}

    if (upstream.ok) {
      const backendUser = backendJson?.success ? backendJson?.data?.user : null;
      if (backendUser && (backendUser.id || backendUser._id)) {
        registerDynamicAdmin(backendUser);
        return issueLoginResponse(backendUser);
      }

      if (backendJson?.success && backendJson?.data?.requiresMfa) {
        return new Response(upstreamBody, {
          status: upstream.status,
          headers: {
            'Cache-Control': 'no-store',
            'Content-Type': upstream.headers.get('content-type') || 'application/json',
          },
        });
      }

      if (!backendJson) {
        return NextResponse.json(
          { success: false, error: { code: 'AUTH_SERVICE_INVALID_RESPONSE', message: 'Authentication service returned an invalid response.' } },
          { status: 502 }
        );
      }
    }

    if ([404, 502, 503, 504].includes(upstream.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service is temporarily unavailable. Please try again.' } },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'retry-after', 'www-authenticate']) {
      const value = upstream.headers.get(name);
      if (value !== null) responseHeaders.set(name, value);
    }
    return new Response(upstreamBody, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error('[Auth Login] Authentication service request failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service is temporarily unavailable. Please try again.' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

/**
 * Issue a successful login response with a frontend-signed JWT and httpOnly cookie.
 */
function issueLoginResponse(user: any): NextResponse {
  const token = createJwtToken({
    id: user.id || String(user._id),
    email: user.email,
    role: user.role || 'CUSTOMER',
    resellerId: user.resellerId,
  });

  const response = NextResponse.json({
    success: true,
    data: {
      token,
      user: sanitizeUser(user),
    },
  });

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
