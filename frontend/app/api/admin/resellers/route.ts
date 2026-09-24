import { NextRequest, NextResponse } from 'next/server';

function backendUrl(): string {
  const base = process.env.API_PROXY_TARGET || process.env.BACKEND_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
  return base.replace(/\/$/, '').replace(/\/api$/, '');
}

async function forward(request: NextRequest, method: 'GET' | 'POST') {
  const base = backendUrl();
  if (!base) {
    return NextResponse.json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Backend API is not configured.' } }, { status: 503 });
  }
  try {
    const response = await fetch(`${base}/api/admin/resellers`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization')! } : {}),
      },
      body: method === 'POST' ? await request.text() : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Reseller service is temporarily unavailable.' } }, { status: 503 });
  }
}

export function GET(request: NextRequest) { return forward(request, 'GET'); }
export function POST(request: NextRequest) { return forward(request, 'POST'); }
