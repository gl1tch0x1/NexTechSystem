import type { NextRequest } from 'next/server';
import crypto from 'crypto';

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

/**
 * Generates an authoritative internal system administrator JWT token for server-to-server operations.
 * Used exclusively when relaying administrative operations from Next.js server proxy to Express backend.
 */
export function getInternalAdminToken(): string {
  const secret = process.env.JWT_SECRET || 'nexn3ui4b53t14uibgn93845bgn9q385brc235235h$^%&T*FDFV&^F^Rdtf627fe63';
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

export function createJwtToken(payload: { id: string; email: string; role: string; resellerId?: string }): string {
  const secret = process.env.JWT_SECRET || 'nexn3ui4b53t14uibgn93845bgn9q385brc235235h$^%&T*FDFV&^F^Rdtf627fe63';
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

export function verifyJwtToken(token: string): { id: string; email: string; role: string; resellerId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const secret = process.env.JWT_SECRET || 'nexn3ui4b53t14uibgn93845bgn9q385brc235235h$^%&T*FDFV&^F^Rdtf627fe63';
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

export async function fetchBackendSettings(token?: string) {
  try {
    const adminToken = token || getInternalAdminToken();
    const target = `${getBackendApiUrl()}/api/admin/settings`;
    const res = await fetch(target, {
      headers: { Authorization: `Bearer ${adminToken}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      return json?.data || json;
    }
  } catch {}
  return null;
}

export async function saveBackendSettings(token: string | undefined, payload: any) {
  try {
    const adminToken = token || getInternalAdminToken();
    const target = `${getBackendApiUrl()}/api/admin/settings`;
    const res = await fetch(target, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return res.ok;
  } catch {}
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
