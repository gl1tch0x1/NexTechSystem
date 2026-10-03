'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import {
  DollarSign,
  Package,
  ShoppingBag,
  FileSpreadsheet,
  Boxes,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BarChart3
} from 'lucide-react';

export default function ResellerDashboardPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchResellerMetrics = async () => {
    if (!token) return;
    try {
      setIsRefreshing(true);
      const res = await ApiClient.get('/reseller/dashboard', {
        token,
        params: { resellerCode },
      });
      setMetrics(res);
    } catch (err) {
      console.error('Failed to load vendor analytics dashboard:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResellerMetrics();
  }, [token, resellerCode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading vendor performance telemetry...</p>
        </div>
      </div>
    );
  }

  const revenueTotal = metrics?.revenue?.total ?? 0;
  const revenueWeek = metrics?.revenue?.thisWeek ?? 0;
  const ordersTotal = metrics?.orders?.total ?? 0;
  const ordersPending = metrics?.orders?.pending ?? 0;
  const ordersDelivered = metrics?.orders?.delivered ?? 0;
  const activeProducts = metrics?.inventory?.activeProducts ?? 0;
  const pendingApproval = metrics?.inventory?.pendingApproval ?? 0;
  const lowStockCount = metrics?.inventory?.lowStock ?? 0;
  const outOfStockCount = metrics?.inventory?.outOfStock ?? 0;
  const inventoryValuation = metrics?.inventory?.inventoryValuation ?? 0;
  const salesChart = metrics?.salesChart || [];
  const topProducts = metrics?.topProducts || [];

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Header with White Background Aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Authorized Vendor Subdomain • {resellerCode.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Vendor Command & Performance Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time catalog metrics, inventory asset capitalization, and order attributions across the UAE.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchResellerMetrics}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
            title="Refresh vendor metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Sync Telemetry'}</span>
          </button>

          <Link
            href={`/reseller/${resellerCode}/products?action=new`}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product SKU</span>
          </Link>
        </div>
      </div>

      {/* Vendor Quick Actions Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          href={`/reseller/${resellerCode}/products?action=new`}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-3.5 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition-colors">Add Product SKU</div>
            <div className="text-[11px] text-slate-500 font-medium">New listing submission</div>
          </div>
        </Link>

        <Link
          href={`/reseller/${resellerCode}/products/import`}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-center gap-3.5 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">Excel Ingestion</div>
            <div className="text-[11px] text-slate-500 font-medium">Bulk catalog upload</div>
          </div>
        </Link>

        <Link
          href={`/reseller/${resellerCode}/inventory`}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-center gap-3.5 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Boxes className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition-colors">Warehousing</div>
            <div className="text-[11px] text-slate-500 font-medium">Stock & safety buffers</div>
          </div>
        </Link>

        <Link
          href={`/reseller/${resellerCode}/orders`}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex items-center gap-3.5 group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-900 group-hover:text-purple-700 transition-colors">Sales Dispatch</div>
            <div className="text-[11px] text-slate-500 font-medium">Order shipments</div>
          </div>
        </Link>
      </div>

      {/* 4 Main KPI Cards with Crisp White Background */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Gross Vendor Sales</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {formatPrice(revenueTotal)}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>This week: {formatPrice(revenueWeek)}</span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Live Ledger
            </span>
          </div>
        </div>

        {/* Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Fulfillment Orders</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {ordersTotal}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-bold">{ordersPending} Awaiting Dispatch</span>
            <span className="text-slate-500 font-medium">{ordersDelivered} Delivered</span>
          </div>
        </div>

        {/* Products */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Catalog SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {activeProducts}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Published & Live</span>
            {pendingApproval > 0 ? (
              <span className="text-amber-800 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                {pendingApproval} Pending Review
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                All Approved
              </span>
            )}
          </div>
        </div>

        {/* Inventory Value */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Inventory Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {formatPrice(inventoryValuation)}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Capitalized Hardware</span>
            {outOfStockCount > 0 ? (
              <span className="text-rose-700 font-bold">{outOfStockCount} OOS</span>
            ) : (
              <span className="text-emerald-700 font-bold">100% In Stock</span>
            )}
          </div>
        </div>
      </div>

      {/* Stock Health & Approval Pipeline Banner */}
      {(pendingApproval > 0 || lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                Vendor Operations Notice
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                {pendingApproval > 0 && `${pendingApproval} newly submitted SKU(s) are awaiting Admin review. `}
                {lowStockCount > 0 && `${lowStockCount} hardware line(s) have reached safety stock reorder thresholds.`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/reseller/${resellerCode}/products`}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-slate-800 text-[11px] font-bold hover:bg-amber-100/50 transition-colors shadow-xs"
            >
              Review Listings
            </Link>
            <Link
              href={`/reseller/${resellerCode}/inventory`}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black hover:bg-amber-400 transition-colors shadow-xs"
            >
              Update Stock
            </Link>
          </div>
        </div>
      )}

      {/* 7-Day Sales Trend & Top Hardware Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sales Chart Box */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span>7-Day Sales Velocity & Daily Volume</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Gross revenue attributed to this vendor account</p>
            </div>
            <span className="text-[11px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded-md">
              AED Currency
            </span>
          </div>

          <div className="space-y-3.5">
            {salesChart.length > 0 ? (
              salesChart.map((day: any) => {
                const maxRev = Math.max(1, ...salesChart.map((d: any) => d.revenue));
                const pct = Math.round((day.revenue / maxRev) * 100);
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-mono text-[11px] text-slate-500 font-bold">{day.date}</span>
                      <span className="font-black font-mono text-slate-900">
                        {formatPrice(day.revenue)} <span className="text-[10px] text-slate-400 font-normal">({day.orders} ord)</span>
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(day.revenue > 0 ? 8 : 2, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 py-10 text-center font-mono">
                No recent transaction history recorded for this period.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Automated settlement cycles every 15 days</span>
            <Link href={`/reseller/${resellerCode}/analytics`} className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1">
              <span>View Deep Telemetry</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Top Hardware SKUs */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span>Top-Selling Hardware SKUs</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Ranked by unit movement & revenue</p>
            </div>
            <Link
              href={`/reseller/${resellerCode}/products`}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors"
            >
              <span>All SKUs</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {topProducts.length > 0 ? (
              topProducts.map((prod: any) => (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-bold text-slate-900 truncate">{prod.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{prod.unitsSold || 0} units sold</span>
                      <span>•</span>
                      <span className={prod.stock <= 3 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-medium'}>
                        Stock: {prod.stock}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 font-mono text-sm">{formatPrice(prod.price)}</div>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">ACTIVE</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-10 text-center font-mono">
                No product movement recorded yet. Add more hardware SKUs to accelerate sales.
              </div>
            )}
          </div>

          <Link
            href={`/reseller/${resellerCode}/products?action=new`}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-amber-500 text-slate-600 hover:text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>List another hardware model</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
