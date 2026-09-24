'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CircleAlert, Clock3, PackageCheck, Search, ShoppingBag, Truck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate, formatPrice } from '@/lib/utils';
import type { OrderItem } from '@/types';

interface VendorOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  items: OrderItem[];
  resellerTotal: number;
}

export default function ResellerOrdersPage() {
  const { code } = useParams<{ code: string }>();
  const { token } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!token) return;
    let current = true;
    setLoading(true);
    ApiClient.get<VendorOrder[]>('/reseller/orders', { token, params: { resellerCode: code } })
      .then(data => { if (current) setOrders(data || []); })
      .catch(err => { if (current) setError(err instanceof Error ? err.message : 'Unable to load orders.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [token, code]);

  const visible = useMemo(() => orders.filter(order => [order.orderNumber, ...order.items.map(item => item.sku), ...order.items.map(item => item.productName)].some(value => value.toLowerCase().includes(query.toLowerCase().trim()))), [orders, query]);
  const open = orders.filter(order => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus)).length;
  const inTransit = orders.filter(order => order.orderStatus === 'SHIPPED').length;
  const delivered = orders.filter(order => order.orderStatus === 'DELIVERED').length;

  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <div className="border-b border-slate-200 pb-6 dark:border-slate-800"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Order operations</p><h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Your hardware orders</h1><p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">Only your own line items and attributed sales amounts appear here.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">{[[Clock3, 'Open orders', open], [Truck, 'In transit', inTransit], [PackageCheck, 'Delivered', delivered]].map(([Icon, label, value]) => { const Symbol = Icon as typeof Clock3; return <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><Symbol className="h-5 w-5 text-amber-600 dark:text-amber-400" /><p className="mt-4 text-2xl font-black">{value as number}</p><p className="text-xs text-slate-500 dark:text-slate-400">{label as string}</p></div>; })}</div>
    {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><CircleAlert className="h-4 w-4" />{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Order ledger</h2><p className="text-xs text-slate-500">{visible.length} matching orders</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order, product or SKU" aria-label="Search orders" className="w-full bg-transparent text-sm outline-none sm:w-56" /></label></div>
      {loading ? <p role="status" className="p-12 text-center text-sm text-slate-500">Loading orders…</p> : visible.length ? <div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Your items</th><th className="px-5 py-3 text-right">Attributed amount</th><th className="px-5 py-3">Fulfillment</th><th className="px-5 py-3">Payment</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{visible.map(order => <tr key={order.id}><td className="whitespace-nowrap px-5 py-4"><span className="font-mono font-bold">{order.orderNumber}</span><span className="mt-1 block text-xs text-slate-500">{formatDate(order.createdAt)}</span></td><td className="px-5 py-4">{order.items.map(item => <div key={`${item.productId}-${item.sku}`} className="py-0.5"><span className="font-medium">{item.quantity} × {item.productName}</span><span className="ml-2 font-mono text-xs text-slate-500">{item.sku}</span></div>)}</td><td className="px-5 py-4 text-right font-bold">{formatPrice(order.resellerTotal)}</td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{order.orderStatus.replaceAll('_', ' ')}</span></td><td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">{order.paymentStatus.replaceAll('_', ' ')}</td></tr>)}</tbody></table></div> : <div className="py-16 text-center text-slate-500"><ShoppingBag className="mx-auto mb-3 h-8 w-8 text-slate-400" /><p className="text-sm font-semibold">{query ? 'No orders match your search.' : 'Your first hardware order will appear here.'}</p></div>}
    </section>
  </div>;
}
