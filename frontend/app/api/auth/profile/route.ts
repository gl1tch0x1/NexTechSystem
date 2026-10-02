import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || 'http://localhost:5000';
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication token required.' } },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');

  try {
    const res = await fetch(`${clean}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'GATEWAY_ERROR', message: error?.message || 'Failed to reach profile update service.' } },
      { status: 502 }
    );
  }
}
