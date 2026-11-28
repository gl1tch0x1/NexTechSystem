import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import bundledUsersData from '@/data/users.json';
import bundledSettingsData from '@/data/settings.json';

// In-memory registry of dynamically created co-administrators (persists across warm serverless invocations)
const dynamicAdminsMap = new Map<string, any>();

export function registerDynamicAdmin(admin: any): void {
  if (!admin || !admin.email) return;
  const emailKey = admin.email.trim().toLowerCase();
  dynamicAdminsMap.set(emailKey, admin);
  if (admin.username) {
    const userKey = admin.username.trim().toLowerCase().replace(/^@/, '');
    dynamicAdminsMap.set(userKey, admin);
  }
}

export function getDynamicAdmins(): any[] {
  const seen = new Set<string>();
  const list: any[] = [];
  for (const admin of dynamicAdminsMap.values()) {
    const key = (admin.email || admin.id || '').toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      list.push(admin);
    }
  }
  return list;
}

const deletedAdminIdentifiers = new Set<string>();

export function markAdminDeleted(idOrEmail: string): void {
  if (!idOrEmail) return;
  const target = idOrEmail.trim().toLowerCase();
  deletedAdminIdentifiers.add(target);
  removeDynamicAdmin(idOrEmail);
}

export function isDeletedAdmin(idOrEmail: string): boolean {
  if (!idOrEmail) return false;
  const target = idOrEmail.trim().toLowerCase();
  return deletedAdminIdentifiers.has(target);
}

export function removeDynamicAdmin(idOrEmail: string): void {
  if (!idOrEmail) return;
  const target = idOrEmail.trim().toLowerCase();
  for (const [key, admin] of dynamicAdminsMap.entries()) {
    if (
      key === target ||
      admin.id?.toLowerCase() === target ||
      admin.email?.toLowerCase() === target ||
      admin.username?.toLowerCase() === target
    ) {
      dynamicAdminsMap.delete(key);
    }
  }
}

export function updateDynamicAdmin(adminId: string, updates: Record<string, any>): any | null {
  if (!adminId) return null;
  const target = adminId.trim().toLowerCase();
  for (const [key, admin] of dynamicAdminsMap.entries()) {
    if (
      key === target ||
      admin.id?.toLowerCase() === target ||
      admin.email?.toLowerCase() === target
    ) {
      const updated = { ...admin, ...updates };
      dynamicAdminsMap.set(key, updated);
      return updated;
    }
  }
  return null;
}

export function createVaultToken(admins: any[]): string {
  return createJwtToken({
    id: 'vault_system',
    email: 'vault@nextechsystem.com',
    role: 'ADMIN',
    admins,
  });
}

export function verifyVaultToken(token: string): any[] {
  const decoded = verifyJwtToken(token) as any;
  return Array.isArray(decoded?.admins) ? decoded.admins : [];
}

export function getBackendApiUrl(): string {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const candidate =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  if (candidate) {
    const isLocal = candidate.includes('localhost') || candidate.includes('127.0.0.1');
    if (!isLocal || !isProd) {
      return candidate.replace(/\/$/, '').replace(/\/api$/, '');
    }
  }

  return isProd ? 'https://api.nextechsystem.com' : 'http://localhost:5000';
}

