'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order } from '@/types';
import { ShoppingBag, FileText, CheckCircle2, Clock } from 'lucide-react';

import { useParams } from 'next/navigation';

export default function ResellerOrdersPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      ApiClient.get<Order[]>('/reseller/orders', { token, params: { resellerCode } })
        .then(res => setOrders(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [token, resellerCode]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="pb-6 border-b border-slate-800">
        <div className="text-xs text-amber-400 font-mono uppercase font-bold tracking-wider mb-1">
          Vendor Order Fulfillment
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-amber-400" />
          Orders Containing Your Hardware
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Filtered vendor view: only orders containing items attributed to your reseller account.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Order # & Date</th>
                  <th className="py-3 px-3">Attributed Hardware Items</th>
                  <th className="py-3 px-3 text-right">Vendor Gross</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-4 px-3">
                      <div className="font-mono font-bold text-white text-sm">{order.orderNumber}</div>
                      <div className="text-[11px] text-slate-500">{formatDate(order.createdAt)}</div>
                    </td>

                    <td className="py-4 px-3">
                      <div className="space-y-1">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="text-slate-300 font-semibold">
                            {it.quantity}x {it.productName} ({formatPrice(it.unitPrice)})
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-right font-mono font-bold text-amber-400">
                      {formatPrice(order.total)}
                    </td>

                    <td className="py-4 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900">
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="py-4 px-3 text-right">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>E-Bill</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs">
            No orders currently attributed to this vendor account.
          </div>
        )}
      </div>
    </div>
  );
}
