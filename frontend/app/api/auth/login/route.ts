import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import {
  createJwtToken,
  fetchBackendSettings,
  getBackendApiUrl,
  getDynamicAdmins,
  readLocalStoreJson,
  registerDynamicAdmin,
  verifyVaultToken,
} from '@/lib/proxy-helper';
import {
  addUserCandidate,
  addUserCandidates,
  findAcceptableCandidate,
  normalizeIdentifier,
  resolveAuthoritativeCandidate,
  type LocalCandidate,
} from '@/lib/auth-local-store';

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

function mergeVerifiedUser(matchedUser: any, authoritativeUser: any, passwordHash: string): any {
  if (!authoritativeUser) {
    return { ...matchedUser, passwordHash };
  }
  return {
    ...matchedUser,
    ...authoritativeUser,
    id: authoritativeUser.id || matchedUser.id,
    email: authoritativeUser.email || matchedUser.email,
    username: authoritativeUser.username || matchedUser.username,
    passwordHash,
  };
}

/**
 * Best-effort repair of MongoDB so future logins see the working hash first.
 * When the authoritative document is known, the write only succeeds if it has
 * not changed in the meantime (no upsert, so a concurrent password change wins).
 */
async function persistVerifiedUser(
  user: any,
  passwordHash: string,
  authoritativeUser?: any,
): Promise<void> {
  try {
    const email = normalizeIdentifier(user?.email);
    const id = String(user?.id || user?._id || '');
    if (!email && !id) return;

    const db = await getMongoDb();
    if (!db) return;

    const document: Record<string, any> = {
      ...user,
      ...(id ? { id } : {}),
      ...(email ? { email } : {}),
      passwordHash,
      isActive: user.isActive !== false,
      updatedAt: new Date().toISOString(),
    };
    delete document._id;

    const identity = id && email
      ? { $or: [{ id }, { email }] }
      : id
        ? { id }
        : { email };

    const expectedUpdatedAt =
      typeof authoritativeUser?.updatedAt === 'string' ? authoritativeUser.updatedAt : '';
    const filter = expectedUpdatedAt
      ? { $and: [identity, { updatedAt: expectedUpdatedAt }] }
      : identity;

    await db
      .collection('users')
      .updateOne(filter, { $set: document }, { upsert: !expectedUpdatedAt });
  } catch {
    // Best-effort durability only; authentication already succeeded locally.
  }
}

/**
 * MongoDB and the Express backend are optional in offline/local deployments.
 * Both lookups run together and never reject, keeping the fast local path fast.
 */
async function collectRemoteCandidates(
  keys: string[],
  candidates: LocalCandidate[],
): Promise<void> {
  await Promise.allSettled([
    (async () => {
      const db = await getMongoDb();
      if (!db) return;

      const [mongoUser, settingsDoc] = await Promise.all([
        db.collection('users').findOne({
          $or: [{ email: { $in: keys } }, { username: { $in: keys } }],
        }),
        db.collection('settings').findOne({ id: 'global_settings' }),
      ]);

      addUserCandidate(candidates, 'mongo', mongoUser, keys);
      addUserCandidates(candidates, 'settings', settingsDoc?.coAdmins, keys);
    })(),
    (async () => {
      const settings = await fetchBackendSettings();
      addUserCandidates(candidates, 'settings', settings?.coAdmins, keys);
    })(),
  ]);
}

async function waitAtMost(promise: Promise<void>, timeoutMs: number): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<boolean>(resolve => {
    timer = setTimeout(() => resolve(true), timeoutMs);
  });

  try {
    return await Promise.race([promise.then(() => false), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
      { status: 400 },
    );
  }

  const { email, password } = bodyJson || {};
  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Email / Username and Password are required.' } },
      { status: 400 },
    );
  }

  const keys = Array.from(
    new Set([normalizeIdentifier(email), String(email).trim().toLowerCase()]),
  ).filter(Boolean);
  const rawPassword = String(password);
  const candidatePasswords = [rawPassword];
  if (rawPassword.trim() !== rawPassword) {
    candidatePasswords.push(rawPassword.trim());
  }

  const candidates: LocalCandidate[] = [];

  // 1. Fast local sources (no network): in-memory admins, cookie vault, bundled data.
  addUserCandidates(candidates, 'dynamic', getDynamicAdmins(), keys);

  const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
  if (vaultCookie) {
    try {
      addUserCandidates(candidates, 'vault', verifyVaultToken(vaultCookie), keys);
    } catch {}
  }

  try {
    addUserCandidates(candidates, 'bundled', await readLocalStoreJson<any[]>('users.json'), keys);
  } catch {}

  try {
    const bundledSettings = await readLocalStoreJson<any[]>('settings.json');
    const globalSettings = Array.isArray(bundledSettings)
      ? bundledSettings.find((setting: any) => setting?.id === 'global_settings')
      : null;
    addUserCandidates(candidates, 'bundled-settings', globalSettings?.coAdmins, keys);
  } catch {}

  // 2. Remote sources run concurrently; give an already-matching credential a
  //    short window so MongoDB can still veto deactivated accounts.
  const remoteLookups = collectRemoteCandidates(keys, candidates);

  let verified = findAcceptableCandidate(candidates, candidatePasswords);
  if (verified) {
    await waitAtMost(remoteLookups, 800);
    // Re-check: an authoritative record may have arrived during the grace window.
    verified = findAcceptableCandidate(candidates, candidatePasswords);
  } else {
    await remoteLookups;
    verified = findAcceptableCandidate(candidates, candidatePasswords);
  }

  const hasVerifiableLocalAccount = candidates.some(
    candidate => Boolean(candidate.user?.passwordHash),
  );

  if (verified) {
    const authoritativeCandidate = resolveAuthoritativeCandidate(candidates, verified.user);

    if (authoritativeCandidate?.user?.isActive === false) {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated. Please contact support.' } },
        { status: 403 },
      );
    }

    const authenticatedUser = mergeVerifiedUser(
      verified.user,
      authoritativeCandidate?.user ?? null,
      verified.passwordHash,
    );

    if (authenticatedUser.role === 'ADMIN') {
      registerDynamicAdmin(authenticatedUser);
    }

    // Only rewrite MongoDB when the fallback supplied the working credential.
    if (authoritativeCandidate?.user?.passwordHash !== verified.passwordHash) {
      void persistVerifiedUser(
        authenticatedUser,
        verified.passwordHash,
        authoritativeCandidate?.source === 'mongo' ? authoritativeCandidate.user : undefined,
      );
    }

    return issueLoginResponse(authenticatedUser);
  }

  // 3. Delegate to the authoritative Express backend, forwarding cookies/CSRF.
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
          { status: 502 },
        );
      }
    }

    if ([404, 502, 503, 504].includes(upstream.status)) {
      if (hasVerifiableLocalAccount) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
          { status: 401, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service is temporarily unavailable. Please try again.' } },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'retry-after', 'www-authenticate']) {
      const value = upstream.headers.get(name);
      if (value !== null) responseHeaders.set(name, value);
    }
    return new Response(upstreamBody, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    if (hasVerifiableLocalAccount) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    console.error('[Auth Login] Authentication service request failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service is temporarily unavailable. Please try again.' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
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
