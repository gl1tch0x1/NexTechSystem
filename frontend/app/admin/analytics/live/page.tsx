'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import {
  Globe,
  Activity,
  Flame,
  Zap,
  TrendingUp,
  Clock,
  RefreshCw,
  Download,
  ArrowLeft,
  MapPin,
  Monitor,
  Server,
  ShoppingBag,
  ExternalLink,
  Compass,
  CheckCircle2,
  FileText,
  Eye,
  Radio
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
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
  latencyMs: number;
  intensity: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
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

export default function DetailedLiveAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [selectedNode, setSelectedNode] = useState<GeoNode | null>(null);
  const [hoveredTemporalCell, setHoveredTemporalCell] = useState<TemporalCell | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  const fetchLiveData = async (isBackground = false) => {
    if (!token) return;
    try {
      if (!isBackground) setIsRefreshing(true);
      const res = await ApiClient.get('/admin/analytics/live', { token });
      setData(res);
      if (res?.geoHeatmap && res.geoHeatmap.length > 0 && !selectedNode) {
        setSelectedNode(res.geoHeatmap[0]);
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

  // Live Clock updater (GST Time with seconds)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' GST'
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh timer every 10 seconds
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
      <div className="flex items-center justify-center min-h-[75vh]">
        <div className="text-center space-y-4">
          <div className="relative flex items-center justify-center mx-auto w-16 h-16">
            <span className="absolute w-16 h-16 rounded-full bg-cyan-400/20 animate-ping" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
              INITIALIZING LIVE TELEMETRY ENGINE
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              Synchronizing multi-sensor visitor streams & regional heat map...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const liveUsers = data?.realTimeActiveUsers ?? 0;
  const peakUsers = data?.peakActiveUsers ?? 0;
  const peakMinute = data?.peakMinute ?? 'Just now';
  const pageViews = data?.pageViews30m ?? 0;
  const rps = data?.requestsPerSecond ?? 0;
  const activeCarts = data?.activeCarts ?? 0;
  const pendingGmv = data?.pendingGmv ?? 0;
  const avgDwell = data?.avgDwellTime ?? '0s';
  const velocityTrend = data?.velocityTrendPct ?? 0;
  const uptimeSeconds = data?.uptimeSeconds ?? 0;

  const geoNodes: GeoNode[] = data?.geoHeatmap || [];
  const temporalCells: TemporalCell[] = data?.temporalHeatmap || [];
  const livePulse = data?.livePulseMinutes || [];
  const deviceBreakdown = data?.deviceBreakdown || [];
  const osBreakdown = data?.osBreakdown || [];
  const browserBreakdown = data?.browserBreakdown || [];
  const networkBreakdown = data?.networkBreakdown || [];
  const activeRoutes = data?.activeRoutes || [];
  const liveEvents = data?.liveEventFeed || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-fadeIn">
      {/* 1. TOP EXECUTIVE HEADER HUD */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
            <Link
              href="/admin/analytics"
              className="hover:text-blue-600 dark:hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Analytics Overview</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-bold">
              Real-Time Telemetry & Heatmap
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Live Visitors Telemetry & Geographic Heatmap
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>ONLINE STREAM</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-sensor real-time traffic pulse, GCC regional latency nodes, 24x7 density matrix, and active customer route telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Sensor Readout */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Clock Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>{currentTimeStr || '00:00:00 GST'}</span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              autoRefresh
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                autoRefresh && isRefreshing ? 'animate-spin' : ''
              }`}
            />
            <span>
              {autoRefresh ? `Auto-Sync (${refreshCountdown}s)` : 'Sync Paused'}
            </span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLiveData(false)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Refresh Sensor Telemetry"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Export Telemetry Snapshot */}
          <button
            type="button"
            onClick={handleExportSnapshot}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-600/25 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Snapshot</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME TELEMETRY HUD (5 EXECUTIVE STAT CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Concurrent Visitors */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white relative overflow-hidden shadow-xl shadow-slate-950/20 group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Concurrency</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-1.5">
            <span>{liveUsers}</span>
            <span className="text-xs text-slate-400 font-normal font-sans">Visitors</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>{velocityTrend >= 0 ? `+${velocityTrend}%` : `${velocityTrend}%`} Concurrency Velocity</span>
          </div>
        </div>

        {/* Requests Per Second (RPS) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Edge Throughput</span>
            <Activity className="w-4 h-4 text-tech-blue dark:text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {rps} <span className="text-xs font-normal font-sans text-slate-500">req/s</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {pageViews.toLocaleString()} views • Avg Dwell {avgDwell}
          </div>
        </div>

        {/* Peak Concurrency in 1 Hour */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Peak 1-Hour Surge</span>
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {peakUsers} <span className="text-xs font-normal font-sans text-slate-500">Peak Users</span>
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium">
            Recorded {peakMinute}
          </div>
        </div>

        {/* Active Carts in Checkout */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Active Funnel Carts</span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {activeCarts} <span className="text-xs font-normal font-sans text-slate-500">Orders in Flow</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
            AED {pendingGmv.toLocaleString()} Potential GMV
          </div>
        </div>

        {/* Node Engine & Server Health */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Node Sensor Engine</span>
            <Zap className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            ACTIVE <span className="text-xs font-normal font-sans text-emerald-500 font-bold">LIVE STREAM</span>
          </div>
          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-medium">
            Uptime: {Math.floor(uptimeSeconds / 3600)}h {Math.floor((uptimeSeconds % 3600) / 60)}m
          </div>
        </div>
      </div>

      {/* 3. VISITORS HEAT MAP SUITE — REGIONAL GEOGRAPHY & 24x7 TEMPORAL MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 COLS): GCC & GLOBAL GEOGRAPHIC VISITORS HEATMAP */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>GCC Regional Visitors Heatmap</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300">
                      LIVE RADAR
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Real-time concurrent visitor density across UAE & GCC enterprise deployment hubs
                  </p>
                </div>
              </div>

              {/* Heat Map Legend */}
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400">Extreme</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-600 dark:text-slate-400">High</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-600 dark:text-slate-400">Medium</span>
                </span>
              </div>
            </div>

            {/* HIGH-TECH INTERACTIVE RADAR MAP CANVAS */}
            <div className="mt-5 relative w-full h-[380px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden group select-none shadow-inner">
              {/* Radar Grid Background & Rings */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_45%,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 pointer-events-none" />
              
              {/* Concentric Radar Grid Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-48 h-48 rounded-full border border-dashed border-cyan-400" />
                <div className="absolute w-80 h-80 rounded-full border border-dashed border-cyan-400/60" />
                <div className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-cyan-400/40" />
                {/* Horizontal & Vertical Crosshairs */}
                <div className="absolute w-full h-px bg-cyan-500/30" />
                <div className="absolute h-full w-px bg-cyan-500/30" />
              </div>

              {/* Geographical Background Topology Guides (GCC / Middle East Outline representation) */}
              <div className="absolute inset-0 p-4 pointer-events-none text-[10px] font-mono text-slate-600 flex flex-col justify-between">
                <div className="flex justify-between">
                  <span>LAT: 24°N - 30°N</span>
                  <span>GCC TELEMETRY GRID • ZONE 4</span>
                  <span>LNG: 40°E - 60°E</span>
                </div>
                <div className="flex justify-between text-slate-700 text-[9px]">
                  <span>ARABIAN GULF REGION</span>
                  <span>SECURE TELEMETRY LINKED</span>
                </div>
              </div>

              {geoNodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 font-mono text-xs z-20">
                  <span className="bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-700/80 shadow-lg">
                    Awaiting Regional Telemetry • No visitor nodes recorded yet
                  </span>
                </div>
              )}

              {/* Geographic Hot Spots & Pulsing Radar Beacons */}
              {geoNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isExtreme = node.intensity === 'EXTREME';
                const isHigh = node.intensity === 'HIGH';

                const ringColor = isExtreme
                  ? 'bg-rose-500/30 border-rose-400 text-rose-300'
                  : isHigh
                  ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                  : 'bg-cyan-500/30 border-cyan-400 text-cyan-300';

                const dotColor = isExtreme
                  ? 'bg-rose-500'
                  : isHigh
                  ? 'bg-amber-400'
                  : 'bg-cyan-400';

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ left: `${node.xPct}%`, top: `${node.yPct}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group/node transition-transform duration-200 ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                    }`}
                  >
                    {/* Animated Pulsing Radar Rings */}
                    <span
                      className={`absolute -inset-2.5 rounded-full animate-ping opacity-60 ${
                        isExtreme ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-cyan-400'
                      }`}
                    />
                    <span
                      className={`absolute -inset-1.5 rounded-full border border-dashed animate-spin ${
                        isExtreme ? 'border-rose-400/80' : isHigh ? 'border-amber-400/80' : 'border-cyan-400/80'
                      }`}
                      style={{ animationDuration: '6s' }}
                    />

                    {/* Central Hot Point Node */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-lg relative ${ringColor}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                    </div>

                    {/* Permanent Floating Badge for Top Hubs */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-700/80 text-[10px] font-mono shadow-md flex items-center gap-1.5 pointer-events-none">
                      <span>{node.flag}</span>
                      <span className="font-bold text-white">{node.city}</span>
                      <span
                        className={`font-black ${
                          isExtreme ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-cyan-400'
                        }`}
                      >
                        {node.activeVisitors}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Node Inspector Dossier Card */}
            {selectedNode && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xl shadow-xs shrink-0">
                    {selectedNode.flag}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {selectedNode.city}, {selectedNode.country}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                          selectedNode.intensity === 'EXTREME'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : selectedNode.intensity === 'HIGH'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300'
                        }`}
                      >
                        {selectedNode.intensity} DENSITY
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {selectedNode.hubName} • {selectedNode.bandwidth}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Visitors</div>
                    <div className="font-black text-slate-900 dark:text-white text-base">
                      {selectedNode.activeVisitors} ({selectedNode.percentage}%)
                    </div>
                  </div>
                  <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-4">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Edge Ping</div>
                    <div className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                      {selectedNode.latencyMs}ms
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): REGIONAL TELEMETRY DISTRIBUTION & 24x7 TEMPORAL HEATMAP */}
        <div className="lg:col-span-5 space-y-6">
          {/* Regional Traffic Breakdown List */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Regional Visitor Concentration
              </h3>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                {geoNodes.length} Active Nodes
              </span>
            </div>

            <div className="space-y-3">
              {geoNodes.length === 0 ? (
                <div className="p-6 text-center text-slate-400 font-mono text-xs">
                  No regional visitor nodes recorded yet
                </div>
              ) : (
                geoNodes.map(node => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedNode?.id === node.id
                        ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span>{node.flag}</span>
                        <span>{node.city}</span>
                      </span>
                      <span className="text-slate-900 dark:text-white font-black">
                        {node.activeVisitors} users ({node.percentage}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          node.intensity === 'EXTREME'
                            ? 'bg-rose-500'
                            : node.intensity === 'HIGH'
                            ? 'bg-amber-500'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${node.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 24x7 TEMPORAL VISITOR ACTIVITY HEATMAP */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>24x7 Platform Surge Heatmap</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Weekly procurement surge intensity by hour (GST)
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">
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
                      <span className="w-7 text-[10px] font-mono text-slate-500 font-bold shrink-0">
                        {day}
                      </span>
                      <div className="flex-1 grid grid-cols-24 gap-0.5">
                        {dayCells.map(cell => {
                          const intensity = cell.intensity;
                          let bg = 'bg-slate-100 dark:bg-slate-800/60';
                          if (intensity > 85) bg = 'bg-amber-400 shadow-xs shadow-amber-400/50';
                          else if (intensity > 70) bg = 'bg-cyan-500';
                          else if (intensity > 50) bg = 'bg-blue-600';
                          else if (intensity > 30) bg = 'bg-indigo-700';

                          return (
                            <div
                              key={cell.hour}
                              onMouseEnter={() => setHoveredTemporalCell(cell)}
                              onMouseLeave={() => setHoveredTemporalCell(null)}
                              className={`h-4 rounded-[3px] transition-all cursor-pointer hover:scale-125 hover:z-20 ${bg}`}
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
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex items-center justify-between">
              {hoveredTemporalCell ? (
                <>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {hoveredTemporalCell.day} at {hoveredTemporalCell.hour} GST
                  </span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                    {hoveredTemporalCell.activeVisitors} visitors • {hoveredTemporalCell.conversionRate}% conversion index
                  </span>
                </>
              ) : (
                <span className="text-slate-400">
                  Hover any temporal cell to inspect historic conversion velocity
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. REAL-TIME TRAJECTORY WAVEFORM (DUAL-SERIES RECHARTS) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                High-Resolution Real-Time Trajectory Waveform
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Concurrent active visitor counts and minute-by-minute pageview velocity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Active Visitors</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-indigo-500 ml-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Pageviews</span>
            </span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={livePulse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="liveVisitorsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="liveViewsArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
              <XAxis dataKey="minute" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '16px',
                  color: '#F8FAFC',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Area
                type="monotone"
                dataKey="pageViews"
                name="Pageviews"
                stroke="#6366F1"
                strokeWidth={2}
                fill="url(#liveViewsArea)"
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                name="Active Visitors"
                stroke="#06B6D4"
                strokeWidth={3}
                fill="url(#liveVisitorsArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. MULTI-DIMENSIONAL AUDIENCE & INFRASTRUCTURE DIAGNOSTICS (4-CARD GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Form Factors */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Device Form Factors
            </span>
            <Monitor className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <div className="space-y-2.5">
            {deviceBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-2">No device signatures recorded yet</div>
            ) : (
              deviceBreakdown.map((dev: any) => (
                <div key={dev.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">{dev.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dev.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-blue-600 dark:bg-cyan-500 rounded-full" style={{ width: `${dev.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Operating Platforms
            </span>
            <Server className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="space-y-2.5">
            {osBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-2">No platform signatures recorded yet</div>
            ) : (
              osBreakdown.map((os: any) => (
                <div key={os.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">{os.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{os.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${os.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Browser Engines */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Client Browsers
            </span>
            <Globe className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="space-y-2.5">
            {browserBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-2">No browser signatures recorded yet</div>
            ) : (
              browserBreakdown.map((br: any) => (
                <div key={br.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400">{br.name}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{br.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${br.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Network & ISP Carriers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              ISP Carriers & Edge Nodes
            </span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="space-y-2.5">
            {networkBreakdown.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono py-2">Direct Localhost / Sensor Edge</div>
            ) : (
              networkBreakdown.map((net: any) => (
                <div key={net.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{net.name}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{net.latency}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${net.percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. ACTIVE ROUTE VELOCITY & LIVE STREAMING EVENT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ACTIVE ROUTES TABLE (7 COLS) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Active Platform Routes & Live Viewers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Real-time URLs currently engaged by concurrent enterprise visitors
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
              {activeRoutes.length} Monitored Paths
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[550px] text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-mono font-bold text-slate-400">
                  <th className="py-2.5 px-3">Path & Component</th>
                  <th className="py-2.5 px-3 text-center">Active Users</th>
                  <th className="py-2.5 px-3 text-center">Telemetry Hits</th>
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
                        <div className="font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                          {route.title}
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-cyan-400 flex items-center gap-1 mt-0.5">
                          <span>{route.route}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold">
                          {route.activeUsers}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-400">
                        {route.totalHits ?? route.activeUsers} hits
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
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

        {/* LIVE STREAMING EVENT FEED (5 COLS) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Event Stream</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Streaming live user operations across store
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              REAL-TIME SENSOR
            </span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {liveEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                No live events recorded yet
              </div>
            ) : (
              liveEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 space-y-1 hover:border-blue-400 dark:hover:border-cyan-500 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {evt.type === 'CART_ADD' && <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />}
                      {evt.type === 'PC_BUILD' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                      {evt.type === 'QUOTE_REQUEST' && <FileText className="w-3.5 h-3.5 text-indigo-500" />}
                      {evt.type === 'PAGE_VIEW' && <Eye className="w-3.5 h-3.5 text-slate-400" />}
                      {evt.type === 'CHECKOUT' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                      {evt.type === 'BENCHMARK_COMPARE' && <Activity className="w-3.5 h-3.5 text-cyan-500" />}
                      <span>{evt.title}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{evt.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    {evt.detail}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-0.5">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{evt.location}</span>
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
