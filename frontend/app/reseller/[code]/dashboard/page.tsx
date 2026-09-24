'use client';

import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Zap,
  ArrowUpRight
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
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading vendor database telemetry...</p>
        </div>
      </div>
    );
  }

  const revenueTotal = metrics?.revenue?.total ?? 0;
  const ordersTotal = metrics?.orders?.total ?? 0;
  const ordersPending = metrics?.orders?.pending ?? 0;
  const activeProducts = metrics?.inventory?.activeProducts ?? 0;
  const pendingApproval = metrics?.inventory?.pendingApproval ?? 0;
  const inventoryValuation = metrics?.inventory?.inventoryValuation ?? 0;
  const salesChart = metrics?.salesChart || [];
  const topProducts = metrics?.topProducts || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs text-amber-400 font-mono uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Vendor Portal • {resellerCode}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Vendor Command & Performance Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-tenant catalog metrics, live order attributions, and inventory valuation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchResellerMetrics}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            title="Refresh vendor metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href={`/reseller/${resellerCode}/products/import`}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Products (Excel)</span>
          </Link>
        </div>
      </div>

      {/* 4 Main Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Vendor Sales</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatPrice(revenueTotal)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live database order ledger</span>
          </div>
        </div>

        {/* Orders */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {ordersTotal}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {ordersPending} awaiting fulfillment
          </div>
        </div>

        {/* Products */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Listings</span>
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {activeProducts}
          </div>
          <div className="text-[11px] text-amber-400 font-mono">
            {pendingApproval} pending admin review
          </div>
        </div>

        {/* Inventory Value */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Valuation</span>
            <Boxes className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {formatPrice(inventoryValuation)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Stocked vendor hardware</div>
        </div>
      </div>

      {/* 7-Day Sales Trend & Top Hardware Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sales Chart Box */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>7-Day Sales Velocity</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">AED Currency</span>
          </div>

          <div className="space-y-3">
            {salesChart.length > 0 ? (
              salesChart.map((day: any) => {
                const maxRev = Math.max(1, ...salesChart.map((d: any) => d.revenue));
                const pct = Math.round((day.revenue / maxRev) * 100);
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-mono text-[11px] text-slate-400">{day.date}</span>
                      <span className="font-bold font-mono">
                        {formatPrice(day.revenue)} ({day.orders} ord)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 py-8 text-center font-mono">
                No recent transaction history recorded.
              </div>
            )}
          </div>
        </div>

        {/* Top Products Box */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-black text-white">Top-Selling Hardware</h3>
            <Link
              href={`/reseller/${resellerCode}/products`}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {topProducts.length > 0 ? (
              topProducts.map((prod: any) => (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-white truncate">{prod.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {prod.unitsSold || 0} units sold • Stock: {prod.stock}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-amber-400 font-mono">{formatPrice(prod.price)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-8 text-center font-mono">
                No product sales records yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
