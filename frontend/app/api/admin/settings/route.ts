import { NextResponse } from 'next/server';

let memorySettings: Record<string, any> = {};

export async function GET(request: Request) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const authHeader = request.headers.get('authorization');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${clean}/api/admin/settings`, {
        headers,
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return NextResponse.json(json);
        }
      }
    } catch (err) {
      console.warn('Backend admin settings fetch failed, using fallbacks:', err);
    }
  }

  return NextResponse.json({
    success: true,
    data: memorySettings,
  });
}

export async function PUT(request: Request) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const authHeader = request.headers.get('authorization');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${clean}/api/admin/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json, { status: res.status });
      }
    } catch (err) {
      console.warn('Backend admin update settings failed, updating in-memory state:', err);
    }
  }

  memorySettings = { ...memorySettings, ...body };

  return NextResponse.json({
    success: true,
    data: memorySettings,
    message: 'Store settings updated successfully.',
  });
}
