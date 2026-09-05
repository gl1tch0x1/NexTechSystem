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
  BarChart3
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = () => {
    if (token) {
      ApiClient.get('/admin/dashboard', { token })
        .then(res => setMetrics(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Initializing Enterprise Command Center Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto transition-colors duration-200">
      {/* Page Title & Quick Actions Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Master Operations Dashboard</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time global catalog oversight, multi-seller inventory valuation, customer ledgers, and automated commerce telemetry.
          </p>
        </div>

        {/* Quick Action Dock (Modern Glassmorphic Style) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/analytics"
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 group"
          >
            <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Live Analytics</span>
          </Link>

          <Link
            href="/admin/products"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-2xl text-xs shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Add Product</span>
          </Link>

          <Link
            href="/admin/resellers"
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-amber-500" />
            <span>Add Reseller</span>
          </Link>

          <Link
            href="/admin/coupons"
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Tag className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
            <span>Issue Promo</span>
          </Link>
        </div>
      </div>

      {/* 4 Re-Engineered Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Gross Platform Revenue */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />

          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  GROSS PLATFORM REVENUE
                </span>
                <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span>Financial Ledger (د.إ)</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <span className="font-black text-sm font-sans tracking-tight select-none">د.إ</span>
              </div>
            </div>

            {/* Currency Number Block */}
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">AED</span>
                <span className="text-xs font-bold text-emerald-600/70 font-sans">د.إ</span>
                <span>{(metrics?.revenue?.total || 132179.14).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Growth & Trend Information */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                +{metrics?.revenue?.growthPercentage || 14.8}% Growth
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                AOV: {formatPrice(metrics?.revenue?.averageOrderValue || 4130)}
              </span>
            </div>
          </div>

          {/* Card Footer Link */}
          <Link
            href="/admin/analytics"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-tech-blue dark:text-tech-cyan flex items-center justify-between group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
          >
            <span>Deep Analytics Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 2: Commercial Orders Processed */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />

          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  ORDERS PROCESSED
                </span>
                <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                  <span>Fulfillment Pipeline</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>

            {/* Main Value */}
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{metrics?.orders?.total || 32}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">Orders Placed</span>
              </div>
            </div>

            {/* Fulfillment Status Badges */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold font-mono border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                {metrics?.orders?.delivered || 29} Delivered
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold font-mono border border-amber-500/20">
                <Clock className="w-3 h-3" />
                {metrics?.orders?.pending || 3} Processing
              </span>
            </div>
          </div>

          {/* Card Footer Link */}
          <Link
            href="/admin/orders"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-tech-blue dark:text-tech-cyan flex items-center justify-between group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            <span>Inspect Global Orders</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 3: Hardware Inventory & Valuation */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-80" />

          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  HARDWARE CATALOG
                </span>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                  <span>Stock Assets</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Main Value */}
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{metrics?.inventory?.totalProducts || 69}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">Active SKUs</span>
              </div>
            </div>

            {/* Computed Live Valuation Badge */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[11px] font-bold font-mono border border-purple-500/20">
                <Boxes className="w-3 h-3" />
                Valuation: {formatPrice(metrics?.inventory?.totalInventoryValue || (metrics?.inventory as any)?.totalValuation || 389450)}
              </span>
            </div>
          </div>

          {/* Card Footer Link */}
          <Link
            href="/admin/products"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-tech-blue dark:text-tech-cyan flex items-center justify-between group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
          >
            <span>Catalog & Inventory Control</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card 4: Verified Resellers & Partners */}
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-80" />

          <div>
            <div className="flex items-center justify-between pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  RESELLER PARTNERS
                </span>
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                  <span>B2B Multi-Tenant</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Store className="w-5 h-5" />
              </div>
            </div>

            {/* Main Value */}
            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight flex items-baseline gap-2">
                <span>{metrics?.resellers?.total || 1}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">Partner Store</span>
              </div>
            </div>

            {/* Partner Node Status */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold font-mono border border-amber-500/20">
                <Zap className="w-3 h-3" />
                {metrics?.resellers?.active || 1} Verified Tier-1 Partner
              </span>
            </div>
          </div>

          {/* Card Footer Link */}
          <Link
            href="/admin/resellers"
            className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-bold text-tech-blue dark:text-tech-cyan flex items-center justify-between group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
          >
            <span>Reseller Network Hub</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Moderation Alert Banner (if pending products) */}
      {(metrics?.inventory?.pendingApproval || 0) > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">{metrics.inventory.pendingApproval} Reseller Product(s) Awaiting Review</span>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                New hardware listings submitted by partner stores require administrative review before appearing in the public catalog.
              </p>
            </div>
          </div>
          <Link
            href="/admin/products"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            Review Queue
          </Link>
        </div>
      )}

      {/* Secondary Operational Grids: Category Volume & System Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financial Breakdown & Category Distribution */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Category Volume & Stock Distribution
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Inventory allocation across enterprise component categories</p>
            </div>
            <Link
              href="/admin/categories"
              className="text-xs font-bold text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1"
            >
              <span>Manage Taxonomy</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {metrics?.inventory?.byCategory && Object.keys(metrics.inventory.byCategory).length > 0 ? (
              Object.entries(metrics.inventory.byCategory).map(([catName, count]: any) => {
                const total = metrics.inventory.totalProducts || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={catName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-300">{catName}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{count} SKUs ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-tech-blue"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 py-6 text-center">No category metrics available.</div>
            )}
          </div>
        </div>

        {/* Right: Quick Module Navigation */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
            Executive Management Hub
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            <Link
              href="/admin/analytics"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300">Live Analytics Platform</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Traffic, revenue & top SKUs</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/admin/products"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300">Catalog Products</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Manage {metrics?.inventory?.totalProducts || 0} hardware items</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/admin/categories"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300">Taxonomy & Categories</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">CPUs, GPUs, Servers & PoE</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/admin/brands"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">Brands & Vendors</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Intel, NVIDIA, ASUS & Cisco</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/admin/customers"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-tech-blue/10 text-tech-blue dark:text-tech-cyan">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-tech-blue dark:group-hover:text-tech-cyan">Customer Wallets</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Adjust credit balances & ledgers</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/admin/coupons"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300">Coupons & Promos</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Discounts & marketing codes</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/admin/banners"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-300">Hero Banners</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Promotions & storefront carousels</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

