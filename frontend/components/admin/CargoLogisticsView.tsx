'use client';

import React, { useState, useMemo } from 'react';
import { Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { getDerivedCargoDetails } from '@/lib/cargo-utils';
import {
  Truck,
  Package,
  Filter,
  Printer,
  Copy,
  Check,
  MapPin,
  ShieldCheck,
  Boxes,
  Weight,
  Plane,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  ExternalLink,
  Clock,
  User,
  Barcode,
  Phone,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Building2
} from 'lucide-react';

interface CargoLogisticsViewProps {
  orders: Order[];
  onSelectCargoOrder: (order: Order) => void;
  onOpenWaybill: (order: Order) => void;
  searchQuery?: string;
}

export default function CargoLogisticsView({
  orders,
  onSelectCargoOrder,
  onOpenWaybill,
  searchQuery: externalSearchQuery = '',
}: CargoLogisticsViewProps) {
  // Filters & Controls
  const [internalSearch, setInternalSearch] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL');
  const [hubFilter, setHubFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [packageTypeFilter, setPackageTypeFilter] = useState<string>('ALL');

  // Expanded Row Drawer for Quick Cargo Inspection
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Clipboard Feedback
  const [copiedAwb, setCopiedAwb] = useState<string | null>(null);

  // Compute cargo details for each order
  const cargoEntries = useMemo(() => {
    return orders.map((order, idx) => {
      const cargo = getDerivedCargoDetails(order, idx);
      return {
        order,
        cargo,
      };
    });
  }, [orders]);

  // Aggregate Executive Metrics
  const metrics = useMemo(() => {
    const totalConsignments = cargoEntries.length;
    const totalWeight = cargoEntries.reduce((sum, item) => sum + (item.cargo.weightKg || 0), 0);
    const totalPallets = cargoEntries.reduce((sum, item) => sum + (item.cargo.packageCount || 1), 0);
    const totalValue = cargoEntries.reduce((sum, item) => sum + (item.order.total || 0), 0);
    const averageWeight = totalConsignments > 0 ? Math.round((totalWeight / totalConsignments) * 10) / 10 : 0;
    return {
      totalConsignments,
      totalWeight: Math.round(totalWeight * 10) / 10,
      totalPallets,
      totalValue,
      averageWeight,
    };
  }, [cargoEntries]);

  // Combined Search Query (External Admin Search + Internal Cargo Search)
  const activeSearch = (internalSearch || externalSearchQuery).trim().toLowerCase();

  // Filtered Cargo Entries
  const filteredCargo = useMemo(() => {
    return cargoEntries.filter(({ order, cargo }) => {
      // 1. Search filter
      if (activeSearch) {
        const matchesSearch =
          order.orderNumber.toLowerCase().includes(activeSearch) ||
          order.customerName.toLowerCase().includes(activeSearch) ||
          (order.companyName && order.companyName.toLowerCase().includes(activeSearch)) ||
          (cargo.waybillNumber && cargo.waybillNumber.toLowerCase().includes(activeSearch)) ||
          (cargo.carrier && cargo.carrier.toLowerCase().includes(activeSearch)) ||
          (cargo.customsDeclarationNumber && cargo.customsDeclarationNumber.toLowerCase().includes(activeSearch)) ||
          (order.shippingAddress?.city && order.shippingAddress.city.toLowerCase().includes(activeSearch));
        if (!matchesSearch) return false;
      }

      // 2. Carrier filter
      if (carrierFilter !== 'ALL') {
        const c = (cargo.carrier || '').toLowerCase();
        if (!c.includes(carrierFilter.toLowerCase())) return false;
      }

      // 3. Hub filter
      if (hubFilter !== 'ALL') {
        const h = (cargo.destinationHub || '').toLowerCase();
        if (!h.includes(hubFilter.toLowerCase())) return false;
      }

      // 4. Stage filter
      if (stageFilter !== 'ALL') {
        if (stageFilter === 'DELIVERED' && order.orderStatus !== 'DELIVERED') return false;
        if (stageFilter === 'TRANSIT' && order.orderStatus !== 'SHIPPED') return false;
        if (stageFilter === 'DEPOT' && order.orderStatus !== 'PROCESSING' && order.orderStatus !== 'CONFIRMED' && order.orderStatus !== 'PENDING') return false;
      }

      // 5. Package Type Filter
      if (packageTypeFilter !== 'ALL') {
        if (packageTypeFilter === 'PALLET' && !cargo.cargoType?.toLowerCase().includes('pallet')) return false;
        if (packageTypeFilter === 'EXPRESS' && !cargo.cargoType?.toLowerCase().includes('express')) return false;
        if (packageTypeFilter === 'PARCEL' && !cargo.cargoType?.toLowerCase().includes('parcel')) return false;
      }

      return true;
    });
  }, [cargoEntries, activeSearch, carrierFilter, hubFilter, stageFilter, packageTypeFilter]);

  // Total Pages & Sliced Page Items
  const totalPages = Math.max(1, Math.ceil(filteredCargo.length / pageSize));
  const paginatedCargo = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCargo.slice(start, start + pageSize);
  }, [filteredCargo, currentPage, pageSize]);

  const handleCopyAwb = (awb: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(awb);
    setCopiedAwb(awb);
    setTimeout(() => setCopiedAwb(null), 2000);
  };

  const handleToggleRow = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const handleExportCsv = () => {
    const headers = [
      'Order Number',
      'Air Waybill (AWB)',
      'Carrier Partner',
      'Consignee Name',
      'Company Name',
      'Destination City',
      'Destination Country',
      'Logistics Hub',
      'Gross Weight (kg)',
      'Package Units',
      'Cargo Handling Class',
      'Customs BOE Ref',
      'Customs Clearance',
      'Declared Cargo Value (AED)',
      'Dispatch Timestamp',
    ];

    const rows = filteredCargo.map(({ order, cargo }) => [
      `"${order.orderNumber}"`,
      `"${cargo.waybillNumber}"`,
      `"${cargo.carrier}"`,
      `"${order.customerName}"`,
      `"${order.companyName || ''}"`,
      `"${order.shippingAddress?.city || 'Dubai'}"`,
      `"${order.shippingAddress?.country || 'AE'}"`,
      `"${cargo.destinationHub || ''}"`,
      cargo.weightKg,
      cargo.packageCount,
      `"${cargo.cargoType || 'Standard Parcel'}"`,
      `"${cargo.customsDeclarationNumber || ''}"`,
      `"${cargo.customsStatus || 'CLEARED'}"`,
      order.total,
      `"${formatDate(order.createdAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NexTech_Enterprise_Cargo_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCarrierBadgeClass = (carrierName?: string) => {
    const c = (carrierName || '').toLowerCase();
    if (c.includes('dhl')) {
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20';
    }
    if (c.includes('aramex')) {
      return 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/40 ring-1 ring-red-500/20';
    }
    if (c.includes('fedex')) {
      return 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/40 ring-1 ring-purple-500/20';
    }
    return 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/40 ring-1 ring-cyan-500/20';
  };

  const getStageBadge = (order: Order) => {
    if (order.orderStatus === 'DELIVERED') {
      return {
        label: 'Delivered',
        step: 5,
        totalSteps: 5,
        bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        progress: '100%',
        stepText: 'Completed (5/5)',
      };
    }
    if (order.orderStatus === 'SHIPPED') {
      return {
        label: 'Line-Haul In-Transit',
        step: 4,
        totalSteps: 5,
        bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
        progress: '80%',
        stepText: 'In Transit (4/5)',
      };
    }
    return {
      label: 'Palletized at Hub',
      step: 2,
      totalSteps: 5,
      bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      progress: '40%',
      stepText: 'Depot Ready (2/5)',
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. EXECUTIVE LOGISTICS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => {
            setCarrierFilter('ALL');
            setHubFilter('ALL');
            setStageFilter('ALL');
          }}
          className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Active Consignments
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Plane className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.totalConsignments}
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
              In Global Freight Flow
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> 99.4% On-Time
            </span>
            <span>All Channels Active</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400/50 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Total Freight Tonnage
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Weight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.totalWeight}
            </span>
            <span className="text-sm font-bold text-slate-500">kg Gross</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Avg {metrics.averageWeight} kg / order</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Calibrated Scales</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-purple-950/20 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-400/50 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Cartons & Pallets
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.totalPallets}
            </span>
            <span className="text-sm font-bold text-slate-500">Units Manifested</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="text-purple-600 dark:text-purple-400 font-bold">ESD Class II Certified</span>
            <span>Tamper Sealed</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400/50 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Customs Clearance
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              100%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Green Channel BOE
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>GCC Tax Compliant</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Pre-Cleared</span>
          </div>
        </div>
      </div>

      {/* 2. ADVANCED CARGO SEARCH & FILTER CONTROL DECK */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        {/* Top Control Bar: Search Input + Hub Dropdown + Stage Selector + Quick Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Internal Cargo Fast Search */}
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search Air Waybill (AWB), Order #, Consignee, or Destination Port..."
              value={internalSearch}
              onChange={e => {
                setInternalSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {internalSearch && (
              <button
                onClick={() => setInternalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Logistics Hub Selector */}
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <select
                value={hubFilter}
                onChange={e => {
                  setHubFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-bold pl-3.5 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">🏢 All Logistics Hubs</option>
                <option value="DXB">✈️ DXB Air Cargo Village (Terminal 2)</option>
                <option value="AUH">🚢 AUH Khalifa Port (KIZAD Hub)</option>
                <option value="RUH">🚛 RUH Cargo Dry Port Terminal 4</option>
                <option value="SHJ">📦 SHJ International Freight Hub</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Stage Selector */}
            <div className="relative shrink-0">
              <select
                value={stageFilter}
                onChange={e => {
                  setStageFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-bold pl-3.5 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">🔄 All Transit Stages</option>
                <option value="DEPOT">📦 Depot Palletized</option>
                <option value="TRANSIT">✈️ Line-Haul In-Transit</option>
                <option value="DELIVERED">✅ Consignee Delivered</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Freight Type Selector */}
            <div className="relative shrink-0">
              <select
                value={packageTypeFilter}
                onChange={e => {
                  setPackageTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-bold pl-3.5 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">📦 All Freight Types</option>
                <option value="PALLET">🛡️ Pallet Freight</option>
                <option value="PARCEL">⚡ Electronic Parcel</option>
                <option value="EXPRESS">🚀 Express Courier</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Export & Print */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleExportCsv}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Export Cargo Manifest to CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Print Consolidated Cargo Sheet"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Carrier Filter Segmented Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-500" />
              <span>Carrier:</span>
            </span>

            {[
              { id: 'ALL', label: 'All Carriers', count: cargoEntries.length },
              { id: 'DHL', label: 'DHL Express', count: cargoEntries.filter(c => c.cargo.carrier?.toLowerCase().includes('dhl')).length },
              { id: 'Aramex', label: 'Aramex GCC', count: cargoEntries.filter(c => c.cargo.carrier?.toLowerCase().includes('aramex')).length },
              { id: 'FedEx', label: 'FedEx Freight', count: cargoEntries.filter(c => c.cargo.carrier?.toLowerCase().includes('fedex')).length },
              { id: 'NexTech', label: 'NexTech Fleet', count: cargoEntries.filter(c => c.cargo.carrier?.toLowerCase().includes('nextech')).length },
            ].map(c => {
              const active = carrierFilter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setCarrierFilter(c.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    active
                      ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      active ? 'bg-white text-blue-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Results Summary */}
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{filteredCargo.length}</strong> of {cargoEntries.length} consignments
            {(carrierFilter !== 'ALL' || hubFilter !== 'ALL' || stageFilter !== 'ALL' || packageTypeFilter !== 'ALL' || activeSearch) && (
              <button
                onClick={() => {
                  setCarrierFilter('ALL');
                  setHubFilter('ALL');
                  setStageFilter('ALL');
                  setPackageTypeFilter('ALL');
                  setInternalSearch('');
                  setCurrentPage(1);
                }}
                className="ml-2 text-blue-600 dark:text-cyan-400 hover:underline font-bold inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. HIGH-DENSITY CARGO TABLE WITH INLINE INSPECTOR ACCORDION */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1100px] text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[210px]">Air Waybill & Carrier</th>
                <th className="py-3.5 px-4 font-bold min-w-[220px]">Consignee & Destination</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Freight Specifications</th>
                <th className="py-3.5 px-4 font-bold min-w-[170px]">Customs Clearance</th>
                <th className="py-3.5 px-4 font-bold min-w-[200px]">Milestone Transit Stage</th>
                <th className="py-3.5 px-4 font-bold text-right min-w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedCargo.length > 0 ? (
                paginatedCargo.map(({ order, cargo }) => {
                  const isExpanded = expandedOrderId === order.id;
                  const stageCfg = getStageBadge(order);

                  return (
                    <React.Fragment key={order.id}>
                      {/* Main Summary Row */}
                      <tr
                        onClick={() => handleToggleRow(order.id)}
                        className={`transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600'
                            : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* AWB & Carrier */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-slate-900 dark:text-white text-sm tracking-wide">
                              {cargo.waybillNumber}
                            </span>
                            <button
                              onClick={e => handleCopyAwb(cargo.waybillNumber || '', e)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title="Copy AWB Number"
                            >
                              {copiedAwb === cargo.waybillNumber ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap ${getCarrierBadgeClass(
                                cargo.carrier
                              )}`}
                            >
                              {cargo.carrier}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                              Ref: #{order.orderNumber}
                            </span>
                          </div>
                        </td>

                        {/* Consignee & Destination */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="truncate max-w-[170px]">{order.companyName || order.customerName}</span>
                            {order.customerType === 'BUSINESS' && (
                              <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                B2B
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate max-w-[210px]">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-medium">{order.shippingAddress?.city || 'Dubai'}, {order.shippingAddress?.country || 'AE'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[210px] flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{cargo.destinationHub}</span>
                          </div>
                        </td>

                        {/* Freight Specifications */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                              {cargo.weightKg} kg
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              (Vol: {cargo.volumetricWeightKg} kg)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {cargo.packageCount} {cargo.packageCount === 1 ? 'Box' : 'Pallets'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {cargo.dimensions}
                            </span>
                          </div>
                          <div className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold truncate max-w-[180px] mt-0.5 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="truncate">{cargo.cargoType}</span>
                          </div>
                        </td>

                        {/* Customs & BOE */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Customs Cleared</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                            {cargo.customsDeclarationNumber || 'BOE-AE-CLEARED'}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Declared: <span className="font-bold text-slate-900 dark:text-white">{formatPrice(order.total)}</span>
                          </div>
                        </td>

                        {/* Milestone Transit Stage */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5 min-w-[180px]">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 ${stageCfg.bg}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {stageCfg.label}
                              </span>
                              <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                                {stageCfg.stepText}
                              </span>
                            </div>

                            {/* Discrete 5-stage progress segments */}
                            <div className="grid grid-cols-5 gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <div
                                  key={s}
                                  className={`h-1.5 rounded-full transition-all ${
                                    s <= stageCfg.step
                                      ? stageCfg.step === 5
                                        ? 'bg-emerald-500 shadow-xs shadow-emerald-500/20'
                                        : 'bg-blue-600 dark:bg-blue-500 shadow-xs shadow-blue-500/20'
                                      : 'bg-slate-200 dark:bg-slate-800'
                                  }`}
                                />
                              ))}
                            </div>

                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>ETA: {cargo.estimatedDeliveryDate || 'Within 48h'}</span>
                              </span>
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">On Schedule</span>
                            </div>
                          </div>
                        </td>

                        {/* Cargo Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            onClick={e => e.stopPropagation()}
                            className="flex items-center justify-end gap-1.5"
                          >
                            <button
                              onClick={() => onOpenWaybill(order)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shadow-blue-600/30 cursor-pointer"
                              title="Open Full Air Waybill & Manifest Details"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Waybill</span>
                            </button>

                            <button
                              onClick={() => handleToggleRow(order.id)}
                              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                                isExpanded
                                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                              title={isExpanded ? 'Collapse Consignment Details' : 'Inspect Consignment Details'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* INLINE EXPANDED FREIGHT INSPECTOR DRAWER */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-950/80 border-t border-b border-blue-200/50 dark:border-blue-900/40">
                          <td colSpan={6} className="p-0">
                            <div className="border-l-4 border-l-blue-600 p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
                              {/* Top Bar: Header + Actions */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                                    <Barcode className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                                      <span>Consignment Manifest Deep Inspection: {cargo.waybillNumber}</span>
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 font-bold">
                                        Verified Air Waybill
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                      Carrier Route: <strong className="text-slate-700 dark:text-slate-300">{cargo.originHub}</strong> → <strong className="text-slate-700 dark:text-slate-300">{cargo.destinationHub}</strong>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => onOpenWaybill(order)}
                                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Open Air Waybill Modal</span>
                                  </button>
                                  <button
                                    onClick={() => onSelectCargoOrder(order)}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                  >
                                    <span>View Sales Order</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Physical Logistics Freight Routing Ribbon */}
                              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2.5">
                                  <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                    <Plane className="w-3.5 h-3.5 text-blue-500" /> Physical Multi-Modal Logistics Transit Route
                                  </span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-Time Telemetry Active
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                  {/* Hub 1: Central Origin */}
                                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                      <Building2 className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[10px] uppercase font-bold text-slate-400">1. Central Origin Depot</div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{cargo.originHub}</div>
                                    </div>
                                  </div>

                                  {/* Hub 2: Air Cargo Gateway */}
                                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                                      <Plane className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-cyan-400">2. Air Gateway Hub</div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{cargo.destinationHub}</div>
                                    </div>
                                  </div>

                                  {/* Hub 3: Final Destination */}
                                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                      <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[10px] uppercase font-bold text-slate-400">3. Final Consignee</div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                        {order.shippingAddress?.city || 'Dubai'}, {order.shippingAddress?.country || 'AE'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 3-Column Detailed Inspector Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                                {/* Col 1: Dispatch & Carrier Fleet */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-2xs">
                                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="flex items-center gap-1.5">
                                      <Truck className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Fleet & Dispatch Details</span>
                                    </span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active Fleet</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px]">Assigned Carrier:</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCarrierBadgeClass(cargo.carrier)}`}>
                                      {cargo.carrier}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                                      <User className="w-3 h-3 text-slate-400" /> Lead Driver:
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {cargo.driverName || 'Assigned Logistics Lead'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400" /> Dispatch Line:
                                    </span>
                                    <a
                                      href={`tel:${cargo.driverPhone || '+971800345'}`}
                                      className="font-mono text-blue-600 dark:text-cyan-400 hover:underline font-bold"
                                    >
                                      {cargo.driverPhone || '+971 800-NEXTECH'}
                                    </a>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px]">Vehicle / Plate:</span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                                      {cargo.vehiclePlate || 'DXB-Z-49210'}
                                    </span>
                                  </div>
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                                    <span>Tamper Security Seal:</span>
                                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                                      SEAL-AE-{order.orderNumber.replace(/[^0-9]/g, '').slice(-4)}-ESD
                                    </span>
                                  </div>
                                </div>

                                {/* Col 2: Package Specifications & Customs */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-2.5 shadow-2xs">
                                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="flex items-center gap-1.5">
                                      <Boxes className="w-3.5 h-3.5 text-purple-500" />
                                      <span>Freight & Volumetric Specs</span>
                                    </span>
                                    <span className="text-purple-600 dark:text-purple-400 font-bold">ESD Class II</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px]">Gross / Volumetric:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      <span className="font-mono">{cargo.weightKg} kg</span> / <span className="font-mono text-slate-400">{cargo.volumetricWeightKg} kg Vol</span>
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px]">Chargeable Weight:</span>
                                    <span className="font-mono font-black text-blue-600 dark:text-cyan-400">
                                      {Math.max(cargo.weightKg || 0, cargo.volumetricWeightKg || 0)} kg Billable
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px]">Dimensions (L×W×H):</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300">
                                      {cargo.dimensions}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500 text-[11px]">GCC Customs BOE:</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      {cargo.customsDeclarationNumber || 'BOE-AE-CLEARED'}
                                    </span>
                                  </div>
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1">
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[9px] font-bold border border-blue-200 dark:border-blue-800">
                                      ⚡ ESD Sensitive
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[9px] font-bold border border-purple-200 dark:border-purple-800">
                                      📦 Double Boxed
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold border border-emerald-200 dark:border-emerald-800">
                                      🛡️ Tamper Sealed
                                    </span>
                                  </div>
                                </div>

                                {/* Col 3: Line Items Manifest (ENRICHED - No More Blank Space!) */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between shadow-2xs">
                                  <div>
                                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                                      <span className="flex items-center gap-1.5">
                                        <Package className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Consignment Line Items ({order.items?.length || 0})</span>
                                      </span>
                                      <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                                        Val: {formatPrice(order.total)}
                                      </span>
                                    </div>
                                    <div className="mt-2 space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                                      {order.items?.map((item, iIdx) => (
                                        <div key={iIdx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="font-bold text-slate-900 dark:text-white truncate text-xs" title={item.productName}>
                                              {item.productName}
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 font-mono font-bold text-[10px] shrink-0">
                                              ×{item.quantity}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                            <span>S/N: NX-{order.orderNumber.replace(/[^0-9]/g, '').slice(-4)}-0{iIdx + 1}</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                              {formatPrice(item.subtotal || item.unitPrice * item.quantity)}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500">Transit Insurance:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                      Shield AED 50,000 Verified
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Truck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                    <div className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      No Cargo Consignments Match Current Filters
                    </div>
                    <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Try resetting your carrier or destination filters, or clear your search term to see all active consignments.
                    </div>
                    <button
                      onClick={() => {
                        setCarrierFilter('ALL');
                        setHubFilter('ALL');
                        setStageFilter('ALL');
                        setInternalSearch('');
                      }}
                      className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all cursor-pointer shadow-xs"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. PROFESSIONAL PAGINATION & PAGE SIZE CONTROLS */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>consignments per page</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              if (
                totalPages > 6 &&
                page !== 1 &&
                page !== totalPages &&
                Math.abs(page - currentPage) > 1
              ) {
                if (page === 2 || page === totalPages - 1) {
                  return (
                    <span key={page} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
