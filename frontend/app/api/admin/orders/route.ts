import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_ORDERS } from '@/lib/fallback-data';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const authHeader = request.headers.get('authorization');
  const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');

  try {
    const res = await fetch(`${clean}/api/admin/orders`, {
      headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    }
  } catch (err: any) {
    console.warn('[Admin Orders API] Backend proxy error, using fallback:', err?.message);
  }

  return NextResponse.json({
    success: true,
    data: FALLBACK_ORDERS,
  });
}
