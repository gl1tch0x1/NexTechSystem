import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/analytics/live', {
    fallbackData: {
      realTimeActiveUsers: 0,
      peakActiveUsers: 0,
      peakMinute: 'N/A',
      pageViews30m: 0,
      requestsPerSecond: 0,
      activeCarts: 0,
      pendingGmv: 0,
      avgDwellTime: '0s',
      velocityTrendPct: 0,
      uptimeSeconds: 0,
      geoHeatmap: [],
      temporalHeatmap: [],
      livePulseMinutes: Array.from({ length: 30 }, (_, i) => ({
        minute: i === 0 ? 'Just now' : `${i}m ago`,
        activeUsers: 0,
        pageViews: 0,
      })).reverse(),
      deviceBreakdown: [],
      osBreakdown: [],
      browserBreakdown: [],
      networkBreakdown: [],
      activeRoutes: [],
      liveEventFeed: [],
    },
  });
}
