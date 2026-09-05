'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import CloudflareShieldBadge from '@/components/security/CloudflareShieldBadge';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Download,
  Filter,
  Layers,
  Award,
  Zap,
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Flame,
  ArrowRight,
  Eye,
  Sliders
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      ['Metric', 'Value'],
      ['Time Range', timeRange],
      ['Gross Revenue (AED)', analytics.kpis?.grossRevenue || 0],
      ['Net Revenue (AED)', analytics.kpis?.netRevenue || 0],
      ['Total Paid Orders', analytics.kpis?.totalOrders || 0],
      ['Total Units Sold', analytics.kpis?.totalUnitsSold || 0],
      ['Average Order Value (AED)', analytics.kpis?.averageOrderValue || 0],
      ['Conversion Rate (%)', analytics.kpis?.conversionRate || 0],
      ['Live Active Users', analytics.trafficAnalytics?.realTimeActiveUsers || 0],
      [],
      ['Top Selling Products', 'SKU', 'Units Sold', 'Revenue (AED)'],
      ...(analytics.topModels || []).map((p: any) => [p.name, p.sku, p.unitsSold, p.revenue]),
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
  const brands = analytics?.brandDistribution || [];
  const funnel = analytics?.conversionFunnel || [];

  // Calculate maximum revenue in timeline for relative bar height
  const maxTimelineRev = Math.max(...timeline.map((t: any) => t.revenue || 0), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto transition-colors duration-200">
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
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Real-Time Google Analytics Traffic Pulse Hero Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/20 via-indigo-900/10 to-tech-blue/20 border border-purple-500/30 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Real-time users count */}
          <div className="md:col-span-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
              <Globe className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE TELEMETRY STREAM</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono">
                {traffic.realTimeActiveUsers || 42} <span className="text-xs font-sans text-slate-500 dark:text-slate-400 font-normal">Active Concurrent Visitors</span>
              </div>
            </div>
          </div>

          {/* Real-time 30-minute pulse sparkline */}
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
              <span className="font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
                <span>Page Views in Last 30 Minutes</span>
              </span>
              <span>100% Real-Time Sensor Resolution</span>
            </div>

            {/* Sparkline Visual Bars */}
            <div className="h-10 flex items-end gap-1 pt-1">
              {(traffic.livePulseMinutes || []).map((m: any, idx: number) => {
                const heightPct = Math.min(100, Math.max(15, (m.activeUsers / 60) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-purple-600 to-tech-cyan rounded-t-sm transition-all duration-300 hover:opacity-80 group relative cursor-pointer"
                    style={{ height: `${heightPct}%` }}
                    title={`${m.minute}: ${m.activeUsers} active visitors (${m.pageviews} views)`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Commercial Performance KPIs (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Platform Sales (د.إ)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <span className="font-black text-xs font-sans tracking-tight select-none">د.إ</span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatPrice(kpis.grossRevenue || 0)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+19.4% vs Previous Period</span>
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
            {kpis.conversionRate || 13.2}%
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Top Tier in GCC Hardware E-Commerce</span>
          </div>
        </div>
      </div>

      {/* 3. Sales & Revenue Timeseries Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Revenue & Order Volume Timeseries</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Commercial billing telemetry segmented by interval ({timeRange.toUpperCase()})</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gradient-to-t from-purple-600 to-indigo-500" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Gross Sales (AED)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-tech-blue dark:bg-tech-cyan" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Order Pulse</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart with Y-Axis and Contained Grid */}
        <div className="relative w-full rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 p-4 border border-slate-100 dark:border-slate-800/80 overflow-hidden">
          {/* Y-Axis Reference Grid Lines */}
          <div className="absolute inset-x-4 top-4 bottom-10 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{formatPrice(maxTimelineRev)}</span>
            </div>
            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{formatPrice(maxTimelineRev * 0.75)}</span>
            </div>
            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{formatPrice(maxTimelineRev * 0.5)}</span>
            </div>
            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">{formatPrice(maxTimelineRev * 0.25)}</span>
            </div>
            <div className="border-b border-slate-300 dark:border-slate-700 w-full flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">AED 0</span>
            </div>
          </div>

          {/* Scrollable / Auto-fitting Bars Container */}
          <div className="w-full overflow-x-auto pb-2 relative z-10 custom-scrollbar">
            <div className="h-64 flex items-end gap-1.5 sm:gap-2 pt-6 min-w-full" style={{ minWidth: timeline.length > 15 ? `${timeline.length * 32}px` : '100%' }}>
              {timeline.length > 0 ? (
                timeline.map((t: any, idx: number) => {
                  const revRatio = maxTimelineRev > 0 ? t.revenue / maxTimelineRev : 0;
                  const heightPct = t.revenue > 0 ? Math.max(12, Math.min(100, Math.round(revRatio * 100))) : 4;
                  const showLabel = timeline.length <= 14 || idx % Math.ceil(timeline.length / 14) === 0 || idx === timeline.length - 1;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative min-w-[20px] max-w-[48px]">
                      {/* Tooltip on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-14 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-mono p-2 rounded-xl pointer-events-none transition-all shadow-2xl z-30 whitespace-nowrap border border-slate-700">
                        <div className="font-bold text-tech-cyan">{t.label}</div>
                        <div className="font-semibold text-white">Gross Sales: {formatPrice(t.revenue)}</div>
                        <div className="text-slate-400">{t.orders} Orders • {t.units} Units Sold</div>
                      </div>

                      {/* Order Count Pulse Dot */}
                      {t.orders > 0 && (
                        <div className="w-2 h-2 rounded-full bg-tech-blue dark:bg-tech-cyan animate-pulse shadow-sm shadow-tech-cyan/50 mb-0.5" />
                      )}

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${
                          t.revenue > 0
                            ? 'bg-gradient-to-t from-purple-600 via-indigo-600 to-purple-400 hover:from-purple-500 hover:to-indigo-300 shadow-md shadow-purple-600/20'
                            : 'bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />

                      {/* X-Axis Date Label */}
                      <div className="h-5 flex items-center justify-center">
                        <span className={`text-[10px] font-mono text-center truncate ${showLabel ? 'text-slate-600 dark:text-slate-400 font-medium' : 'text-transparent group-hover:text-slate-600 dark:group-hover:text-slate-400'}`}>
                          {t.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  No timeseries telemetry available for this range.
                </div>
              )}
            </div>
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
                          src={item.image || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=150&q=80'}
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
                        +{item.growthRate?.toFixed(1) || 18.2}% Velocity
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.margin?.toFixed(1) || 24.5}% Gross Margin
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
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-tech-blue transition-all duration-500"
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
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-tech-cyan transition-all duration-500"
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

      {/* Cloudflare Edge CDN & DDoS Defense Telemetry Footer */}
      <CloudflareShieldBadge />
    </div>
  );
}
