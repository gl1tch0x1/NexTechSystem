'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import {
  ShoppingBag,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  Search,
  X,
  MapPin,
  CreditCard,
  Tag,
  Eye,
  Sparkles,
  Check
} from 'lucide-react';

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Inspection modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  const fetchOrders = () => {
    if (token) {
      ApiClient.get<Order[]>('/admin/orders', { token })
        .then(res => setOrders(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus, note?: string) => {
    if (!token) return;
    setUpdatingStatus(true);
    try {
      await ApiClient.put(`/admin/orders/${orderId}/status`, { status: nextStatus, note }, { token });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Global Fulfillment & Logistics Pipeline
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Orders & Verified E-Bills
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Track hardware dispatches, multi-seller item allocations, courier updates, and payment settlements.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search orders by order number, customer name, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'PROCESSING', label: 'Processing' },
            { id: 'SHIPPED', label: 'Shipped' },
            { id: 'DELIVERED', label: 'Delivered' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[950px] text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Order # & Timestamp</th>
                <th className="py-3.5 px-4 font-bold min-w-[200px]">Customer Consignee</th>
                <th className="py-3.5 px-4 font-bold min-w-[220px]">Items Breakdown</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px] whitespace-nowrap">Net Total</th>
                <th className="py-3.5 px-4 font-bold min-w-[110px] whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 font-bold text-right min-w-[120px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{order.orderNumber}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{formatDate(order.createdAt)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-200">{order.customerName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{order.customerEmail}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-300 font-bold">{order.items?.length || 0} hardware items</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">
                        {order.items?.map(i => i.productName).join(', ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatPrice(order.total)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${order.status === 'DELIVERED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : order.status === 'SHIPPED'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : order.status === 'PROCESSING'
                                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                : order.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        <Link
                          href={`/account/orders/${order.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-tech-cyan dark:hover:text-tech-cyan hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="View Digital E-Bill"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No orders match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER INSPECTION & STATUS MANAGEMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 uppercase font-bold">
                  Order Details & Fulfillment
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedOrder.orderNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Consignee & Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>Consignee Shipping Address</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">{selectedOrder.customerName}</div>
                <div className="text-slate-600 dark:text-slate-400">{selectedOrder.customerEmail} • {selectedOrder.customerPhone || 'No phone'}</div>
                <div className="text-slate-700 dark:text-slate-300">{selectedOrder.shippingAddress?.addressLine1}</div>
                <div className="text-slate-500 dark:text-slate-400">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.country}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Financial & Payment Details</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">Payment: {selectedOrder.paymentMethod || 'CREDIT_CARD'}</div>
                <div className="text-slate-600 dark:text-slate-400">Coupon Discount: {selectedOrder.discount ? formatPrice(selectedOrder.discount) : 'None'}</div>
                <div className="text-slate-600 dark:text-slate-400">Wallet Applied: {selectedOrder.walletAmountUsed ? formatPrice(selectedOrder.walletAmountUsed) : 'د.إ 0.00'}</div>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm pt-1">
                  Net Settlement: {formatPrice(selectedOrder.total)}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Hardware Line Items ({selectedOrder.items?.length || 0})</div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                        alt={item.productName}
                        className="w-8 h-8 rounded-lg object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-right">
                      {formatPrice(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Transition Actions */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-3">
              <div className="text-xs font-bold text-purple-700 dark:text-purple-300">Update Order Fulfillment Status</div>
              <div className="flex flex-wrap items-center gap-2">
                {(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map(st => (
                  <button
                    key={st}
                    disabled={updatingStatus || selectedOrder.status === st}
                    onClick={() => handleUpdateStatus(selectedOrder.id, st, `Status transitioned to ${st} by Admin`)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedOrder.status === st
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    Mark as {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Link
                href={`/account/orders/${selectedOrder.id}`}
                target="_blank"
                className="text-xs font-bold text-tech-cyan hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                <span>Open Digital E-Bill Invoice</span>
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

