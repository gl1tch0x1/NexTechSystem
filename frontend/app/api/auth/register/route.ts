import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const body = await request.json().catch(() => ({}));

  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch (err: any) {
      console.warn('[Auth API] Remote registration service is unavailable:', err?.message || err);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REGISTRATION_SERVICE_UNAVAILABLE',
            message: 'Registration is unavailable because the backend auth service and Firebase Authentication are not reachable.',
          },
        },
        { status: 503 }
      );
    }
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // No local demo registration path.
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'REGISTRATION_SERVICE_UNAVAILABLE',
        message: 'Registration service is unavailable. Configure the backend and Firebase Authentication before creating a new account.',
      },
    },
    { status: 503 }
  );
}
