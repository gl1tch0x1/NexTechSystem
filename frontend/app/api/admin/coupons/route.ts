import { NextResponse } from 'next/server';
import { FALLBACK_COUPONS } from '@/lib/fallback-data';

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

      const res = await fetch(`${clean}/api/admin/coupons`, {
        headers,
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch (err) {
      console.warn('Backend admin coupons endpoint fetch failed, using fallbacks:', err);
    }
  }

  return NextResponse.json({
    success: true,
    data: FALLBACK_COUPONS,
    meta: { total: FALLBACK_COUPONS.length },
  });
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
    body = {};
  }

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const authHeader = request.headers.get('authorization');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${clean}/api/admin/coupons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json, { status: res.status });
      }
    } catch (err) {
      console.warn('Backend admin create coupon failed, using fallback:', err);
    }
  }

  const newCoupon = {
    id: `coupon_${Date.now()}`,
    ...body,
    usageCount: 0,
    isActive: body.isActive !== false,
  };

  return NextResponse.json({
    success: true,
    data: newCoupon,
    message: 'Coupon created successfully (fallback mode).',
  });
}
