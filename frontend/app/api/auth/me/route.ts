import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const authHeader = request.headers.get('authorization');

  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/auth/me`, {
        headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch (err: any) {
      console.warn('[Auth API] Current-user backend unavailable:', err?.message || err);
      return NextResponse.json(
        {
          success: false,
          error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service is unavailable.' },
        },
        { status: 503 }
      );
    }
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
        signal: AbortSignal.timeout(1500),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Backend-only profile lookup is the source of truth.
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No valid authenticated session is available.' },
    },
    { status: 401 }
  );
}
