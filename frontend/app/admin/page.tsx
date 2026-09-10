'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Boxes,
  Zap,
  Sparkles,
  Layers,
  Award,
  Tag,
  Activity,
  Plus,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  Sliders,
  AlertCircle,
  Truck,
  RotateCcw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid
} from 'recharts';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<'revenue' | 'orders'>('revenue');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMetrics = async () => {
    if (!token) return;
    try {
      setIsRefreshing(true);
      const res = await ApiClient.get('/admin/dashboard', { token });
      setMetrics(res);
    } catch (err) {
      console.error('Failed to load admin dashboard telemetry:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-tech-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-tight">
            Connecting to Database Telemetry & Computing Metrics...
          </p>
        </div>
      </div>
    );
  }

  const revenueTotal = metrics?.revenue?.total ?? 0;
  const growthPercentage = metrics?.revenue?.growthPercentage ?? 0;
  const aov = metrics?.revenue?.averageOrderValue ?? 0;
  const ordersTotal = metrics?.orders?.total ?? 0;
  const ordersDelivered = metrics?.orders?.delivered ?? 0;
  const ordersPending = (metrics?.orders?.pending ?? 0) + (metrics?.orders?.processing ?? 0);
  const totalProducts = metrics?.inventory?.totalProducts ?? 0;
  const totalValuation = metrics?.inventory?.totalInventoryValue ?? 0;
  const totalResellers = metrics?.resellers?.total ?? 0;
  const activeResellers = metrics?.resellers?.active ?? 0;
  const lowStockCount = metrics?.inventory?.lowStock ?? 0;
  const outOfStockCount = metrics?.inventory?.outOfStock ?? 0;
  const salesChartData = metrics?.salesChart || [];
  const topProducts = metrics?.topProducts || [];
  const recentOrders = metrics?.recentOrders || [];
  const byCategory = metrics?.inventory?.byCategory || {};

  return (
    <div className="space-y-8 max-w-7xl mx-auto transition-colors duration-200 pb-12">
      {/* Page Title & Quick Actions Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-tech-blue dark:text-tech-cyan uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Node.js Telemetry Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Master Operations Dashboard</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time global hardware catalog telemetry, database-backed inventory valuation, fulfillment pipeline, and automated commerce ledgers.
          </p>
        </div>

        {/* Action Dock */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchMetrics}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-tech-blue' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/analytics"
            className="px-4 py-2.5 bg-gradient-to-r from-tech-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-tech flex items-center gap-2 transition-all group"
          >
            <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Deep Analytics</span>
          </Link>

          <Link
            href="/admin/products"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-tech-cyan" />
            <span>Add Hardware SKU</span>
          </Link>

          <Link
            href="/admin/resellers"
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 transition-all"
          >
            <Store className="w-4 h-4 text-amber-500" />
            <span>Manage Resellers</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Gross Platform Revenue */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  GROSS PLATFORM REVENUE
                </span>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Database Ledger (AED)</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform font-bold font-mono">
                د.إ
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">AED</span>
                <span>{revenueTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                {growthPercentage > 0 ? `+${growthPercentage}%` : 'Stable'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                AOV: {formatPrice(aov)}
              </span>
            </div>
          </div>

          <Link
            href="/admin/analytics"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-tech-blue dark:text-tech-cyan flex items-center justify-between group-hover:text-blue-500 transition-colors"
          >
            <span>Deep Analytics Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 2: Commercial Orders Processed */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />
          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  ORDERS PROCESSED
                </span>
                <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                  <span>Fulfillment Pipeline</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{ordersTotal}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">Orders in Database</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                {ordersDelivered} Delivered
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold font-mono border border-amber-500/20">
                <Clock className="w-3 h-3" />
                {ordersPending} In Progress
              </span>
            </div>
          </div>

          <Link
            href="/admin/orders"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-tech-blue dark:text-tech-cyan flex items-center justify-between group-hover:text-blue-500 transition-colors"
          >
            <span>Inspect Global Orders</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 3: Hardware Inventory & Valuation */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-80" />
          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  HARDWARE CATALOG
                </span>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                  <span>Stock Assets</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{totalProducts}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">Active SKUs</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[11px] font-bold font-mono border border-purple-500/20">
                <Boxes className="w-3 h-3" />
                Valuation: {formatPrice(totalValuation)}
              </span>
            </div>
          </div>

          <Link
            href="/admin/products"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-tech-blue dark:text-tech-cyan flex items-center justify-between group-hover:text-purple-500 transition-colors"
          >
            <span>Catalog & Inventory Control</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 4: Verified Resellers & Partners */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-80" />
          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  RESELLER PARTNERS
                </span>
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  <span>B2B Multi-Tenant</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Store className="w-5 h-5" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{totalResellers}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">Partner Stores</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold font-mono border border-amber-500/20">
                <Zap className="w-3 h-3" />
                {activeResellers} Verified Active
              </span>
            </div>
          </div>

          <Link
            href="/admin/resellers"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-tech-blue dark:text-tech-cyan flex items-center justify-between group-hover:text-amber-500 transition-colors"
          >
            <span>Reseller Network Hub</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Hardware Stock Health Alert Widget */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hardware Stock Attention Required ({outOfStockCount + lowStockCount} SKUs)
                </h3>
                <p className="text-xs text-amber-700 dark:text-amber-300/80">
                  {outOfStockCount > 0 && `${outOfStockCount} items are completely out of stock. `}
                  {lowStockCount > 0 && `${lowStockCount} items have reached low stock threshold.`}
                </p>
              </div>
            </div>
            <Link
              href="/admin/products"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors self-start sm:self-auto shadow-sm"
            >
              Restock in Product Manager
            </Link>
          </div>

          {/* Quick SKU restock list */}
          {metrics?.inventory?.lowStockItems && metrics.inventory.lowStockItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
              {metrics.inventory.lowStockItems.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-amber-200/70 dark:border-amber-800/40 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{item.sku}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] shrink-0 ${
                    item.stock === 0
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {item.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Sales & Order Telemetry Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-tech-blue dark:text-tech-cyan" />
              <span>Live Sales & Fulfillment Volume Telemetry</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily revenue velocity and transaction throughput computed from live orders database.
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMode('revenue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartMode === 'revenue'
                  ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-tech-cyan shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Revenue (AED)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartMode === 'orders'
                  ? 'bg-white dark:bg-slate-900 text-tech-blue dark:text-tech-cyan shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Order Count
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="w-full h-72">
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'revenue' ? (
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(str) => str.slice(5)}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`AED ${Number(val).toLocaleString()}`, 'Daily Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(str) => str.slice(5)}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [val, 'Orders']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="orders" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs font-mono">
              Awaiting first transaction data stream.
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Mid Section: Category Distribution & Top Hardware SKUs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Component Category Allocation */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
                Category Volume & Allocation
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Live SKU balance across catalog component taxonomy</p>
            </div>
            <Link
              href="/admin/categories"
              className="text-xs font-bold text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {Object.keys(byCategory).length > 0 ? (
              Object.entries(byCategory).map(([catName, count]: any) => {
                const total = totalProducts || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={catName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{catName}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {count} SKUs ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-tech-blue to-tech-cyan"
                        style={{ width: `${Math.max(6, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 text-center py-8">No category taxonomy records found.</div>
            )}
          </div>
        </div>

        {/* Right: Top Performing Hardware SKUs */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Top Performing Hardware SKUs
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Ranked by revenue contribution & unit volume</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {topProducts.length > 0 ? (
              topProducts.map((p: any, idx: number) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 hover:border-tech-blue transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {formatPrice(p.price)} • {p.stock} units in stock
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {p.revenue > 0 ? formatPrice(p.revenue) : `${p.unitsSold || 0} sold`}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      {p.unitsSold || 0} units
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-8">No product sales recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Commercial Orders & Fulfillment Stream */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
              <span>Recent Commercial Transactions</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Latest client and reseller orders logged in the database ledger.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-bold">Order ID</th>
                  <th className="pb-3 font-bold">Customer / Org</th>
                  <th className="pb-3 font-bold">Items</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Fulfillment Status</th>
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-tech-blue dark:text-tech-cyan">
                      {ord.orderNumber || ord.id.slice(0, 10)}
                    </td>
                    <td className="py-3 font-medium text-slate-900 dark:text-slate-100">
                      {ord.customerName}
                    </td>
                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                      {ord.itemsCount} item(s)
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {formatPrice(ord.total)}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        ord.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : ord.orderStatus === 'CANCELLED'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDate(ord.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href="/admin/orders"
                        className="text-tech-blue dark:text-tech-cyan hover:underline font-bold text-[11px]"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 font-mono">
            No transaction records found in database. Place a test order through the storefront to populate the live ledger.
          </div>
        )}
      </div>

      {/* Executive Quick Links Module */}
      <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Administrative Modules
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/products"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tech-blue text-center group transition-all"
          >
            <Package className="w-5 h-5 mx-auto mb-1.5 text-tech-blue group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Hardware SKUs</div>
            <div className="text-[10px] text-slate-500">{totalProducts} active</div>
          </Link>

          <Link
            href="/admin/categories"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tech-blue text-center group transition-all"
          >
            <Layers className="w-5 h-5 mx-auto mb-1.5 text-blue-500 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Taxonomy</div>
            <div className="text-[10px] text-slate-500">13 categories</div>
          </Link>

          <Link
            href="/admin/brands"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tech-blue text-center group transition-all"
          >
            <Award className="w-5 h-5 mx-auto mb-1.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Vendors & Brands</div>
            <div className="text-[10px] text-slate-500">19 brands</div>
          </Link>

          <Link
            href="/admin/customers"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tech-blue text-center group transition-all"
          >
            <Users className="w-5 h-5 mx-auto mb-1.5 text-purple-500 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Clients & Wallets</div>
            <div className="text-[10px] text-slate-500">Credit ledger</div>
          </Link>

          <Link
            href="/admin/coupons"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tech-blue text-center group transition-all"
          >
            <Tag className="w-5 h-5 mx-auto mb-1.5 text-amber-500 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Coupons & Promos</div>
            <div className="text-[10px] text-slate-500">Discounts</div>
          </Link>

          <Link
            href="/admin/audit-logs"
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-tech-blue text-center group transition-all"
          >
            <Activity className="w-5 h-5 mx-auto mb-1.5 text-pink-500 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">Security Audit</div>
            <div className="text-[10px] text-slate-500">Access logs</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
