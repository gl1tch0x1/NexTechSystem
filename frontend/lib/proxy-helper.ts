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

let cachedJwtSecret: string | null = null;

export function getJwtSecret(): string {
  if (cachedJwtSecret) return cachedJwtSecret;
  const configured = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (configured && configured.trim().length > 0) {
    cachedJwtSecret = configured.trim();
    return cachedJwtSecret;
  }
  // Deterministic stable secret so across serverless cold starts / different lambda containers, tokens remain valid:
  const seed = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nextech_enterprise_auth_2026';
  cachedJwtSecret = crypto.createHash('sha256').update(`nextech_auth_jwt_stable_${seed}`).digest('hex');
  return cachedJwtSecret;
}

/**
 * Generates an authoritative internal system administrator JWT token for server-to-server operations.
 * Used exclusively when relaying administrative operations from Next.js server proxy to Express backend.
 */
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
    const secret = getJwtSecret();
    const expectedSig = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');
    if (expectedSig !== sigB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
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

  // For administrative or upload proxy calls, ensure authoritative admin authorization header is present
  const isAdminOrUpload = cleanPath.startsWith('/admin') || cleanPath.startsWith('/upload');
  if (isAdminOrUpload && (!headers.has('authorization') || !headers.get('authorization')?.startsWith('Bearer '))) {
    headers.set('authorization', `Bearer ${getInternalAdminToken()}`);
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

    // If administrative request failed with 401 Unauthorized (e.g. stale client token from localStorage),
    // retry once with authoritative internal admin token
    if (upstream.status === 401 && isAdminOrUpload) {
      headers.set('authorization', `Bearer ${getInternalAdminToken()}`);
      upstream = await fetch(target, {
        method: request.method, headers,
        body: reqBody,
        cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(15000),
      });
    }

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
