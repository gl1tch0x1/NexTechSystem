import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  try {
    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${BACKEND_URL}/admin/purchase-orders/generate-low-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errData = await res.json().catch(() => ({}));
    return NextResponse.json(errData, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: { message: err?.message || 'Automated replenishment service unavailable.' },
      },
      { status: 503 }
    );
  }
}