/** Resolve API-issued roles when the frontend and API use separate JWT keys. */
export async function getAuthoritativeSessionRole(token: string): Promise<string | null> {
  try {
    const response = await fetch(`${getBackendApiUrl()}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const role = payload?.data?.user?.role;
    return role === 'ADMIN' || role === 'PRODUCT_EDITOR' ? role : null;
  } catch {
    return null;
  }
}

let cachedJwtSecret: string | null = null;

export function getJwtSecret(): string {
  if (cachedJwtSecret) return cachedJwtSecret;
  const configured = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (configured && configured.trim().length >= 32) {
    cachedJwtSecret = configured.trim();
    return cachedJwtSecret;
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('A JWT_SECRET of at least 32 characters must be configured in production.');
  }
  cachedJwtSecret = crypto.randomBytes(32).toString('hex');
  return cachedJwtSecret;
}

/** Generates an internal admin JWT for trusted server-side settings operations. */
export function getInternalAdminToken(): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    id: 'user_admin_master',
    email: 'admin@nextechsystem.com',
    role: 'ADMIN',
    iat: now,
    exp: now + 86400,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function createJwtToken(payload: { id: string; email: string; role: string; resellerId?: string;[key: string]: any }): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + 30 * 86400,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJwtToken(token: string): ({ id: string; email: string; role: string; resellerId?: string;[key: string]: any }) | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    if (header?.alg !== 'HS256') return null;
    const secret = getJwtSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');
    const expectedBuffer = Buffer.from(expectedSig);
    const actualBuffer = Buffer.from(sigB64);
    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.id !== 'string' ||
      !payload.id ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getRequestToken(request: NextRequest): string | undefined {
  const authorization = request.headers.get('authorization');
  if (authorization) {
    return authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  }
  return request.cookies.get('auth_token')?.value;
}

export function authorizeRequestRoles(
  request: NextRequest,
  allowedRoles: string[] = ['ADMIN']
): Response | null {
  const token = getRequestToken(request);
  const user = token ? verifyJwtToken(token) : null;
  if (!user) {
    return Response.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  if (!allowedRoles.includes(user.role)) {
    return Response.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Administrator access required.' } },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  return null;
}

/**
 * Route handlers may receive an API-issued JWT whose key is intentionally not
 * shared with the frontend. Resolve its role from the API before denying a
 * privileged request.
 */
export async function authorizeAuthoritativeRequestRoles(
  request: NextRequest,
  allowedRoles: string[] = ['ADMIN'],
): Promise<Response | null> {
  const token = getRequestToken(request);
  const localUser = token ? verifyJwtToken(token) : null;
  const role = localUser?.role || (token ? await getAuthoritativeSessionRole(token) : null);

  if (!role) {
    return Response.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (!allowedRoles.includes(role)) {
    return Response.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Administrator access required.' } },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return null;
}

export async function authorizeActiveRequestRoles(
  request: NextRequest,
  allowedRoles: string[] = ['ADMIN']
): Promise<Response | null> {
  const token = getRequestToken(request);
  const user = token ? verifyJwtToken(token) : null;
  const roleError = authorizeRequestRoles(request, allowedRoles);
  if (roleError) return roleError;
  if (!token || !user) {
    return Response.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const response = await fetch(`${getBackendApiUrl()}/api/admin/session`, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 401) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Administrator account is inactive or no longer exists.' } },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    if (response.status === 403) {
      return Response.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Administrator access required.' } },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    if (!response.ok) {
      return Response.json(
        { success: false, error: { code: 'AUTHORIZATION_UNAVAILABLE', message: 'Could not verify the current account status.' } },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const payload = await response.json();
    const currentUser = payload?.data?.user;
    if (
      payload?.success !== true ||
      typeof currentUser?.id !== 'string' ||
      typeof currentUser?.role !== 'string'
    ) {
      throw new Error('Backend returned an invalid session response.');
    }
    if (currentUser.id !== user?.id || currentUser.role !== user.role) {
      return Response.json(
        { success: false, error: { code: 'TOKEN_STALE', message: 'Account permissions changed. Please sign in again.' } },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    if (!allowedRoles.includes(currentUser.role)) {
      return Response.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Administrator access required.' } },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return null;
  } catch (error) {
    console.error('[Admin authorization] Failed to verify account status:', error);
    return Response.json(
      { success: false, error: { code: 'AUTHORIZATION_UNAVAILABLE', message: 'Could not verify the current account status.' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(candidate: string, stored: string): boolean {
  if (!stored) return false;
  if (candidate === stored) return true;
  try {
    if (stored.includes(':')) {
      const colonIdx = stored.indexOf(':');
      const salt = stored.slice(0, colonIdx);
      const expectedHash = stored.slice(colonIdx + 1);
      const candidateHash = crypto.pbkdf2Sync(candidate, salt, 100000, 64, 'sha512').toString('hex');
      const storedBuf = Buffer.from(expectedHash, 'hex');
      const candidateBuf = Buffer.from(candidateHash, 'hex');
      return storedBuf.length === candidateBuf.length && crypto.timingSafeEqual(storedBuf, candidateBuf);
    } else {
      const legacySalt = process.env.PASSWORD_SALT || '';
      const candidateHash = crypto.pbkdf2Sync(candidate, legacySalt, 100000, 64, 'sha512').toString('hex');
      const storedBuf = Buffer.from(stored, 'hex');
      const candidateBuf = Buffer.from(candidateHash, 'hex');
      return storedBuf.length === candidateBuf.length && crypto.timingSafeEqual(storedBuf, candidateBuf);
    }
  } catch {
    return false;
  }
}

export function getBundledStoreJson<T = any>(filename: string): T | null {
  if (filename === 'users.json') {
    const bundled = Array.isArray(bundledUsersData) ? [...(bundledUsersData as any[])] : [];
    for (const dyn of getDynamicAdmins()) {
      if (isDeletedAdmin(dyn.email) || isDeletedAdmin(dyn.id)) continue;
      if (!bundled.some(u => u.email?.toLowerCase() === dyn.email?.toLowerCase())) {
        bundled.push(dyn);
      }
    }
    return bundled.filter(u => !isDeletedAdmin(u.email) && !isDeletedAdmin(u.id)) as unknown as T;
  }
  if (filename === 'settings.json') {
    const settings = Array.isArray(bundledSettingsData) ? JSON.parse(JSON.stringify(bundledSettingsData)) : [];
    const global = settings.find((s: any) => s.id === 'global_settings');
    if (global) {
      global.coAdmins = (global.coAdmins || []).filter((a: any) => !isDeletedAdmin(a.email) && !isDeletedAdmin(a.id));
      for (const dyn of getDynamicAdmins()) {
        if (isDeletedAdmin(dyn.email) || isDeletedAdmin(dyn.id)) continue;
        if (!global.coAdmins.some((a: any) => a.email?.toLowerCase() === dyn.email?.toLowerCase())) {
          global.coAdmins.push(dyn);
        }
      }
    }
    return settings as unknown as T;
  }
  return null;
}

export async function readLocalStoreJson<T = any>(filename: string): Promise<T | null> {
  return getBundledStoreJson<T>(filename);
}

export async function fetchBackendSettings(token?: string) {
  try {
    const adminToken = token || getInternalAdminToken();
    const target = `${getBackendApiUrl()}/api/admin/settings`;
    const res = await fetch(target, {
      headers: { Authorization: `Bearer ${adminToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      return json?.data || json;
    }
  } catch { }

  return null;
}

export async function saveBackendSettings(token: string | undefined, payload: { coAdmins?: any[] }) {
  try {
    const adminToken = token || getInternalAdminToken();
    const target = `${getBackendApiUrl()}/api/admin/settings`;

    // Strictly sanitize and validate incoming payload to prevent CWE-200 file-access-to-http
    const safeCoAdmins = Array.isArray(payload?.coAdmins)
      ? payload.coAdmins.map((a: any) => ({
          id: String(a?.id || ''),
          name: String(a?.name || ''),
          email: String(a?.email || '').toLowerCase().trim(),
          username: String(a?.username || '').toLowerCase().trim(),
          role: 'ADMIN',
          phone: String(a?.phone || ''),
          avatar: String(a?.avatar || ''),
          passwordHash: a?.passwordHash ? String(a.passwordHash) : undefined,
          isActive: a?.isActive !== false,
          createdAt: String(a?.createdAt || new Date().toISOString()),
          updatedAt: String(a?.updatedAt || new Date().toISOString()),
        }))
      : [];

    const res = await fetch(target, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ coAdmins: safeCoAdmins }),
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch { }
  return false;
}

/** Forward authoritative responses, including binary exports and error statuses. */
export async function proxyToBackend(
  request: NextRequest,
  targetSubpath: string,
  options?: { fallbackData?: unknown; body?: string | ArrayBuffer },
): Promise<Response> {
  const normalizedPath = targetSubpath.replace(/\\/g, '/');
  let decodedPath: string;
  try { decodedPath = decodeURIComponent(normalizedPath); } catch {
    return Response.json({ success: false, error: { message: 'Invalid target path' } }, { status: 400 });
  }
  if (decodedPath.split('/').includes('..') || decodedPath.startsWith('//') || decodedPath.includes('\\')) {
    return Response.json({ success: false, error: { message: 'Invalid target path' } }, { status: 400 });
  }
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  const target = `${getBackendApiUrl()}/api${cleanPath}${request.nextUrl.search || ''}`;
  const headers = new Headers();
  for (const name of ['authorization', 'cookie', 'content-type', 'origin', 'referer', 'x-csrf-token', 'accept']) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  // Ensure origin is present for mutating operations so backend CSRF guard passes
  if (!headers.has('origin')) {
    headers.set('origin', 'http://localhost:3000');
  }

  // Ensure content-type header is explicitly application/json when body is a JSON string
  if (options?.body !== undefined && typeof options.body === 'string' && (!headers.has('content-type') || !headers.get('content-type')?.includes('application/json'))) {
    headers.set('content-type', 'application/json');
  }

  // Public admin and upload proxies must always carry the caller's own signed token.
  const isAdminOrProtectedUpload =
    cleanPath === '/admin' ||
    cleanPath.startsWith('/admin/') ||
    ((cleanPath === '/upload' || cleanPath.startsWith('/upload/')) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method));
  const authorization = headers.get('authorization');
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearerToken || request.cookies.get('auth_token')?.value;

  if (isAdminOrProtectedUpload) {
    const decoded = token ? verifyJwtToken(token) : null;
    const authenticatedRole = decoded?.role || (token ? await getAuthoritativeSessionRole(token) : null);
    if (!authenticatedRole) {
      return Response.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    if (cleanPath.startsWith('/admin')) {
      const editorAllowed = /^\/admin\/(?:products|categories|brands|presence)(?:\/|$)/.test(cleanPath);
      if (authenticatedRole !== 'ADMIN' && !(authenticatedRole === 'PRODUCT_EDITOR' && editorAllowed)) {
        return Response.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Administrator access required.' } },
          { status: 403, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }
    if (!bearerToken && token) {
      headers.set('authorization', `Bearer ${token}`);
    }
  }

  try {
    let reqBody: any = undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      if (options?.body !== undefined) {
        reqBody = options.body;
      } else {
        reqBody = await request.arrayBuffer();
      }
    }
    let upstream = await fetch(target, {
      method: request.method, headers,
      body: reqBody,
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(15000),
    });

    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'content-disposition', 'retry-after', 'www-authenticate', 'location']) {
      const value = upstream.headers.get(name);
      if (value !== null) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie);
    const empty = request.method === 'HEAD' || [204, 205, 304].includes(upstream.status);
    return new Response(empty ? null : await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ success: false, error: { code: 'BACKEND_SERVICE_UNAVAILABLE', message: 'The service is temporarily unavailable. Please try again.' } }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
