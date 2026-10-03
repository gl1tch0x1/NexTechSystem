'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import {
  Package,
  Boxes,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Warehouse,
  ChevronRight,
  ArrowRight,
  Layers,
  Settings,
  XCircle,
  Edit3
} from 'lucide-react';

const WAREHOUSE_NODES = [
  { id: 'loc_dxb_main', name: 'Dubai Logistics Hub (JAFZA)', code: 'DXB-01', city: 'Dubai', capacity: 'Primary Fulfillment Node' },
  { id: 'loc_deira_tech', name: 'Deira Technical & Assembly Center', code: 'DXB-02', city: 'Dubai', capacity: 'Rapid Dispatch & Testing' },
  { id: 'loc_auh_hub', name: 'Abu Dhabi Regional Distribution Hub', code: 'AUH-01', city: 'Abu Dhabi', capacity: 'Government & Corporate' },
  { id: 'loc_shj_depot', name: 'Sharjah Industrial Logistics Depot', code: 'SHJ-01', city: 'Sharjah', capacity: 'Bulk Hardware Depository' },
];

export default function ResellerDashboardPage() {
  const params = useParams();
  const resellerCode = (params.code as string) || 'comnet101';
  const { token } = useAuth();

  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      setIsRefreshing(true);
      const [metricsRes, productsRes] = await Promise.allSettled([
        ApiClient.get('/reseller/dashboard', {
          token,
          params: { resellerCode },
        }),
        ApiClient.get<Product[]>('/reseller/products', {
          token,
          params: { resellerCode, limit: 100 },
        }),
      ]);

      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value);
      }
      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value || []);
      }
    } catch (err) {
      console.error('Failed to load vendor catalog command center:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token, resellerCode]);

  // Derived metrics from products & backend metrics
  const activeProducts = metrics?.inventory?.activeProducts ?? products.filter(p => p.approvalStatus === 'APPROVED' && p.isActive !== false).length;
  const pendingApproval = metrics?.inventory?.pendingApproval ?? products.filter(p => p.approvalStatus === 'PENDING_APPROVAL').length;
  const totalProducts = metrics?.inventory?.totalProducts ?? products.length;
  const lowStockCount = metrics?.inventory?.lowStock ?? products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length;
  const outOfStockCount = metrics?.inventory?.outOfStock ?? products.filter(p => p.stock <= 0).length;
  const inventoryValuation = metrics?.inventory?.inventoryValuation ?? products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, { name: string; count: number; value: number }> = {};
    products.forEach(p => {
      const cat = p.categoryName || 'Enterprise Hardware';
      if (!counts[cat]) {
        counts[cat] = { name: cat, count: 0, value: 0 };
      }
      counts[cat].count += 1;
      counts[cat].value += (p.price || 0) * (p.stock || 0);
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [products]);

  // Filtered recent products
  const displayedProducts = useMemo(() => {
    let list = [...products];
    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter(p => (p.categoryName || 'Enterprise Hardware') === selectedCategoryFilter);
    }
    return list.slice(0, 8);
  }, [products, selectedCategoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Synchronizing hardware catalog & warehouse telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header with Enterprise White Aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Authorized Hardware Node • {resellerCode.toUpperCase()}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-semibold lowercase">isolated tenant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hardware Catalog & Warehousing Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-node inventory tracking, technical SKU blueprints, and Admin catalog verification pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs hover:shadow disabled:opacity-50 cursor-pointer"
            title="Refresh catalog metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span>{isRefreshing ? 'Synchronizing...' : 'Sync Telemetry'}</span>
          </button>

          <Link
            href={`/reseller/${resellerCode}/products/new`}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Hardware SKU</span>
          </Link>
        </div>
      </div>

      {/* 4 Main Enterprise KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Active SKUs */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Approved Live SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-2">
            <span>{activeProducts}</span>
            <span className="text-xs text-slate-400 font-normal font-sans">/ {totalProducts} total</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold">Catalog Live ✓</span>
            <Link href={`/reseller/${resellerCode}/products?status=APPROVED`} className="text-slate-500 hover:text-slate-800 font-medium">
              View active
            </Link>
          </div>
        </div>

        {/* Pending Review SKUs */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Pending Admin Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {pendingApproval}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-800 font-bold">QA SLA: &lt;24h</span>
            <Link href={`/reseller/${resellerCode}/products?status=PENDING_APPROVAL`} className="text-slate-500 hover:text-slate-800 font-medium">
              View queue
            </Link>
          </div>
        </div>

        {/* Capitalized Inventory Valuation */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Inventory Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {formatPrice(inventoryValuation)}
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Capitalized Hardware Asset</span>
            <span className="font-mono text-slate-700 font-bold">AED</span>
          </div>
        </div>

        {/* Stock Safety & Alert Health */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Stock Buffer Health</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight flex items-baseline gap-2">
            <span>{lowStockCount + outOfStockCount === 0 ? 'Optimal' : `${lowStockCount + outOfStockCount} Alerts`}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            {lowStockCount > 0 ? (
              <span className="text-amber-800 font-bold">{lowStockCount} Reorder Threshold</span>
            ) : outOfStockCount > 0 ? (
              <span className="text-rose-700 font-bold">{outOfStockCount} Out of Stock</span>
            ) : (
              <span className="text-emerald-700 font-bold">100% Buffer Capacity</span>
            )}
            <Link href={`/reseller/${resellerCode}/inventory`} className="text-purple-700 hover:text-purple-900 font-bold">
              Adjust Buffers
            </Link>
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
                Hardware Operational Notice
              </div>
              <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                {pendingApproval > 0 && `${pendingApproval} newly submitted hardware SKU(s) are in the Admin verification queue. `}
                {lowStockCount > 0 && `${lowStockCount} product(s) have reached safety reorder thresholds. `}
                {outOfStockCount > 0 && `${outOfStockCount} line(s) currently report 0 units on-hand.`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/reseller/${resellerCode}/products?status=PENDING_APPROVAL`}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-slate-800 text-[11px] font-bold hover:bg-amber-100/50 transition-colors shadow-xs"
            >
              Inspect Queue
            </Link>
            <Link
              href={`/reseller/${resellerCode}/inventory`}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black hover:bg-amber-400 transition-colors shadow-xs"
            >
              Rebalance Stock
            </Link>
          </div>
        </div>
      )}

      {/* Hardware Launchpad (4 Professional Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/reseller/${resellerCode}/products/new`}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-black font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
              STUDIO 2.0
            </span>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors">
              Add New Hardware SKU
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Multi-tab studio with hardware blueprints, multi-SKU variants, warehouse allocations & specs.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
            <span>Launch Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href={`/reseller/${resellerCode}/products/import`}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              XLSX
            </span>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
              Excel Bulk Ingestion
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Import hundreds of enterprise server, GPU, and networking SKUs with spreadsheet templates.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
            <span>Open Bulk Ingestion</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href={`/reseller/${resellerCode}/inventory`}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
              4 NODES
            </span>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
              Warehousing & Stock Control
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Adjust multi-hub stock quantities, bin locations, committed units, and safety stock levels.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform">
            <span>Manage Warehouses</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href={`/reseller/${resellerCode}/settings`}
          className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between group shadow-xs space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md">
              PROFILE
            </span>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors">
              Vendor Store & Compliance
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Update legal trade name, tax registration number (TRN), trade license, and regional contacts.
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-purple-700 group-hover:translate-x-0.5 transition-transform">
            <span>Vendor Configuration</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Regional Warehousing Nodes Overview */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-amber-500" />
              <span>UAE Strategic Warehousing & Multi-Node Distribution</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live facility allocations and inventory buffering for authorized vendor hardware
            </p>
          </div>
          <Link
            href={`/reseller/${resellerCode}/inventory`}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Full Stock Telemetry</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WAREHOUSE_NODES.map(node => (
            <div
              key={node.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {node.code}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ACTIVE NODE
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1">{node.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{node.city}, UAE</div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 font-medium">
                {node.capacity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Hardware SKU Approvals & Catalog Matrix */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              <span>Recent Hardware SKUs & Approval Pipeline</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Track technical review status and launch configuration studio
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories ({products.length})
            </button>
            {categoryBreakdown.slice(0, 4).map(cat => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.name)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategoryFilter === cat.name
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {displayedProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3">Hardware Product</th>
                  <th className="py-3 px-3">SKU & Barcode</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Price (AED)</th>
                  <th className="py-3 px-3 text-center">On-Hand Stock</th>
                  <th className="py-3 px-3 text-center">Admin Approval</th>
                  <th className="py-3 px-3 text-right">Studio Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProducts.map(prod => {
                  const isApproved = prod.approvalStatus === 'APPROVED';
                  const isPending = prod.approvalStatus === 'PENDING_APPROVAL';
                  const isRejected = prod.approvalStatus === 'REJECTED';
                  const img = prod.primaryImage || prod.thumbnail || prod.images?.[0] || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80';

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={img}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <div className="font-bold text-slate-900 truncate">{prod.name || prod.title}</div>
                            <div className="text-[11px] text-slate-400 font-medium truncate">{prod.brandName || 'NexTech Partner'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        <div>{prod.sku}</div>
                        {prod.barcode && <div className="text-[10px] text-slate-400">{prod.barcode}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {prod.categoryName || 'Hardware'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-sm">
                        {formatPrice(prod.price)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          prod.stock <= 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : prod.stock <= 5
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {prod.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Catalog Live</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending Review</span>
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Revision Needed</span>
                          </span>
                        ) : (
                          <span className="font-mono text-slate-500">{prod.approvalStatus || 'APPROVED'}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/reseller/${resellerCode}/products/${prod.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-200 font-bold transition-all text-xs"
                          title="Open SKU Configuration Studio"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Studio</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-sm font-black text-slate-900">No hardware product listings found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start adding your hardware SKUs using the enterprise Studio or Excel bulk upload.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href={`/reseller/${resellerCode}/products/new`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Launch SKU Studio</span>
              </Link>
              <Link
                href={`/reseller/${resellerCode}/products/import`}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                <span>Bulk Import</span>
              </Link>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {displayedProducts.length} of {products.length} hardware lines</span>
          <Link
            href={`/reseller/${resellerCode}/products`}
            className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            <span>View All Hardware SKUs & Matrix</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Hardware Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <span>Catalog Category Coverage</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Distribution of active hardware lines across classifications</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{categoryBreakdown.length} Categories</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.map(cat => (
              <div
                key={cat.name}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs">{cat.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{cat.count} hardware SKUs</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-black text-slate-800">{formatPrice(cat.value)}</div>
                  <div className="text-[10px] text-slate-400 font-sans">Valuation</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
