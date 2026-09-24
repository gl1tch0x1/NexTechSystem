import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  const configuredBackend = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const backend = configuredBackend
    ? configuredBackend.replace(/\/$/, '').replace(/\/api$/, '')
    : process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : null;

  if (!backend) {
    return NextResponse.json({ success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service is unavailable.' } }, { status: 503 });
  }

  try {
    const response = await fetch(`${backend}/api/auth/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization')! } : {}),
      },
      body: await request.text(),
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service is unavailable.' } }, { status: 503 });
  }
}
