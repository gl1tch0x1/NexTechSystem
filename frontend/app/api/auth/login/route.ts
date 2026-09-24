import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const body = await request.json().catch(() => ({}));

  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch (err: any) {
      console.warn('[Auth API] Remote backend is unavailable:', err?.message || err);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_SERVICE_UNAVAILABLE',
            message: 'Authentication service is currently unavailable. Please ensure the backend and Firebase Auth are configured correctly.',
          },
        },
        { status: 503 }
      );
    }
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Let backend-only auth be authoritative; no local demo fallback.
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'AUTH_SERVICE_UNAVAILABLE',
        message: 'Authentication service is unavailable. Firebase Authentication and the backend auth service must be configured.',
      },
    },
    { status: 503 }
  );
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Authentication gateway is active. Use the backend Firebase-authenticated service to sign in.',
  });
}
