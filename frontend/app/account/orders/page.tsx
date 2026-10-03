'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import { CustomerPortalHeader } from '@/components/account/CustomerPortalHeader';
import {
  ShoppingBag,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  ArrowRight,
  Loader2,
  Calendar,
  X
} from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'PENDING_APPROVAL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

function CustomerOrdersContent() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    if (token) {
      setLoading(true);
      ApiClient.get<Order[]>('/orders/my', { token })
        .then(res => setOrders(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        // Status filter
        if (statusFilter !== 'ALL' && order.orderStatus !== statusFilter) {
          return false;
        }

        // Search query (Order number or item name)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesOrderNum = order.orderNumber?.toLowerCase().includes(q);
          const matchesItem = order.items?.some(it =>
            it.productName?.toLowerCase().includes(q)
          );
          if (!matchesOrderNum && !matchesItem) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'highest') {
          return (b.total || 0) - (a.total || 0);
        }
        if (sortBy === 'lowest') {
          return (a.total || 0) - (b.total || 0);
        }
        return 0;
      });
  }, [orders, statusFilter, searchQuery, sortBy]);

  // Counts by status
  const counts = useMemo(() => {
    const acc: Record<string, number> = { ALL: orders.length };
    orders.forEach(o => {
      acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1;
    });
    return acc;
  }, [orders]);

  const getStatusBadge = (status: OrderStatus | string) => {
    const map: Record<string, { bg: string; text: string; border: string; icon: any; label?: string }> = {
      PENDING_APPROVAL: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300 font-bold',
        border: 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-500/30',
        icon: Clock,
        label: 'Pending to Approve',
      },
      DELIVERED: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        icon: CheckCircle2,
      },
      SHIPPED: {
        bg: 'bg-cyan-50 dark:bg-cyan-950/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800/60',
        icon: Truck,
      },
      PROCESSING: {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/60',
        icon: Package,
      },
      PENDING: {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/60',
        icon: Clock,
      },
      CANCELLED: {
        bg: 'bg-red-50 dark:bg-red-950/40',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800/60',
        icon: AlertCircle,
      },
    };

    const config = map[status] || map.PROCESSING;
    const Icon = config.icon;
    const displayLabel = config.label || status;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{displayLabel}</span>
      </span>
    );
  };

  const renderTimeline = (status: OrderStatus | string) => {
    if (status === 'PENDING_APPROVAL') {
      return (
        <div className="py-3 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span>
              <strong>Awaiting Admin Review:</strong> Your order has been placed and hardware reserved. Status will transition to confirmed upon executive approval.
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0 self-start sm:self-center">
            Pending to Approve
          </span>
        </div>
      );
    }

    const steps = [
      { id: 'placed', label: 'Order Placed' },
      { id: 'processing', label: 'Processing' },
      { id: 'shipped', label: 'Dispatched' },
      { id: 'delivered', label: 'Delivered' },
    ];

    let currentStepIndex = 1;
    if (status === 'PENDING') currentStepIndex = 0;
    else if (status === 'PROCESSING') currentStepIndex = 1;
    else if (status === 'SHIPPED') currentStepIndex = 2;
    else if (status === 'DELIVERED') currentStepIndex = 3;
    else if (status === 'CANCELLED') currentStepIndex = -1;

    if (currentStepIndex === -1) {
      return (
        <div className="py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>This order was cancelled and refunded.</span>
        </div>
      );
    }

    return (
      <div className="w-full pt-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
          {steps.map((st, idx) => (
            <span
              key={st.id}
              className={`${idx <= currentStepIndex ? 'text-tech-blue dark:text-tech-cyan' : ''}`}
            >
              {st.label}
            </span>
          ))}
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-tech-blue to-tech-cyan transition-all duration-500 rounded-full"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Customer Portal Navigation Shell */}
      <CustomerPortalHeader totalOrdersCount={orders.length} />

      {/* Page Title & Search Controls */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Order History & Tax Invoices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time shipment tracking, itemized specs, and UAE FTA VAT-compliant electronic invoices
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="px-4 py-2 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop Hardware</span>
            </Link>
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by order number (e.g. NXT-ORD) or hardware item..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Price: High to Low</option>
                <option value="lowest">Price: Low to High</option>
              </select>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {STATUS_FILTERS.map(st => {
              const active = statusFilter === st;
              const count = counts[st] || 0;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{st === 'PENDING_APPROVAL' ? 'Pending to Approve' : st.charAt(0) + st.slice(1).toLowerCase()}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Synchronizing orders and tax invoices...</span>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-5">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="p-6 sm:p-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {/* Header row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-mono font-black text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </span>
                    {getStatusBadge(order.orderStatus)}
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Paid via {order.paymentMethod || 'Credit Card / Wire Transfer'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Order Date: {formatDate(order.createdAt)}</span>
                    <span>•</span>
                    <span>Tracking: {(order as any).trackingNumber || 'GCC-NXT-EXPRESS'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left lg:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total (Inc. VAT)</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {formatPrice(order.total)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orders/${order.id}/invoice`}
                      className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                      title="Official UAE FTA VAT-Compliant Tax Invoice"
                    >
                      <FileText className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
                      <span>Tax Invoice</span>
                    </Link>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="px-4 py-2.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                    >
                      <span>E-Bill & Tracking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Real-time Order Progress Bar */}
              {renderTimeline(order.orderStatus)}

              {/* Items Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5"
                  >
                    <img
                      src={
                        it.thumbnail ||
                        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={it.productName}
                      className="w-12 h-12 object-contain rounded-xl p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {it.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Qty: {it.quantity}</span>
                        <span>•</span>
                        <span>{formatPrice(it.unitPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-4">
          <ShoppingBag className="w-14 h-14 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery || statusFilter !== 'ALL' ? 'No Matching Orders Found' : 'No Order History Found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try clearing your search filters or status criteria.'
                : 'You have not placed any orders yet on this customer account.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Clear Filters
              </button>
            )}
            <Link
              href="/products"
              className="px-5 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerOrdersPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading Orders...</div>}>
      <CustomerOrdersContent />
    </Suspense>
  );
}
