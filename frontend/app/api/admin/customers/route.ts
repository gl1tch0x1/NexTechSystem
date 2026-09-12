import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_USERS } from '@/lib/fallback-data';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const authHeader = request.headers.get('authorization');

  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/admin/customers`, {
        headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
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
      const res = await fetch('http://localhost:5000/api/admin/customers', {
        headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
        signal: AbortSignal.timeout(1500),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  const customers = FALLBACK_USERS.filter(u => u.role === 'CUSTOMER').map(u => ({
    ...u,
    walletBalance: 2500,
    orderCount: 2,
    totalSpent: 4200,
  }));

  return NextResponse.json({
    success: true,
    data: customers,
  });
}
