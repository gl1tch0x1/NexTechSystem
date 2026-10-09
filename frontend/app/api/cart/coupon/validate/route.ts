import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';
  const body = await request.json().catch(() => ({}));
  const { code, subtotal = 0 } = body;

  if (backendUrl) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/cart/coupon/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json, { status: res.status });
      }
    } catch {
      // Fall through to resilient fallback
    }
  }

  const cleanCode = String(code || '').trim().toUpperCase();

  if (cleanCode === 'TECH10' || cleanCode === 'NEXTECH10') {
    const discountAmount = Math.round((Number(subtotal) * 0.1) * 100) / 100;
    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        code: cleanCode,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        discountAmount,
        minOrderAmount: 0,
      },
    });
  }

  if (cleanCode === 'SUMMER50') {
    const discountAmount = Math.min(50, Number(subtotal));
    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        code: 'SUMMER50',
        discountType: 'FIXED',
        discountValue: 50,
        discountAmount,
        minOrderAmount: 500,
      },
    });
  }

  return NextResponse.json(
    { success: false, error: { code: 'INVALID_COUPON', message: 'Coupon code is invalid or has expired.' } },
    { status: 400 }
  );
}
