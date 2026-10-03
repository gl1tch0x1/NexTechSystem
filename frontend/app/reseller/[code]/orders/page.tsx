'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order } from '@/types';
import {
  ShoppingBag,
  FileText,
  Search,
  Calendar
} from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ResellerOrdersPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (token) {
      setLoading(true);
      ApiClient.get<Order[]>('/reseller/orders', { token, params: { resellerCode } })
        .then(res => setOrders(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [token, resellerCode]);

  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.shippingAddress?.fullName?.toLowerCase().includes(q) ||
      order.shippingAddress?.city?.toLowerCase().includes(q) ||
      order.items?.some(it => (it.productName || (it as any).name || '').toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Fulfillment Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-amber-500" />
            <span>Vendor Orders & Attributed Hardware</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Orders containing items fulfilled from your vendor hardware catalog across UAE enterprises.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by order number, buyer name, or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs font-mono font-bold text-slate-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Retrieving vendor order disbursements...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Order Number & Date</th>
                  <th className="py-3 px-3">Buyer & Dispatch Destination</th>
                  <th className="py-3 px-3">Attributed Hardware Lines</th>
                  <th className="py-3 px-3 text-right">Vendor Gross</th>
                  <th className="py-3 px-3 text-center">Fulfillment Status</th>
                  <th className="py-3 px-3 text-right">E-Bill / Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => {
                  const vendorItems = (order.items || []).filter(
                    it => it.resellerCode === resellerCode || it.sellerType === 'RESELLER' || Boolean(it.resellerId)
                  );
                  const displayItems = vendorItems.length > 0 ? vendorItems : order.items || [];
                  const vendorTotal = displayItems.reduce((acc, it) => acc + (it.subtotal || 0), 0) || order.total;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order Number & Timestamp */}
                      <td className="py-4 px-3">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          {order.orderNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </td>

                      {/* Buyer Destination */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-800">
                          {order.shippingAddress?.fullName || 'Enterprise Client'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {order.shippingAddress?.city || 'Dubai'}, {order.shippingAddress?.country || 'UAE'}
                        </div>
                      </td>

                      {/* Hardware Line Items */}
                      <td className="py-4 px-3">
                        <div className="space-y-1.5 max-w-sm">
                          {displayItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
                              <span className="font-semibold text-slate-800 truncate mr-2">
                                {item.productName || (item as any).name || 'Hardware SKU'}
                              </span>
                              <span className="font-mono font-bold text-slate-600 shrink-0">
                                {item.quantity}x @ {formatPrice(item.unitPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Vendor Gross */}
                      <td className="py-4 px-3 text-right">
                        <div className="font-black text-slate-900 font-mono text-sm">
                          {formatPrice(vendorTotal)}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-mono font-semibold">
                          Net remittance ready
                        </div>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-wider ${
                            order.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : order.orderStatus === 'PROCESSING' || order.orderStatus === 'SHIPPED'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>

                      {/* Invoice Link */}
                      <td className="py-4 px-3 text-right">
                        <Link
                          href={`/orders/${order.id}/invoice`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>E-Invoice</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">No customer orders recorded yet</div>
              <p className="text-xs text-slate-500 mt-1">
                Customer purchases containing your hardware line items will appear here automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
