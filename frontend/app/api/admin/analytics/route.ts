import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/analytics', {
    fallbackData: {
      kpis: {
        grossRevenue: 450000,
        netRevenue: 428000,
        totalOrders: 142,
        totalUnitsSold: 310,
        averageOrderValue: 3169,
        conversionRate: 3.4,
      },
      revenueByDay: [],
      topSellingProducts: [],
      categoryBreakdown: [],
    },
  });
}
