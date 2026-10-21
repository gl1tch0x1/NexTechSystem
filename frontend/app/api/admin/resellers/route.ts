import { NextResponse } from 'next/server';

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

      const res = await fetch(`${clean}/api/admin/resellers`, {
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
      const errJson = await res.json().catch(() => ({ success: false, message: 'Backend error' }));
      return NextResponse.json(errJson, { status: res.status });
    } catch (err: any) {
      console.warn('[Admin Resellers API] Backend fetch error:', err?.message);
      return NextResponse.json(
        { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Backend service unreachable.' } },
        { status: 503 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Backend proxy not configured.' } },
    { status: 503 }
  );
}

export async function POST(request: Request) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Invalid JSON body' } }, { status: 400 });
  }

  // Attempt backend proxy first if available
  try {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${clean}/api/admin/resellers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });

    const json = await res.json().catch(() => ({ success: false, message: 'Backend error' }));
    return NextResponse.json(json, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: err?.message || 'Backend service unreachable.' } },
      { status: 503 }
    );
  }
}
