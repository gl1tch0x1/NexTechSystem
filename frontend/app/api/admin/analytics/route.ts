import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/analytics', {
    fallbackData: {
      kpis: {
        grossRevenue: 0,
        netRevenue: 0,
        totalOrders: 0,
        totalUnitsSold: 0,
        averageOrderValue: 0,
        conversionRate: null,
      },
      revenueTimeline: [],
      topModels: [],
      categoryDistribution: [],
    },
  });
}
