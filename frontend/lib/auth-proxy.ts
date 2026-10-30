/** Authentication is decided exclusively by the backend, including rejections and MFA. */
export async function proxyAuth(request: Request, endpoint: 'login' | 'me' | 'logout'): Promise<Response> {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const base = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
  const headers = new Headers();
  for (const name of ['content-type', 'authorization', 'cookie', 'origin', 'referer', 'x-csrf-token']) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  try {
    const upstream = await fetch(`${base}/api/auth/${endpoint}`, {
      method: request.method,
      headers,
      body: request.method === 'POST' ? await request.text() : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'retry-after', 'www-authenticate']) {
      const value = upstream.headers.get(name);
      if (value !== null) responseHeaders.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie);
    }
    const body = await upstream.arrayBuffer();
    return new Response([204, 205, 304].includes(upstream.status) ? null : body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service is temporarily unavailable. Please try again.' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
