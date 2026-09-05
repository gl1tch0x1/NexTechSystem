'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order } from '@/types';
import { ShoppingBag, FileText, ArrowRight, Store, ShieldCheck } from 'lucide-react';

export default function CustomerOrdersPage() {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      ApiClient.get<Order[]>('/orders/my', { token })
        .then(res => setOrders(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-slate-200 dark:border-tech-slate">
        <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
          <Link href="/account" className="hover:text-tech-blue">Account</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 font-bold">Shopping History</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Complete Shopping History & Electronic Tax Invoices
        </h1>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-tech-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-black text-white">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 font-bold px-2 py-0.5 rounded">
                      {order.orderStatus}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Paid via {order.paymentMethod}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Order Date: {formatDate(order.createdAt)}
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div className="text-base font-black text-white">
                    {formatPrice(order.total)}
                  </div>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="px-4 py-2 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View & Print E-Bill</span>
                  </Link>
                </div>
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3"
                  >
                    <img
                      src={it.thumbnail || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=150&q=80'}
                      alt={it.productName}
                      className="w-12 h-12 object-contain rounded-lg p-1 bg-slate-950 border border-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        {it.productName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
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
        <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8">
          <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Order History Found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
            You have not placed any orders yet on this account.
          </p>
          <Link href="/products" className="px-5 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-bold">
            Start Shopping
          </Link>
        </div>
      )}
    </div>
  );
}
