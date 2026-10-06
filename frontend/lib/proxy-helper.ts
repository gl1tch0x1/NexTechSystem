import { NextRequest, NextResponse } from 'next/server';

export function getBackendApiUrl(): string {
  const url =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';
  return url.replace(/\/$/, '').replace(/\/api$/, '');
}

/**
 * Universal Next.js API proxy helper that forwards requests directly
 * to the authoritative Express backend API service.
 */
export async function proxyToBackend(
  request: NextRequest,
  targetSubpath: string,
  options?: {
    fallbackData?: any;
  }
) {
  const backendBase = getBackendApiUrl();
  const search = request.nextUrl.search || '';
  const cleanSubpath = targetSubpath.startsWith('/') ? targetSubpath : `/${targetSubpath}`;
  const targetUrl = `${backendBase}/api${cleanSubpath}${search}`;

  const headers: Record<string, string> = {};
  const authHeader = request.headers.get('authorization');
  if (authHeader) headers['Authorization'] = authHeader;

  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const method = request.method;
  let body: any = undefined;

  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(8000),
    });

    const resContentType = res.headers.get('content-type') || '';
    if (resContentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } else {
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: { 'Content-Type': resContentType || 'text/plain' },
      });
    }
  } catch (err: any) {
    console.warn(`[Proxy Notice] Backend at ${targetUrl} unavailable:`, err?.message || err);

    if (options?.fallbackData !== undefined) {
      return NextResponse.json(
        {
          success: true,
          data: options.fallbackData,
          _meta: { source: 'resilient_local_cache' },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKEND_SERVICE_UNAVAILABLE',
          message: 'Unable to connect to the backend service. Please verify server is running on port 5000.',
        },
      },
      { status: 503 }
    );
  }
}
