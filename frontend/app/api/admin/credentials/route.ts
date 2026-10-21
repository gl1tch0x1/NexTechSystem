import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  try {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${clean}/api/admin/profile`, {
      headers,
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json);
    }
    return NextResponse.json({ success: false, message: 'Admin profile not found' }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: err?.message || 'Backend service unreachable.' } },
      { status: 503 }
    );
  }
}

export async function PUT(request: Request) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  try {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${clean}/api/admin/credentials`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: err?.message || 'Backend service unreachable.' } },
      { status: 503 }
    );
  }
}
