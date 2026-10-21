import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const cleanUrl = BACKEND_URL.replace(/\/$/, '');
  const target = cleanUrl.endsWith('/admin') ? `${cleanUrl}/quotes` : `${cleanUrl}/admin/quotes`;

  try {
    const res = await fetch(target, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json().catch(() => ({ success: false, message: 'Backend error' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: err?.message || 'Backend quotes service unreachable.' } },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const cleanUrl = BACKEND_URL.replace(/\/$/, '');
  const target = cleanUrl.endsWith('/admin') ? `${cleanUrl}/quotes` : `${cleanUrl}/admin/quotes`;

  try {
    const body = await request.json();

    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    const data = await res.json().catch(() => ({ success: false, message: 'Backend error' }));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to process quotation.' } },
      { status: 503 }
    );
  }
}
