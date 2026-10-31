import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/dashboard', {
    fallbackData: {
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
