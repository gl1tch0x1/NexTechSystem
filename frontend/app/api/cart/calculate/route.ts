import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const body = await request.json().catch(() => ({}));
  const { items = [], couponCode, requestedWalletDeduction = 0 } = body;

  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/cart/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://localhost:5000/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'DATA_UNAVAILABLE',
        message: 'Cart calculation is unavailable because the backend catalog and pricing services are not configured or reachable.',
      },
    },
    { status: 503 }
  );
}
