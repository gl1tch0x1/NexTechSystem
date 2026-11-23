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

  const rawIdentifier = String(email).trim().toLowerCase();
  const cleanIdentifier = rawIdentifier.replace(/^@/, '');
  const rawPassword = String(password);

  // ─── LOCAL-FIRST AUTHENTICATION ───────────────────────────────────────────────
  // Authenticate against all local data sources FIRST so that admins created
  // via the frontend admin panel (persisted to MongoDB) can always log in,
  // regardless of whether the Express backend knows about them or not.
  // This eliminates the JWT_SECRET mismatch problem entirely because the
  // token is always issued by the frontend using its own stable secret.
  // ──────────────────────────────────────────────────────────────────────────────

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
  if (!user) {
    const dynamicList = getDynamicAdmins();
    user = dynamicList.find(
      (a: any) =>
        a.email?.toLowerCase() === cleanIdentifier ||
        a.username?.toLowerCase() === cleanIdentifier ||
        a.email?.toLowerCase() === rawIdentifier ||
        a.username?.toLowerCase() === rawIdentifier
    );
  }

  // 3. Cookie vault — co-admins registered from this browser session
  if (!user) {
    const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
    if (vaultCookie) {
      try {
        const vaultAdmins = verifyVaultToken(vaultCookie);
        const matched = vaultAdmins.find(
          (a: any) =>
            a.email?.toLowerCase() === cleanIdentifier ||
            a.username?.toLowerCase() === cleanIdentifier ||
            a.email?.toLowerCase() === rawIdentifier ||
            a.username?.toLowerCase() === rawIdentifier
        );
        if (matched) {
          user = matched;
          registerDynamicAdmin(matched);
        }
      } catch {}
    }
  }

  // 4. Bundled users.json (compiled into the Next.js deployment)
  if (!user) {
    try {
      const users = await readLocalStoreJson<any[]>('users.json');
      if (Array.isArray(users)) {
        user = users.find(
          (u: any) =>
            u.email?.toLowerCase() === cleanIdentifier ||
            u.username?.toLowerCase() === cleanIdentifier ||
            u.email?.toLowerCase() === rawIdentifier ||
            u.username?.toLowerCase() === rawIdentifier
        );
        if (user && user.role === 'ADMIN') {
          registerDynamicAdmin(user);
        }
      }
    } catch {}
  }

  // 5. Backend settings coAdmins (fetched from Express API)
  if (!user) {
    try {
      const settings = await fetchBackendSettings();
      const coAdmins: any[] = settings?.coAdmins || [];
      const matched = coAdmins.find(
        (a: any) =>
          a.email?.toLowerCase() === cleanIdentifier ||
          a.username?.toLowerCase() === cleanIdentifier ||
          a.email?.toLowerCase() === rawIdentifier ||
          a.username?.toLowerCase() === rawIdentifier
      );
      if (matched) {
        user = matched;
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
      return issueLoginResponse(user);
    }

    // Password didn't match against local data — don't return 401 yet.
    // The user might exist in the backend with a different password hash
    // (e.g. password was changed via the backend API). Clear user and fall
    // through to the backend proxy attempt below.
    user = null;
  }

  // ─── BACKEND PROXY FALLBACK ───────────────────────────────────────────────────
  // If user was NOT found in any local data source, OR the password didn't match
  // the local hash, try the Express backend as a last resort.
  // This handles users who exist only in the backend's dbStore (e.g. registered
  // through the public registration form routed directly to the backend).
  // ──────────────────────────────────────────────────────────────────────────────

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
      signal: AbortSignal.timeout(5000),
    });

    if (upstream.ok) {
      // Backend authenticated successfully. Parse its response, extract the user,
      // then re-issue a frontend JWT so subsequent /api/auth/me calls verify
      // correctly with the frontend's own secret.
      try {
        const backendJson = await upstream.json();
        if (backendJson?.success && backendJson?.data?.user) {
          const backendUser = backendJson.data.user;
          registerDynamicAdmin(backendUser);
          return issueLoginResponse(backendUser);
        }
      } catch {}
      // If we can't parse the backend response, something is off — fall through
    }

    // If backend returned a non-auth error (rate limit, bad request, etc.), pass it through
    if (
      upstream.status !== 401 &&
      upstream.status !== 404 &&
      upstream.status !== 502 &&
      upstream.status !== 503 &&
      upstream.status !== 504
    ) {
      const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
      for (const name of ['content-type', 'retry-after', 'www-authenticate']) {
        const value = upstream.headers.get(name);
        if (value !== null) responseHeaders.set(name, value);
      }
      const body = await upstream.arrayBuffer();
      return new Response(body, { status: upstream.status, headers: responseHeaders });
    }
  } catch {
    // Backend unavailable — already checked all local sources above
  }

  // ─── ALL SOURCES EXHAUSTED ────────────────────────────────────────────────────
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
    { status: 401 }
  );
}

/**
 * Issue a successful login response with a frontend-signed JWT and httpOnly cookie.
 */
function issueLoginResponse(user: any): NextResponse {
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
