'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, sanitizeCsvField } from '@/lib/utils';
import { DEFAULT_PRODUCT_PLACEHOLDER } from '@/lib/product-image-url';
import {
  TrendingUp,
  ShoppingBag,
  Activity,
  Sparkles,
  BarChart3,
  Globe,
  RefreshCw,
  Download,
  Layers,
  Zap,
  Package,
  CheckCircle2,
  Flame,
  ArrowRight,
  Sliders,
  Server
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetryViewMode, setTelemetryViewMode] = useState<'bars' | 'wave'>('bars');
  const [hoveredPulse, setHoveredPulse] = useState<{ minute: string; activeUsers: number; pageViews?: number } | null>(null);

  const fetchAnalytics = async (range = timeRange) => {
    if (!token) return;
    try {
      setIsRefreshing(true);
      const res = await ApiClient.get(`/admin/analytics?range=${range}`, { token });
      setAnalytics(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [token, timeRange]);

  const handleExportCSV = () => {
    if (!analytics) return;
    const rows = [
      ['Metric', 'Value'].map(sanitizeCsvField),
      ['Time Range', timeRange].map(sanitizeCsvField),
      [sanitizeCsvField('Gross Revenue (AED)'), analytics.kpis?.grossRevenue || 0],
      [sanitizeCsvField('Net Revenue (AED)'), analytics.kpis?.netRevenue || 0],
      [sanitizeCsvField('Total Paid Orders'), analytics.kpis?.totalOrders || 0],
      [sanitizeCsvField('Total Units Sold'), analytics.kpis?.totalUnitsSold || 0],
      [sanitizeCsvField('Average Order Value (AED)'), analytics.kpis?.averageOrderValue || 0],
      [sanitizeCsvField('Conversion Rate (%)'), analytics.kpis?.conversionRate || 0],
      [sanitizeCsvField('Live Active Users'), analytics.trafficAnalytics?.realTimeActiveUsers || 0],
      [],
      ['Top Selling Products', 'SKU', 'Units Sold', 'Revenue (AED)'].map(sanitizeCsvField),
      ...(analytics.topModels || []).map((p: any) => [
        sanitizeCsvField(p.name),
        sanitizeCsvField(p.sku),
        p.unitsSold || 0,
        p.revenue || 0,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nextech_analytics_report_${timeRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Aggregating Enterprise Commercial & Traffic Telemetry...</p>
        </div>
      </div>
    );
  }

  const kpis = analytics?.kpis || {};
  const traffic = analytics?.trafficAnalytics || {};
  const timeline = analytics?.revenueTimeline || [];
  const topModels = analytics?.topModels || [];
  const categories = analytics?.categoryDistribution || [];
  const funnel = analytics?.conversionFunnel || [];

  const purchasesSummary = analytics?.purchasesSummary || {
    totalPurchaseSpend: kpis.totalPurchaseSpend || 0,
    totalPurchaseCount: kpis.totalPurchaseCount || 0,
    totalUnitsPurchased: kpis.totalUnitsPurchased || 0,
    receivedSpend: 0,
    pendingSpend: 0,
    receivedPOCount: 0,
    pendingPOCount: 0,
  };

  const salesSummary = analytics?.salesSummary || {
    totalSalesRevenue: kpis.grossRevenue || 0,
    totalSalesCount: kpis.totalOrders || 0,
    totalUnitsSold: kpis.totalUnitsSold || 0,
    averageOrderValue: kpis.averageOrderValue || 0,
  };

  const profitabilitySummary = analytics?.profitabilitySummary || {
    grossProfit: kpis.grossProfit ?? (Math.round(((kpis.grossRevenue || 0) - (purchasesSummary.totalPurchaseSpend || 0)) * 100) / 100),
    grossMarginPercentage: kpis.grossMarginPercentage ?? 0,
    salesToPurchaseRatio: purchasesSummary.totalPurchaseSpend > 0 ? Math.round(((kpis.grossRevenue || 0) / purchasesSummary.totalPurchaseSpend) * 100) / 100 : 0,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto transition-colors duration-200">
      {analytics?.trafficAnalytics?.message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{analytics.trafficAnalytics.message}</p>}
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>REAL-TIME BUSINESS INTELLIGENCE & TELEMETRY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            <span>Commercial & Traffic Analytics</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Live visitor streams, multi-seller selling/buying velocity, top-selling models, and GCC regional telemetry.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Navigation to Live Visitors & Heatmap */}
          <Link
            href="/admin/analytics/live"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 group cursor-pointer"
            title="Open Live Visitors & Geographic Heatmap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Visitors & Heatmap</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Time Range Selector */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold">
            {(['24h', '7d', '30d', '90d', '1y'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === range
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAnalytics(timeRange)}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-500' : ''}`} />
          </button>

          {/* Export Report CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Real-Time Google Analytics Traffic Pulse Hero Bar — Theme-Adaptive & Professional Clean Design */}
      {(() => {
        const livePulse = (traffic.livePulseMinutes && traffic.livePulseMinutes.length > 0)
          ? traffic.livePulseMinutes
          : Array.from({ length: 30 }, (_, i) => ({
              minute: 29 - i === 0 ? 'Just now' : `${29 - i}m ago`,
              activeUsers: 0,
              pageViews: 0,
            }));

        const peakPulse = Math.max(...livePulse.map((p: any) => p.activeUsers || 0), traffic.realTimeActiveUsers || 0);
        const totalViews30m = livePulse.reduce((acc: number, p: any) => acc + (p.pageViews || 0), 0);
        const currentActiveUsers = traffic.realTimeActiveUsers ?? (livePulse[livePulse.length - 1]?.activeUsers || 0);

        // Calculate real traffic velocity across the 30-minute window
        const firstHalfViews = livePulse.slice(0, 15).reduce((acc: number, p: any) => acc + (p.pageViews || 0), 0);
        const secondHalfViews = livePulse.slice(15).reduce((acc: number, p: any) => acc + (p.pageViews || 0), 0);
        const velocityPct = firstHalfViews > 0
          ? Math.round(((secondHalfViews - firstHalfViews) / firstHalfViews) * 100)
          : (secondHalfViews > 0 ? 100 : 0);

        // SVG Path generator for wave mode
        const maxVal = Math.max(peakPulse * 1.15, 1);
        const svgPoints = livePulse.map((p: any, idx: number) => {
          const x = (idx / (livePulse.length - 1)) * 100;
          const y = maxVal > 0 ? 100 - (p.activeUsers / maxVal) * 85 : 100;
          return { x, y };
        });
        const pathD = svgPoints.reduce((acc: string, pt: { x: number; y: number }, idx: number, arr: Array<{ x: number; y: number }>) => {
          if (idx === 0) return `M ${pt.x} ${pt.y}`;
          const prev = arr[idx - 1];
          const cX1 = prev.x + (pt.x - prev.x) / 2;
          const cY1 = prev.y;
          const cX2 = prev.x + (pt.x - prev.x) / 2;
          const cY2 = pt.y;
          return `${acc} C ${cX1} ${cY1}, ${cX2} ${cY2}, ${pt.x} ${pt.y}`;
        }, '');
        const areaD = `${pathD} L 100 100 L 0 100 Z`;

        return (
          <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white p-6 shadow-xs transition-colors">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Real-time Concurrency & Stream Status */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-mono font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>LIVE TELEMETRY STREAM</span>
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                    <span>{currentActiveUsers}</span>
                    <span className="text-xs font-sans text-slate-500 dark:text-slate-400 font-normal">Active Concurrent Visitors</span>
                  </div>
                </div>

                {/* Micro-Telemetry Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-mono flex items-center gap-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Peak:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{peakPulse}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-mono flex items-center gap-1.5">
                    <span className="text-slate-500 dark:text-slate-400">30m Vol:</span>
                    <span className="text-indigo-600 dark:text-indigo-300 font-bold">{Math.round(totalViews30m).toLocaleString()} views</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-bold">{velocityPct >= 0 ? `+${velocityPct}%` : `${velocityPct}%`} 15m trend</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Telemetry Chart & Detailed View Option */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-3 bg-slate-50/60 dark:bg-slate-950/40 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                {/* Header Row with Chart Controls & Detailed View CTA */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800/60">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Activity className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">Page Views in Last 30 Minutes</span>
                    <span className="hidden sm:inline-block text-[10px] text-slate-500 dark:text-slate-400 font-mono">100% Real-Time Sensor Resolution</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher: Bars or Wave */}
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTelemetryViewMode('bars')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          telemetryViewMode === 'bars'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Bars
                      </button>
                      <button
                        type="button"
                        onClick={() => setTelemetryViewMode('wave')}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          telemetryViewMode === 'wave'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        Wave
                      </button>
                    </div>

                    {/* Detailed View CTA Button */}
                    <Link
                      href="/admin/analytics/live"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm active:scale-98 group cursor-pointer"
                      title="Open full detailed analytics with real-time visitors heat map in another page"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      <span>Detailed View & Heatmap</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="relative pt-2">
                  {/* Subtle Reference Grid Lines */}
                  <div className="absolute inset-x-0 top-3 border-b border-dashed border-slate-200 dark:border-slate-800/80 pointer-events-none">
                    <span className="absolute -top-2.5 right-0 text-[9px] font-mono text-slate-400 dark:text-slate-500">Peak {peakPulse}</span>
                  </div>
                  <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200/60 dark:border-slate-800/50 pointer-events-none">
                    <span className="absolute -top-2.5 right-0 text-[9px] font-mono text-slate-400 dark:text-slate-600">Mid {Math.round(peakPulse / 2)}</span>
                  </div>

                  {telemetryViewMode === 'bars' ? (
                    /* Redesigned Clean Sleek Bars */
                    <div className="h-16 flex items-end gap-1 sm:gap-1.5 pt-2 relative z-10">
                      {livePulse.map((m: any, idx: number) => {
                        const heightPct = Math.min(100, Math.max(12, (m.activeUsers / maxVal) * 100));
                        const isLatest = idx === livePulse.length - 1;
                        const isHovered = hoveredPulse?.minute === m.minute;

                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredPulse(m)}
                            onMouseLeave={() => setHoveredPulse(null)}
                            className="flex-1 h-full flex items-end group relative cursor-pointer"
                          >
                            <div
                              className={`w-full rounded-t-sm transition-all duration-200 relative ${
                                isLatest
                                  ? 'bg-purple-600 dark:bg-purple-500 ring-2 ring-purple-400/50 dark:ring-purple-300 shadow-sm animate-pulse'
                                  : isHovered
                                  ? 'bg-purple-700 dark:bg-purple-400 scale-y-105 shadow-xs'
                                  : 'bg-purple-600/85 hover:bg-purple-600 dark:bg-purple-600/90 dark:hover:bg-purple-500'
                              }`}
                              style={{ height: `${heightPct}%` }}
                            />
                            {isLatest && (
                              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-300 shadow-sm animate-ping pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Waveform Mode (High-Tech SVG Spline) */
                    <div className="h-16 w-full pt-2 relative z-10">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="telemetryWaveGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#9333ea" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="telemetryLineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#9333ea" />
                            <stop offset="50%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                        <path d={areaD} fill="url(#telemetryWaveGrad)" />
                        <path d={pathD} fill="none" stroke="url(#telemetryLineGrad)" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  {/* Active Tooltip / Inspect Pill */}
                  <div className="h-5 flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <span>30m ago</span>
                    {hoveredPulse ? (
                      <span className="text-blue-700 dark:text-cyan-300 font-bold bg-white dark:bg-slate-800/90 px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-500/30 shadow-2xs animate-in fade-in">
                        {hoveredPulse.minute}: {hoveredPulse.activeUsers} active visitors • {hoveredPulse.pageViews ?? 0} views
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Hover any minute column for granular sensor telemetry</span>
                    )}
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Now • Live</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. Top-Level Commercial Performance KPIs (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Platform Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <span className="font-bold text-[11px] font-mono tracking-tight select-none">AED</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatPrice(kpis.grossRevenue || 0)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{kpis.growthPercentage !== undefined ? `${kpis.growthPercentage >= 0 ? '+' : ''}${kpis.growthPercentage}% vs Previous Period` : 'Verified Platform Sales'}</span>
          </div>
        </div>

        {/* Total Units Sold */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Hardware Units Sold</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {kpis.totalUnitsSold || 0} <span className="text-sm font-sans font-normal text-slate-500 dark:text-slate-400">Units</span>
          </div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{kpis.totalOrders || 0} Orders Completed</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Order Value (AOV)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatPrice(kpis.averageOrderValue || 0)}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span>High-Density Enterprise Basket</span>
          </div>
        </div>

        {/* Funnel Conversion Rate */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Funnel Conversion Rate</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {kpis.conversionRate == null ? 'Unavailable' : `${kpis.conversionRate}%`}
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Top Tier in GCC Hardware E-Commerce</span>
          </div>
        </div>
      </div>

      {/* 2.5 Sales vs Procurement Financial Intelligence Deck */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>COMMERCIAL P&L & PROCUREMENT SPREAD</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Customer Sales vs Supplier Procurement Comparison ({timeRange.toUpperCase()})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comparison between customer retail/enterprise orders generated and wholesale inbound inventory purchase orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Sales Orders ({salesSummary.totalSalesCount})</span>
            </Link>
            <Link
              href="/admin/purchase-orders"
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Purchase Orders ({purchasesSummary.totalPurchaseCount})</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Box 1: Sales Revenue */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40 space-y-2">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase font-mono">
              <span>Customer Sales Revenue</span>
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {formatPrice(salesSummary.totalSalesRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>{salesSummary.totalSalesCount} Orders</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{salesSummary.totalUnitsSold} Units Sold</span>
            </div>
          </div>

          {/* Box 2: Procurement Spend */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/40 space-y-2">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase font-mono">
              <span>Wholesale Procurement Spend</span>
              <Server className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {formatPrice(purchasesSummary.totalPurchaseSpend)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>{purchasesSummary.totalPurchaseCount} Purchase Orders</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{purchasesSummary.totalUnitsPurchased} Procured</span>
            </div>
          </div>

          {/* Box 3: Gross Margin */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 space-y-2">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase font-mono">
              <span>Net Gross Margin (P&L)</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {formatPrice(profitabilitySummary.grossProfit)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>Gross Profit Margin</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+{profitabilitySummary.grossMarginPercentage}%</span>
            </div>
          </div>

          {/* Box 4: Multiplier & Velocity */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/40 space-y-2">
            <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-[10px] font-bold uppercase font-mono">
              <span>Sales-to-Purchase Multiplier</span>
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {profitabilitySummary.salesToPurchaseRatio}x
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
              <span>Wholesale Recovery</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">Profitable Spread</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sales & Revenue Timeseries Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Revenue & Order Volume Timeseries</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Commercial billing telemetry segmented by interval ({timeRange.toUpperCase()})</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-600" />
              <span className="text-slate-800 dark:text-slate-200 font-bold">Gross Sales (AED)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-tech-blue dark:bg-tech-cyan" />
              <span className="text-slate-800 dark:text-slate-200 font-bold">Order Pulse</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart with High-Contrast Axes and Responsive Tooltip */}
        <div className="w-full rounded-2xl bg-slate-50/90 dark:bg-slate-950/80 p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="w-full h-72 sm:h-80">
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={timeline}
                  margin={{ top: 20, right: 16, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9333ea" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.2)"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                    interval="preserveStartEnd"
                    minTickGap={25}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="revenue"
                    stroke="#64748b"
                    fontSize={11}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `AED ${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `AED ${(val / 1000).toFixed(1)}k`;
                      return `AED ${val}`;
                    }}
                    width={85}
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    hide={true}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(147, 51, 234, 0.08)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-3 rounded-xl shadow-2xl border border-slate-700 ring-1 ring-white/10 z-50 text-xs">
                            <div className="font-extrabold text-cyan-400 mb-1">{data.label || label}</div>
                            <div className="font-black text-white text-sm">
                              Gross Sales: {formatPrice(data.revenue || 0)}
                            </div>
                            <div className="text-slate-300 text-[11px] font-semibold mt-1">
                              {data.orders || 0} Orders • {data.units || 0} Units Sold
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    fill="url(#revenueBarGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#06b6d4', stroke: '#0891b2', strokeWidth: 1 }}
                    activeDot={{ r: 6, fill: '#22d3ee' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No timeseries telemetry available for this range.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Top Selling Models & SKU Leaderboard */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm space-y-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 shrink-0" />
              <span>Top-Selling Hardware Models & Velocity Leaderboard</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ranked by gross sales volume, units deployed, and catalog turnover rate</p>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-bold text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
          >
            <span>Catalog Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto custom-scrollbar w-full rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <table className="w-full min-w-[850px] text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[280px]">Rank & Hardware Item</th>
                <th className="py-3.5 px-4 font-bold min-w-[170px]">SKU & Category</th>
                <th className="py-3.5 px-4 font-bold min-w-[100px] whitespace-nowrap">Units Sold</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px] whitespace-nowrap">Gross Revenue</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px] whitespace-nowrap">Inventory Stock</th>
                <th className="py-3.5 px-4 font-bold min-w-[150px] whitespace-nowrap">Margin / Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {topModels.length > 0 ? (
                topModels.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <img
                          src={item.image || DEFAULT_PRODUCT_PLACEHOLDER}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-xs">{item.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.brandName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 dark:text-slate-300 font-bold">{item.sku}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.categoryName}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {item.unitsSold || 0} Units
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatPrice(item.revenue || 0)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        item.stock > 5
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {item.stock} Available
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {item.growthRate !== undefined ? `${item.growthRate >= 0 ? '+' : ''}${item.growthRate.toFixed(1)}% Velocity` : '0.0% Velocity'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.margin !== undefined ? `${item.margin.toFixed(1)}% Gross Margin` : '0.0% Gross Margin'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    No top-selling hardware records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Two Columns: Category / Brand Distribution & Regional Geo-Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Category & Brand Market Share (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Hardware Category Volume & Revenue Share</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribution of commercial capital across component classes</p>
          </div>

          <div className="space-y-4">
            {categories.map((c: any) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPrice(c.revenue)} ({c.percentage}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-500"
                    style={{ width: `${Math.max(5, c.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Regional GCC Traffic & Traffic Sources (6 Cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
              <span>Regional GCC Traffic & Acquisition Telemetry</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time visitor geographic distribution and channel sources</p>
          </div>

          {/* Regional Table */}
          <div className="space-y-3">
            {(traffic.geoDistribution || []).map((g: any, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{g.country}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{g.cities}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-purple-600 dark:text-purple-400">{g.percentage}% Share</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{g.sessions} Sessions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Funnel & Channel Telemetry (Bottom Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversion Funnel (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Enterprise E-Commerce Conversion Funnel</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Drop-off velocity across catalog browsing, PC builder studio, and checkout</p>
          </div>

          <div className="space-y-3.5">
            {funnel.map((step: any, idx: number) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{step.stage}</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                    {step.users?.toLocaleString()} Users ({step.percentage}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-500"
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Acquisition Channels & Device Split (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
              <span>Traffic Acquisition Channels</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Marketing attribution and device viewport telemetry</p>
          </div>

          <div className="space-y-3">
            {(traffic.trafficSources || []).map((s: any, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{s.source}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    {s.conversionRate} Conv • {s.bounceRate} Bounce
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900 dark:text-white">
                  {s.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
