import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const body = await request.json().catch(() => ({}));
  const { code, subtotal = 0 } = body;

  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/cart/coupon/validate`, {
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

  const cleanCode = String(code || '').trim().toUpperCase();

  if (cleanCode === 'TECH10') {
    const discountAmount = Math.round((Number(subtotal) * 0.1) * 100) / 100;
    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        code: 'TECH10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount,
        minOrderAmount: 0,
      },
    });
  }

  return NextResponse.json(
    { success: false, error: { code: 'INVALID_COUPON', message: 'Coupon code is invalid or has expired.' } },
    { status: 400 }
  );
}
