import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const authHeader = request.headers.get('authorization');
  const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');

  try {
    const res = await fetch(`${clean}/api/admin/dashboard`, {
      headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    }
  } catch (err: any) {
    console.warn('[Dashboard API] Backend proxy error:', err?.message);
  }

  return NextResponse.json({
    success: true,
    data: {
      metrics: {
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        activeResellers: 0,
        pendingApprovals: 0,
        lowStockItems: 0,
      },
      revenueOverview: [],
      recentOrders: [],
    },
  });
}
