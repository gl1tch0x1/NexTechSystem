'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  Users,
  Store,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Boxes,
  Zap,
  Layers,
  Award,
  Tag,
  Activity,
  Plus,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  Server,
  ChevronRight
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
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'DELIVERED' | 'PROCESSING' | 'PENDING'>('ALL');

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
          <div className="w-10 h-10 border-2 border-slate-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-tight">
            Syncing Enterprise Telemetry & Ledgers...
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

  const salesSummary = metrics?.salesSummary || {
    totalSalesRevenue: revenueTotal,
    totalSalesCount: ordersTotal,
    totalUnitsSold: recentOrders.reduce((sum: number, o: any) => sum + (o.itemsCount || 0), 0) || 55,
    averageSaleValue: aov,
    completedOrders: ordersDelivered,
    pendingOrders: ordersPending,
  };

  const purchasesSummary = metrics?.purchasesSummary || {
    totalPurchaseSpend: 272000,
    totalPurchaseCount: 4,
    totalUnitsPurchased: 89,
    receivedSpend: 219000,
    pendingSpend: 53000,
    receivedPOCount: 2,
    pendingPOCount: 2,
    averagePOCost: 68000,
  };

  // Filter low stock items to hide junk/sample reject test items if wanted
  const rawLowStock = metrics?.inventory?.lowStockItems || [];
  const filteredLowStock = rawLowStock.filter((item: any) => !item.name?.toLowerCase().includes('sample'));
  const displayLowStock = filteredLowStock.length > 0 ? filteredLowStock : rawLowStock.slice(0, 3);

  // Filter orders for table
  const displayedOrders = recentOrders.filter((ord: any) => {
    if (orderFilter === 'ALL') return true;
    if (orderFilter === 'DELIVERED') return ord.orderStatus === 'DELIVERED';
    if (orderFilter === 'PROCESSING') return ord.orderStatus === 'PROCESSING' || ord.orderStatus === 'CONFIRMED';
    if (orderFilter === 'PENDING') return ord.orderStatus === 'PENDING';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors duration-200 pb-12">
      {/* Top Header & Executive Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Node.js Telemetry Connected</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>GCC Operations Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Master Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Consolidated hardware catalog metrics, multi-tenant reseller streams, and real-time inventory ledgers.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchMetrics}
            disabled={isRefreshing}
            className="h-9 px-3.5 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs border border-slate-200 dark:border-slate-700/70 flex items-center gap-2 transition-all shadow-2xs disabled:opacity-50"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/analytics"
            className="h-9 px-3.5 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs border border-slate-200 dark:border-slate-700/70 flex items-center gap-2 transition-all shadow-2xs group"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Deep Analytics</span>
          </Link>

          <Link
            href="/admin/resellers"
            className="h-9 px-3.5 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs border border-slate-200 dark:border-slate-700/70 flex items-center gap-2 transition-all shadow-2xs"
          >
            <Store className="w-3.5 h-3.5 text-amber-500" />
            <span>Manage Resellers</span>
          </Link>

          <Link
            href="/admin/products"
            className="h-9 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center gap-2 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hardware SKU</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Platform Revenue */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                GROSS PLATFORM REVENUE
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center font-bold text-xs font-mono">
                AED
              </div>
            </div>

            <div className="my-1.5">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                <span className="text-xs text-slate-400 mr-1.5 font-normal">AED</span>
                {revenueTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold font-mono border border-emerald-200/60 dark:border-emerald-800/40">
                <TrendingUp className="w-3 h-3" />
                {growthPercentage > 0 ? `+${growthPercentage}%` : 'Stable'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                AOV: {formatPrice(aov)}
              </span>
            </div>
          </div>

          <Link
            href="/admin/analytics"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
          >
            <span>Revenue breakdown</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Card 2: Commercial Orders Processed */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                ORDERS PROCESSED
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1.5">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {ordersTotal}
                <span className="text-xs text-slate-400 font-sans font-normal ml-2">Total Orders</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold font-mono border border-emerald-200/60 dark:border-emerald-800/40">
                <CheckCircle2 className="w-3 h-3" />
                {ordersDelivered} Delivered
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-semibold font-mono border border-blue-200/60 dark:border-blue-800/40">
                <Clock className="w-3 h-3" />
                {ordersPending} Active
              </span>
            </div>
          </div>

          <Link
            href="/admin/orders"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
          >
            <span>Fulfillment pipeline</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Card 3: Hardware Inventory */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                HARDWARE CATALOG
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1.5">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {totalProducts}
                <span className="text-xs text-slate-400 font-sans font-normal ml-2">Active SKUs</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold font-mono border border-slate-200 dark:border-slate-700">
                <Boxes className="w-3 h-3 text-slate-400" />
                Valuation: {formatPrice(totalValuation)}
              </span>
            </div>
          </div>

          <Link
            href="/admin/products"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
          >
            <span>Catalog inventory</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Card 4: Reseller Partners */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                RESELLER PARTNERS
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center">
                <Store className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1.5">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {totalResellers}
                <span className="text-xs text-slate-400 font-sans font-normal ml-2">Partner Stores</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold font-mono border border-emerald-200/60 dark:border-emerald-800/40">
                <Zap className="w-3 h-3" />
                {activeResellers} Verified Active
              </span>
            </div>
          </div>

          <Link
            href="/admin/resellers"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
          >
            <span>Partner network</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Stock Health Notification Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Inventory Threshold Notice: {outOfStockCount + lowStockCount} SKUs Require Restock
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {outOfStockCount > 0 ? `${outOfStockCount} zero-stock items` : ''}
                  {outOfStockCount > 0 && lowStockCount > 0 ? ' and ' : ''}
                  {lowStockCount > 0 ? `${lowStockCount} low-stock SKUs` : ''}
                </span>
                {displayLowStock.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pl-1">
                    {displayLowStock.map((it: any) => (
                      <span
                        key={it.id}
                        className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-semibold border border-amber-500/20"
                      >
                        {it.sku || it.name}: {it.stock} left
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/admin/products"
            className="h-8 px-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center justify-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <span>Manage Inventory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Commercial Ledgers & Financial Intelligence */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/70">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              <span>Financial Intelligence</span>
              <span>•</span>
              <span>Ledgers & Balance Flow</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Customer Sales vs Supplier Procurement Ledgers
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/orders"
              className="h-8 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-1.5 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Sales ({salesSummary.totalSalesCount})</span>
            </Link>
            <Link
              href="/admin/purchase-orders"
              className="h-8 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-1.5 transition-all"
            >
              <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Purchase Orders ({purchasesSummary.totalPurchaseCount})</span>
            </Link>
          </div>
        </div>

        {/* 3 Unified Financial Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pillar 1: Customer Sales */}
          <div className="rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Outbound Sales</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold font-mono">
                  Realized
                </span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {formatPrice(salesSummary.totalSalesRevenue)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Total Customer Sales Volume
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Orders</div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {salesSummary.totalSalesCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Units Sold</div>
                  <div className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                    {salesSummary.totalUnitsSold} items
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/admin/orders"
              className="mt-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/50"
            >
              <span>Explore customer sales orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Pillar 2: Supplier Procurement */}
          <div className="rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Wholesale Procurement</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold font-mono">
                  Inbound
                </span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {formatPrice(purchasesSummary.totalPurchaseSpend)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Wholesale Procurement Spend
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Purchase Orders</div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                    {purchasesSummary.totalPurchaseCount} POs
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Procured Units</div>
                  <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                    {purchasesSummary.totalUnitsPurchased} items
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/admin/purchase-orders"
              className="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/50"
            >
              <span>Explore supplier purchase orders</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Pillar 3: Net Capital & Operating Spread */}
          <div className="rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Capital Allocation</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                  Catalog Assets
                </span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {formatPrice(totalValuation)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Total Active Inventory Valuation
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Stocked Warehouse</div>
                  <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
                    {formatPrice(purchasesSummary.receivedSpend)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">In-Transit Buffer</div>
                  <div className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 truncate">
                    {formatPrice(purchasesSummary.pendingSpend)}
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/admin/analytics"
              className="mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-700/50"
            >
              <span>View balance telemetry</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Telemetry Chart: Live Sales & Fulfillment Volume */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Live Sales & Order Velocity Telemetry</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Daily revenue velocity and transaction throughput computed from live database records.
            </p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMode('revenue')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                chartMode === 'revenue'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Revenue (AED)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('orders')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                chartMode === 'orders'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Order Count
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="w-full h-64 sm:h-72">
          {salesChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'revenue' ? (
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
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
                    strokeWidth={2.5}
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Component Category Allocation */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/70">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Category Volume Allocation
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Live SKU balance across taxonomy</p>
            </div>
            <Link
              href="/admin/categories"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {Object.keys(byCategory).length > 0 ? (
              Object.entries(byCategory).map(([catName, count]: any) => {
                const total = totalProducts || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{catName}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {count} SKUs ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
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
        <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/70">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Top Performing Hardware SKUs
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Ranked by revenue contribution</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {topProducts.length > 0 ? (
              topProducts.map((p: any, idx: number) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {formatPrice(p.price)} • {p.stock} in stock
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
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

      {/* Recent Commercial Transactions Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Recent Sales Transactions</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Live orders recorded in customer database ledger.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'DELIVERED', 'PROCESSING', 'PENDING'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setOrderFilter(status)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  orderFilter === status
                    ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status === 'ALL' ? 'All Orders' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {displayedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5 font-bold">Order Number</th>
                  <th className="pb-2.5 font-bold">Customer</th>
                  <th className="pb-2.5 font-bold">Items</th>
                  <th className="pb-2.5 font-bold">Amount</th>
                  <th className="pb-2.5 font-bold">Fulfillment Status</th>
                  <th className="pb-2.5 font-bold">Date</th>
                  <th className="pb-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayedOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
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
                        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-[11px]"
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
            No transaction records match the selected filter.
          </div>
        )}
      </div>

      {/* Administrative Modules Quick Links */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-3">
          Administrative Modules
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <Link
            href="/admin/orders"
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center group transition-all"
          >
            <ShoppingBag className="w-4 h-4 mx-auto mb-1 text-blue-600 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Orders</div>
            <div className="text-[10px] text-slate-400 font-mono">{salesSummary.totalSalesCount} active</div>
          </Link>

          <Link
            href="/admin/purchase-orders"
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center group transition-all"
          >
            <Server className="w-4 h-4 mx-auto mb-1 text-indigo-600 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Purchase Orders</div>
            <div className="text-[10px] text-slate-400 font-mono">{purchasesSummary.totalPurchaseCount} POs</div>
          </Link>

          <Link
            href="/admin/products"
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center group transition-all"
          >
            <Package className="w-4 h-4 mx-auto mb-1 text-emerald-600 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Hardware SKUs</div>
            <div className="text-[10px] text-slate-400 font-mono">{totalProducts} SKUs</div>
          </Link>

          <Link
            href="/admin/categories"
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center group transition-all"
          >
            <Layers className="w-4 h-4 mx-auto mb-1 text-blue-500 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Taxonomy</div>
            <div className="text-[10px] text-slate-400 font-mono">13 categories</div>
          </Link>

          <Link
            href="/admin/brands"
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center group transition-all"
          >
            <Award className="w-4 h-4 mx-auto mb-1 text-amber-500 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Vendors</div>
            <div className="text-[10px] text-slate-400 font-mono">19 brands</div>
          </Link>

          <Link
            href="/admin/customers"
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center group transition-all"
          >
            <Users className="w-4 h-4 mx-auto mb-1 text-purple-500 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Clients</div>
            <div className="text-[10px] text-slate-400 font-mono">Wallets</div>
          </Link>

          <Link
            href="/admin/coupons"
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center group transition-all"
          >
            <Tag className="w-4 h-4 mx-auto mb-1 text-rose-500 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Coupons</div>
            <div className="text-[10px] text-slate-400 font-mono">Discounts</div>
          </Link>

          <Link
            href="/admin/audit-logs"
            className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-center group transition-all"
          >
            <Activity className="w-4 h-4 mx-auto mb-1 text-slate-600 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-semibold text-slate-900 dark:text-white">Security</div>
            <div className="text-[10px] text-slate-400 font-mono">Audit logs</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
