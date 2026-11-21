'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import {
  ArrowLeft,
  Clock,
  RefreshCw,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface GeoNode {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  flag: string;
  hubName: string;
  lat: number;
  lng: number;
  xPct: number;
  yPct: number;
  activeVisitors: number;
  percentage: number;
  orderCount?: number;
  totalGmv?: number;
  latencyMs: number;
  intensity: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW' | 'IDLE';
  bandwidth: string;
}

interface TemporalCell {
  day: string;
  dayIndex: number;
  hour: string;
  hourNum: number;
  intensity: number;
  activeVisitors: number;
  conversionRate: number;
}

// Authoritative GCC enterprise edge node topology with zero baseline state
const GCC_HUBS_TOPOLOGY: GeoNode[] = [
  { id: 'node-dubai', city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', hubName: 'Dubai Central Hub (DXB)', lat: 25.2048, lng: 55.2708, xPct: 62.5, yPct: 44.0, activeVisitors: 0, percentage: 0, latencyMs: 4, intensity: 'IDLE', bandwidth: '100 Gbps Edge' },
  { id: 'node-abudhabi', city: 'Abu Dhabi', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', hubName: 'Abu Dhabi Innovation Hub (AUH)', lat: 24.4539, lng: 54.3773, xPct: 58.5, yPct: 50.5, activeVisitors: 0, percentage: 0, latencyMs: 6, intensity: 'IDLE', bandwidth: '100 Gbps Edge' },
  { id: 'node-riyadh', city: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', hubName: 'Riyadh Central Node (RUH)', lat: 24.7136, lng: 46.6753, xPct: 38.0, yPct: 48.0, activeVisitors: 0, percentage: 0, latencyMs: 14, intensity: 'IDLE', bandwidth: '40 Gbps Edge' },
  { id: 'node-doha', city: 'Doha', country: 'Qatar', countryCode: 'QA', flag: '🇶🇦', hubName: 'Doha Compute Node (DOH)', lat: 25.2854, lng: 51.5310, xPct: 52.0, yPct: 42.0, activeVisitors: 0, percentage: 0, latencyMs: 12, intensity: 'IDLE', bandwidth: '40 Gbps Edge' },
  { id: 'node-kuwait', city: 'Kuwait City', country: 'Kuwait', countryCode: 'KW', flag: '🇰🇼', hubName: 'Kuwait Gateway (KWI)', lat: 29.3759, lng: 47.9774, xPct: 41.5, yPct: 24.0, activeVisitors: 0, percentage: 0, latencyMs: 16, intensity: 'IDLE', bandwidth: '40 Gbps Edge' },
  { id: 'node-manama', city: 'Manama', country: 'Bahrain', countryCode: 'BH', flag: '🇧🇭', hubName: 'Bahrain Gateway (BAH)', lat: 26.2285, lng: 50.5860, xPct: 49.0, yPct: 38.0, activeVisitors: 0, percentage: 0, latencyMs: 15, intensity: 'IDLE', bandwidth: '40 Gbps Edge' },
  { id: 'node-muscat', city: 'Muscat', country: 'Oman', countryCode: 'OM', flag: '🇴🇲', hubName: 'Muscat Coastal Node (MCT)', lat: 23.5880, lng: 58.3829, xPct: 74.0, yPct: 58.0, activeVisitors: 0, percentage: 0, latencyMs: 18, intensity: 'IDLE', bandwidth: '40 Gbps Edge' },
];

export default function DetailedLiveAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [selectedNode, setSelectedNode] = useState<GeoNode | null>(GCC_HUBS_TOPOLOGY[0]);
  const [hoveredTemporalCell, setHoveredTemporalCell] = useState<TemporalCell | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  const fetchLiveData = async (isBackground = false) => {
    if (!token) return;
    try {
      if (!isBackground) setIsRefreshing(true);
      const res = await ApiClient.get('/admin/analytics/live', { token });
      setData(res);
      if (res?.geoHeatmap && res.geoHeatmap.length > 0) {
        setSelectedNode(prev => {
          if (!prev) return res.geoHeatmap[0];
          const updated = res.geoHeatmap.find((n: GeoNode) => n.id === prev.id);
          return updated || res.geoHeatmap[0];
        });
      }
    } catch (err) {
      console.error('Failed to load detailed live analytics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, [token]);

  // Live countdown and polling loop
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchLiveData(true);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, token]);

  // Live GST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Dubai',
          hour12: false,
        }) + ' GST'
      );
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  const handleExportSnapshot = () => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `nextech_live_telemetry_snapshot_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Connecting to live telemetry stream...
          </p>
        </div>
      </div>
    );
  }

  const liveUsers = data?.realTimeActiveUsers ?? 0;
  const peakUsers = data?.peakActiveUsers ?? 0;
  const peakMinute = data?.peakMinute ?? 'N/A';
  const pageViews = data?.pageViews30m ?? 0;
  const rps = data?.requestsPerSecond ?? 0;
  const activeCarts = data?.activeCarts ?? 0;
  const pendingGmv = data?.pendingGmv ?? 0;
  const avgDwell = data?.avgDwellTime ?? '0s';
  const uptimeSeconds = data?.uptimeSeconds ?? 0;

  const geoNodes: GeoNode[] = (data?.geoHeatmap && data.geoHeatmap.length > 0) ? data.geoHeatmap : GCC_HUBS_TOPOLOGY;
  const temporalCells: TemporalCell[] = data?.temporalHeatmap || [];
  const livePulse = data?.livePulseMinutes || [];
  const deviceBreakdown = data?.deviceBreakdown || [];
  const osBreakdown = data?.osBreakdown || [];
  const browserBreakdown = data?.browserBreakdown || [];
  const networkBreakdown = data?.networkBreakdown || [];
  const activeRoutes = data?.activeRoutes || [];
  const liveEvents = data?.liveEventFeed || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          {/* Breadcrumb Navigation */}
          <Link
            href="/admin/analytics"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors font-medium mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Commercial & Traffic Analytics</span>
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Live Visitors Telemetry & Regional Heatmap
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time platform concurrency, regional edge nodes, and customer session telemetry.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clock Badge */}
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTimeStr || '00:00:00 GST'}</span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              autoRefresh
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <span>{autoRefresh ? `Auto (${refreshCountdown}s)` : 'Paused'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLiveData(false)}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Export Telemetry Snapshot */}
          <button
            type="button"
            onClick={handleExportSnapshot}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Snapshot</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME TELEMETRY HUD (5 CONSISTENT EXECUTIVE STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Active Concurrent Visitors */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Concurrency</span>
            <span className={`w-2 h-2 rounded-full ${liveUsers > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
            {liveUsers} <span className="text-xs font-normal font-sans text-slate-500">Visitors</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {liveUsers > 0 ? `${liveUsers} live session${liveUsers === 1 ? '' : 's'}` : '0 active sessions'}
          </div>
        </div>

        {/* Requests Per Second (RPS) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Edge Throughput
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
            {rps} <span className="text-xs font-normal font-sans text-slate-500">req/s</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {pageViews.toLocaleString()} views • Avg Dwell {avgDwell}
          </div>
        </div>

        {/* Peak Concurrency in 1 Hour */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Peak 1-Hour Surge
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
            {peakUsers} <span className="text-xs font-normal font-sans text-slate-500">Peak Users</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Recorded {peakMinute}
          </div>
        </div>

        {/* Active Carts in Checkout */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Funnel Carts
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
            {activeCarts} <span className="text-xs font-normal font-sans text-slate-500">Orders in Flow</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            AED {pendingGmv.toLocaleString()} Potential GMV
          </div>
        </div>

        {/* Node Engine & Server Health */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Node Status
          </div>
          <div className="text-3xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            ONLINE
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Uptime: {Math.floor(uptimeSeconds / 3600)}h {Math.floor((uptimeSeconds % 3600) / 60)}m
          </div>
        </div>
      </div>

      {/* 3. VISITORS HEAT MAP SUITE — THEME-HARMONIZED REGIONAL GEOGRAPHY & 24x7 MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 COLS): GCC REGIONAL TELEMETRY MAP */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>GCC Regional Visitors Heatmap</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    EDGE TOPOLOGY
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time concurrent visitor density across UAE & GCC enterprise deployment hubs
                </p>
              </div>

              {/* Heat Map Legend */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
                  <span className="text-slate-600 dark:text-slate-300">Active Node</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-slate-500 dark:text-slate-400">Standby Node</span>
                </span>
              </div>
            </div>

            {/* THEME-MATCHING MAP CANVAS (NO BLACK RADAR BACKGROUND) */}
            <div className="mt-5 relative w-full h-[380px] bg-slate-50/90 dark:bg-slate-950/40 rounded-xl border border-slate-200/90 dark:border-slate-800/80 overflow-hidden select-none">
              {/* Subtle Concentric Topology Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-48 h-48 rounded-full border border-dashed border-slate-300 dark:border-slate-700" />
                <div className="absolute w-80 h-80 rounded-full border border-dashed border-slate-300/80 dark:border-slate-700/80" />
                <div className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-slate-300/60 dark:border-slate-700/60" />
                <div className="absolute w-full h-px bg-slate-200 dark:bg-slate-800" />
                <div className="absolute h-full w-px bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Coordinates & Region Guide */}
              <div className="absolute inset-0 p-4 pointer-events-none text-[10px] font-mono text-slate-400 dark:text-slate-500 flex flex-col justify-between">
                <div className="flex justify-between">
                  <span>LAT: 24°N - 30°N</span>
                  <span>GCC TELEMETRY GRID</span>
                  <span>LNG: 40°E - 60°E</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-600">
                  <span>ARABIAN GULF REGION</span>
                  <span>ENTERPRISE EDGE MESH</span>
                </div>
              </div>

              {/* Geographic Hot Spots & Node Markers */}
              {geoNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const hasVisitors = node.activeVisitors > 0;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ left: `${node.xPct}%`, top: `${node.yPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all ${
                      isSelected ? 'scale-110 z-30' : 'hover:scale-105'
                    }`}
                  >
                    {hasVisitors ? (
                      <>
                        <span className="absolute -inset-1.5 rounded-full bg-blue-500/30 animate-ping" />
                        <div className={`w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-900 dark:text-white shadow-xs flex items-center gap-1.5 pointer-events-none">
                          <span>{node.flag}</span>
                          <span>{node.city}</span>
                          <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">({node.activeVisitors})</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-900 shadow-2xs ${isSelected ? 'ring-2 ring-slate-400' : ''}`} />
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/95 dark:bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400 shadow-2xs flex items-center gap-1 pointer-events-none">
                          <span>{node.flag}</span>
                          <span>{node.city}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Node Inspector Dossier Card */}
            {selectedNode && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shadow-xs shrink-0">
                    {selectedNode.flag}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedNode.city}, {selectedNode.country}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          selectedNode.activeVisitors > 0
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {selectedNode.activeVisitors > 0 ? `${selectedNode.activeVisitors} Active` : 'Standby'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedNode.hubName} • {selectedNode.bandwidth}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">Active Visitors</div>
                    <div className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedNode.activeVisitors} {selectedNode.percentage > 0 ? `(${selectedNode.percentage}%)` : ''}
                    </div>
                  </div>
                  <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-4">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">Edge Ping</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      {selectedNode.latencyMs}ms
                    </div>
                  </div>
                  {(selectedNode.orderCount !== undefined && selectedNode.orderCount > 0) && (
                    <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-4">
                      <div className="text-slate-400 text-[10px] uppercase font-semibold">Orders</div>
                      <div className="font-bold text-slate-900 dark:text-white text-base">
                        {selectedNode.orderCount}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): REGIONAL VISITOR CONCENTRATION & 24x7 TEMPORAL HEATMAP */}
        <div className="lg:col-span-5 space-y-6">
          {/* Regional Traffic Breakdown List */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Regional Visitor Concentration
              </h3>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {liveUsers > 0 ? `${geoNodes.filter(n => n.activeVisitors > 0).length} of ${geoNodes.length} Active` : `${geoNodes.length} Nodes Standby`}
              </span>
            </div>

            <div className="space-y-2.5">
              {geoNodes.map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedNode?.id === node.id
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-2xs'
                      : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <span>{node.flag}</span>
                      <span>{node.city}</span>
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400 text-xs">
                      {node.activeVisitors > 0 ? (
                        <span className="font-bold text-slate-900 dark:text-white">
                          {node.activeVisitors} users ({node.percentage}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">0 users (0%)</span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        node.activeVisitors > 0 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                      style={{ width: `${node.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 24x7 TEMPORAL PLATFORM ACTIVITY HEATMAP */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  24x7 Platform Activity Matrix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Weekly activity volume by hour (GST)
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                168 HOURLY CELLS
              </span>
            </div>

            {/* Matrix Grid */}
            <div className="overflow-x-auto pb-1">
              <div className="min-w-[320px] space-y-1">
                {/* Hours Header Row */}
                <div className="grid grid-cols-12 text-[8px] font-mono text-slate-400 text-center pb-1">
                  <span>00</span>
                  <span>02</span>
                  <span>04</span>
                  <span>06</span>
                  <span>08</span>
                  <span>10</span>
                  <span>12</span>
                  <span>14</span>
                  <span>16</span>
                  <span>18</span>
                  <span>20</span>
                  <span>22</span>
                </div>

                {/* Days Rows */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => {
                  const dayCells = temporalCells.filter(c => c.dayIndex === dIdx);
                  return (
                    <div key={day} className="flex items-center gap-1.5">
                      <span className="w-7 text-[10px] font-mono text-slate-500 font-medium shrink-0">
                        {day}
                      </span>
                      <div className="flex-1 grid grid-cols-24 gap-0.5">
                        {dayCells.map(cell => {
                          const intensity = cell.intensity;
                          let bg = 'bg-slate-100 dark:bg-slate-800/50';
                          if (intensity > 75) bg = 'bg-blue-600';
                          else if (intensity > 50) bg = 'bg-blue-500';
                          else if (intensity > 25) bg = 'bg-blue-400/80';
                          else if (intensity > 0) bg = 'bg-blue-200 dark:bg-blue-900/40';

                          return (
                            <div
                              key={cell.hour}
                              onMouseEnter={() => setHoveredTemporalCell(cell)}
                              onMouseLeave={() => setHoveredTemporalCell(null)}
                              className={`h-3.5 rounded-xs transition-colors cursor-pointer hover:ring-1 hover:ring-blue-500 ${bg}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hovered Cell Detail Box */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs font-mono flex items-center justify-between">
              {hoveredTemporalCell ? (
                <>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {hoveredTemporalCell.day} at {hoveredTemporalCell.hour} GST
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {hoveredTemporalCell.activeVisitors} events • {hoveredTemporalCell.conversionRate}% conversion
                  </span>
                </>
              ) : (
                <span className="text-slate-400">
                  Hover any cell to inspect activity volume
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. REAL-TIME TRAJECTORY WAVEFORM */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Real-Time Traffic Trajectory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              30-minute rolling active concurrency and pageview volume
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Active Visitors</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Pageviews</span>
            </span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={livePulse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="liveVisitorsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="liveViewsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} vertical={false} />
              <XAxis dataKey="minute" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="pageViews"
                name="Pageviews"
                stroke="#94a3b8"
                strokeWidth={1.5}
                fill="url(#liveViewsArea)"
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                name="Active Visitors"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#liveVisitorsArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. MULTI-DIMENSIONAL AUDIENCE & INFRASTRUCTURE DIAGNOSTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Form Factors */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Device Form Factors
          </div>
          <div className="space-y-2.5">
            {deviceBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-2">No device signatures recorded</div>
            ) : (
              deviceBreakdown.map((dev: any) => (
                <div key={dev.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">{dev.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dev.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${dev.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Operating Platforms
          </div>
          <div className="space-y-2.5">
            {osBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-2">No platform signatures recorded</div>
            ) : (
              osBreakdown.map((os: any) => (
                <div key={os.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">{os.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{os.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-slate-700 dark:bg-slate-400 rounded-full" style={{ width: `${os.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Browser Engines */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Client Browsers
          </div>
          <div className="space-y-2.5">
            {browserBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-2">No browser signatures recorded</div>
            ) : (
              browserBreakdown.map((br: any) => (
                <div key={br.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">{br.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{br.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${br.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Network & ISP Carriers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            Connected Network IPs
          </div>
          <div className="space-y-2.5">
            {networkBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-2">Localhost Loopback</div>
            ) : (
              networkBreakdown.map((net: any) => (
                <div key={net.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{net.name}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{net.latency}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${net.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. ACTIVE ROUTE VELOCITY & LIVE STREAMING EVENT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ACTIVE ROUTES TABLE (7 COLS) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Active Routes & Viewers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Current platform paths actively engaged
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              {activeRoutes.length} Monitored
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[550px] text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-mono font-semibold text-slate-400">
                  <th className="py-2.5 px-3">Path & Title</th>
                  <th className="py-2.5 px-3 text-center">Active Users</th>
                  <th className="py-2.5 px-3 text-center">Hits</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                {activeRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-mono">
                      No active routes monitored yet
                    </td>
                  </tr>
                ) : (
                  activeRoutes.map((route: any) => (
                    <tr key={route.route} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[280px]">
                          {route.title}
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                          <span>{route.route}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                          {route.activeUsers}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                        {route.totalHits ?? route.activeUsers}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {route.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LIVE EVENT STREAM (5 COLS) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Event Stream</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time user operations and audit events
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              AUDIT LOGS
            </span>
          </div>

          <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {liveEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                No live events recorded yet
              </div>
            ) : (
              liveEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {evt.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{evt.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    {evt.detail}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                    {evt.location}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
