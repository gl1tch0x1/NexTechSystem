import type { NextRequest } from 'next/server';

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

/** Forward authoritative responses, including binary exports and error statuses. */
export async function proxyToBackend(
  request: NextRequest,
  targetSubpath: string,
  _options?: { fallbackData?: unknown },
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
  try {
    const upstream = await fetch(target, {
      method: request.method, headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
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
