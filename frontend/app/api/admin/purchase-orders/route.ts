import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  try {
    const res = await fetch(`${BACKEND_URL}/admin/purchase-orders`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend offline / standby
  }

  return NextResponse.json({
    success: true,
    data: [],
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/admin/purchase-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(errData, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to submit purchase order.' } },
      { status: 503 }
    );
  }
}
