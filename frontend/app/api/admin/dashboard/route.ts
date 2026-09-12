import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_PRODUCTS, FALLBACK_ORDERS, FALLBACK_USERS, FALLBACK_RESELLERS } from '@/lib/fallback-data';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const authHeader = request.headers.get('authorization');

  // Try external backend if configured
  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/admin/dashboard`, {
        headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  // Try local backend
  if (process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
        signal: AbortSignal.timeout(1500),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  const totalRevenue = FALLBACK_ORDERS.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = FALLBACK_ORDERS.length;
  const totalProducts = FALLBACK_PRODUCTS.length;
  const totalCustomers = FALLBACK_USERS.filter(u => u.role === 'CUSTOMER').length;

  return NextResponse.json({
    success: true,
    data: {
      metrics: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        activeResellers: FALLBACK_RESELLERS.length,
        pendingApprovals: FALLBACK_PRODUCTS.filter(p => p.approvalStatus === 'PENDING_APPROVAL').length,
        lowStockItems: FALLBACK_PRODUCTS.filter(p => p.stock <= (p.lowStockThreshold || 5)).length,
      },
      revenueOverview: [
        { month: 'Jan', revenue: 145000 },
        { month: 'Feb', revenue: 182000 },
        { month: 'Mar', revenue: 215000 },
        { month: 'Apr', revenue: 268000 },
        { month: 'May', revenue: 310000 },
        { month: 'Jun', revenue: 385000 },
      ],
      recentOrders: FALLBACK_ORDERS.slice(0, 5),
    },
  });
}
