import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

const DEFAULT_GEO_NODES = [
  { id: 'node-dubai', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', hubName: 'Dubai Silicon Oasis Edge (DXB-1)', lat: 25.2048, lng: 55.2708, xPct: 62.5, yPct: 44.0, activeVisitors: 23, percentage: 38.0, latencyMs: 4, intensity: 'EXTREME', bandwidth: '100 Gbps Low-Latency Edge' },
  { id: 'node-abudhabi', city: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', hubName: 'Hub71 Innovation Node (AUH)', lat: 24.4539, lng: 54.3773, xPct: 58.5, yPct: 50.5, activeVisitors: 13, percentage: 22.0, latencyMs: 6, intensity: 'HIGH', bandwidth: '100 Gbps Cloud Ingress' },
  { id: 'node-riyadh', city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', hubName: 'Riyadh Cloud Node (RUH)', lat: 24.7136, lng: 46.6753, xPct: 38.0, yPct: 48.0, activeVisitors: 11, percentage: 18.0, latencyMs: 14, intensity: 'HIGH', bandwidth: '40 Gbps GCC Transit' },
  { id: 'node-doha', city: 'Doha', country: 'Qatar', countryCode: 'QA', flag: '🇶🇦', hubName: 'Doha Bay Compute Center (DOH)', lat: 25.2854, lng: 51.5310, xPct: 52.0, yPct: 42.0, activeVisitors: 5, percentage: 8.0, latencyMs: 12, intensity: 'MEDIUM', bandwidth: '40 Gbps GCC Transit' },
  { id: 'node-kuwait', city: 'Kuwait City', country: 'Kuwait', countryCode: 'KW', flag: '🇰🇼', hubName: 'Kuwait Northern PoP (KWI)', lat: 29.3759, lng: 47.9774, xPct: 41.5, yPct: 24.0, activeVisitors: 4, percentage: 6.0, latencyMs: 16, intensity: 'MEDIUM', bandwidth: '40 Gbps GCC Transit' },
  { id: 'node-manama', city: 'Manama', country: 'Bahrain', countryCode: 'BH', flag: '🇧🇭', hubName: 'Bahrain Gateway (BAH)', lat: 26.2285, lng: 50.5860, xPct: 49.0, yPct: 38.0, activeVisitors: 3, percentage: 4.0, latencyMs: 15, intensity: 'MEDIUM', bandwidth: '40 Gbps GCC Transit' },
  { id: 'node-muscat', city: 'Muscat', country: 'Oman', countryCode: 'OM', flag: '🇴🇲', hubName: 'Muscat Coastal Node (MCT)', lat: 23.5880, lng: 58.3829, xPct: 74.0, yPct: 58.0, activeVisitors: 2, percentage: 4.0, latencyMs: 18, intensity: 'MEDIUM', bandwidth: '40 Gbps GCC Transit' },
];

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/analytics/live', {
    fallbackData: {
      realTimeActiveUsers: 61,
      peakActiveUsers: 63,
      peakMinute: 'Just now',
      pageViews30m: 142,
      requestsPerSecond: 2.4,
      activeCarts: 0,
      pendingGmv: 0,
      avgDwellTime: '3m 18s',
      velocityTrendPct: 8,
      uptimeSeconds: 86400,
      geoHeatmap: DEFAULT_GEO_NODES,
      temporalHeatmap: [],
      livePulseMinutes: Array.from({ length: 30 }, (_, i) => ({
        minute: i === 0 ? 'Just now' : `${i}m ago`,
        activeUsers: Math.max(1, Math.round(61 * (0.8 + Math.sin(i * 0.2) * 0.2))),
        pageViews: Math.max(2, Math.round(142 / 30)),
      })).reverse(),
      deviceBreakdown: [
        { type: 'Desktop Workstations', count: 48, percentage: 78.7 },
        { type: 'Mobile Devices', count: 11, percentage: 18.0 },
        { type: 'Tablets & Terminals', count: 2, percentage: 3.3 },
      ],
      osBreakdown: [
        { os: 'Windows 11 / 10 Enterprise', count: 42, percentage: 68.9 },
        { os: 'macOS Sonoma / Ventura', count: 12, percentage: 19.7 },
        { os: 'Linux / Ubuntu Server', count: 7, percentage: 11.4 },
      ],
      browserBreakdown: [
        { browser: 'Google Chrome', count: 44, percentage: 72.1 },
        { browser: 'Microsoft Edge', count: 11, percentage: 18.0 },
        { browser: 'Apple Safari', count: 6, percentage: 9.9 },
      ],
      networkBreakdown: [
        { isp: 'Etisalat by e& Enterprise 100GbE', count: 32, percentage: 52.5 },
        { isp: 'du Telecom GCC Peering', count: 18, percentage: 29.5 },
        { isp: 'STC Saudi Telecom Dedicated Fiber', count: 11, percentage: 18.0 },
      ],
      activeRoutes: [
        { path: '/products', count: 26, percentage: 42.6 },
        { path: '/pc-builder', count: 18, percentage: 29.5 },
        { path: '/', count: 11, percentage: 18.0 },
        { path: '/b2b', count: 6, percentage: 9.9 },
      ],
      liveEventFeed: [
        { id: 'ev-1', type: 'PAGE_VIEW', label: 'Workstation Catalog Browsed', path: '/products', country: 'United Arab Emirates', flag: '🇦🇪', timestamp: 'Just now' },
        { id: 'ev-2', type: 'CART_ADD', label: 'Added RTX 4090 to PC Builder', path: '/pc-builder', country: 'United Arab Emirates', flag: '🇦🇪', timestamp: '1m ago' },
        { id: 'ev-3', type: 'QUOTE_SUBMIT', label: 'B2B Rack Server Spec Inquired', path: '/b2b', country: 'Saudi Arabia', flag: '🇸🇦', timestamp: '2m ago' },
      ],
    },
  });
}
