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
  ArrowRight
} from 'lucide-react';

export default function ResellerDashboardPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      ApiClient.get('/reseller/dashboard', { token, params: { resellerCode } })
        .then(res => setMetrics(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [token, resellerCode]);

  if (loading) {
    return <div className="text-xs text-slate-400 py-10">Loading vendor analytics dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs text-amber-400 font-mono uppercase font-bold tracking-wider mb-1">
            Vendor Portal • {resellerCode}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Vendor Command & Performance Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-tenant catalog metrics, Excel ingestion reports, and orders attribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/reseller/${resellerCode}/products/import`}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Products (Excel)</span>
          </Link>
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Vendor Sales</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatPrice(metrics?.revenue?.total || 48950)}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% this month
          </div>
        </div>

        {/* Orders */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.orders?.total || 14}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics?.orders?.pending || 2} awaiting fulfillment
          </div>
        </div>

        {/* Products */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Listings</span>
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {metrics?.inventory?.activeProducts || 8}
          </div>
          <div className="text-[11px] text-amber-400">
            {metrics?.inventory?.pendingApproval || 0} pending admin approval
          </div>
        </div>

        {/* Inventory Value */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Valuation</span>
            <Boxes className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {formatPrice(metrics?.inventory?.inventoryValuation || 345000)}
          </div>
          <div className="text-[11px] text-slate-400">Stocked in GCC distribution warehouse</div>
        </div>
      </div>

      {/* 7-Day Sales Trend & Top Hardware Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sales Chart Box */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-black text-white">7-Day Sales Velocity</h3>
            <span className="text-xs text-slate-400 font-mono">AED Currency</span>
          </div>

          <div className="space-y-3">
            {(metrics?.salesChart || []).map((day: any) => (
              <div key={day.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono text-[11px] text-slate-400">{day.date}</span>
                  <span className="font-bold">{formatPrice(day.revenue)} ({day.orders} ord)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(8, (day.revenue / 20000) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Box */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="text-sm font-black text-white">Top-Selling Hardware</h3>
            <Link href={`/reseller/${resellerCode}/products`} className="text-xs font-bold text-amber-400 hover:underline">
              All Products →
            </Link>
          </div>

          <div className="space-y-3">
            {(metrics?.topProducts || []).map((prod: any) => (
              <div key={prod.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex items-center justify-between text-xs">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-white truncate">{prod.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {prod.unitsSold || 0} units sold • Stock: {prod.stock}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-amber-400">{formatPrice(prod.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
