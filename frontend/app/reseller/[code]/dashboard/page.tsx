'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ArrowRight, ArrowUpRight, Boxes, CircleAlert, Clock3, FileSpreadsheet, Package, Plus, RefreshCw, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatDate, formatPrice } from '@/lib/utils';

interface DashboardMetrics {
  revenue: { total: number; today: number; thisWeek: number; thisMonth: number };
  orders: { total: number; pending: number; processing: number; delivered: number };
  inventory: { totalProducts: number; activeProducts: number; pendingApproval: number; rejected: number; outOfStock: number; lowStock: number; inventoryValuation: number; skuCount: number };
  performance: { unitsSold: number; averageOrderValue: number };
  salesChart: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{ id: string; name: string; sku: string; price: number; unitsSold: number; revenue: number; stock: number }>;
  lowStockItems: Array<{ id: string; name: string; sku: string; stock: number; threshold: number }>;
  recentOrders: Array<{ id: string; orderNumber: string; createdAt: string; status: string; itemCount: number; resellerTotal: number }>;
}

const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

export default function ResellerDashboardPage() {
  const { code } = useParams<{ code: string }>();
  const { token, reseller } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!token || !code) return;
    if (refresh) setRefreshing(true);
    setError('');
    try {
      setMetrics(await ApiClient.get<DashboardMetrics>('/reseller/dashboard', { token, params: { resellerCode: code } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, code]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <div className="flex min-h-[55vh] items-center justify-center text-sm text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading partner operations…</div>;
  }

  const inventory = metrics?.inventory;
  const orders = metrics?.orders;
  const revenue = metrics?.revenue;
  const sales = metrics?.salesChart || [];
  const hasSales = sales.some(day => day.revenue > 0);
  const productsHref = `/reseller/${code}/products`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400"><Activity className="h-4 w-4" /> Partner operations · {code}</div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Reseller dashboard</h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{reseller?.businessName || 'Your store'} · Sales, SKU health, approvals, and fulfillment in one view.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</button>
          <Link href={`${productsHref}?action=new`} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-amber-400"><Plus className="h-4 w-4" /> Add hardware SKU</Link>
        </div>
      </div>

      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><span className="flex items-center gap-2"><CircleAlert className="h-4 w-4" />{error}</span><button onClick={() => void load(true)} className="font-bold underline">Retry</button></div>}
      {!metrics && !error && <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">No dashboard data is available yet.</p>}

      {metrics && <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Gross sales" value={formatPrice(revenue?.total || 0)} detail={`${formatPrice(revenue?.thisMonth || 0)} this month`} icon={Wallet} tone="amber" />
          <MetricCard label="Attributed orders" value={String(orders?.total || 0)} detail={`${(orders?.pending || 0) + (orders?.processing || 0)} awaiting completion`} icon={ShoppingBag} tone="blue" />
          <MetricCard label="Live hardware" value={String(inventory?.activeProducts || 0)} detail={`${inventory?.skuCount || 0} total SKUs · ${inventory?.pendingApproval || 0} in review`} icon={Package} tone="violet" />
          <MetricCard label="Stock valuation" value={formatPrice(inventory?.inventoryValuation || 0)} detail={`${inventory?.lowStock || 0} low · ${inventory?.outOfStock || 0} out of stock`} icon={Boxes} tone="emerald" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Insight label="Today's sales" value={formatPrice(revenue?.today || 0)} detail="Attributed order value" />
          <Insight label="Average order value" value={formatPrice(metrics.performance?.averageOrderValue || 0)} detail={`${metrics.performance?.unitsSold || 0} units sold overall`} />
          <Insight label="Delivered orders" value={String(orders?.delivered || 0)} detail={`${orders?.processing || 0} processing or shipped`} />
        </div>

        <div className="grid gap-5 xl:grid-cols-5">
          <section className={`${card} p-5 xl:col-span-3`}>
            <SectionHeading title="Sales trend" subtitle="Your attributed revenue over the last seven days" href={`/reseller/${code}/orders`} link="View orders" />
            {hasSales ? <div className="mt-6 h-64 w-full" aria-label="Seven-day sales revenue chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={sales}><defs><linearGradient id="resellerSales" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} /><XAxis dataKey="date" tickFormatter={value => value.slice(5)} tick={{ fontSize: 11, fill: '#94a3b8' }} /><YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={48} /><Tooltip formatter={(value) => formatPrice(Number(value || 0))} /><Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fill="url(#resellerSales)" /></AreaChart></ResponsiveContainer></div>
              : <Empty icon={TrendingUp} message="Sales activity will appear here after your first order." />}
            <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"><span>This week: <strong className="text-slate-900 dark:text-white">{formatPrice(revenue?.thisWeek || 0)}</strong></span><span>Today: <strong className="text-slate-900 dark:text-white">{formatPrice(revenue?.today || 0)}</strong></span></div>
          </section>
          <section className={`${card} p-5 xl:col-span-2`}>
            <SectionHeading title="Catalog pipeline" subtitle="Listing readiness and admin review" href={productsHref} link="Manage SKUs" />
            <div className="mt-6 space-y-5">
              <Pipeline label="Live and approved" count={inventory?.activeProducts || 0} total={inventory?.totalProducts || 0} color="bg-emerald-500" />
              <Pipeline label="Pending admin review" count={inventory?.pendingApproval || 0} total={inventory?.totalProducts || 0} color="bg-amber-500" />
              <Pipeline label="Needs correction" count={inventory?.rejected || 0} total={inventory?.totalProducts || 0} color="bg-rose-500" />
            </div>
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:bg-slate-950 dark:text-slate-400">New listings and product edits stay off the public storefront until NexTech administration approves them.</div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <section className={`${card} p-5`}>
            <SectionHeading title="Inventory attention" subtitle="Prioritize replenishment for your catalog" href={`/reseller/${code}/inventory`} link="Open inventory" />
            {metrics.lowStockItems?.length ? <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{metrics.lowStockItems.map(item => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.name}</p><p className="font-mono text-xs text-slate-500">{item.sku}</p></div><span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${item.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'}`}>{item.stock === 0 ? 'Out of stock' : `${item.stock} left`}</span></div>)}</div>
              : <Empty icon={Boxes} message="No SKUs need replenishment right now." />}
          </section>
          <section className={`${card} p-5`}>
            <SectionHeading title="Recent orders" subtitle="Only items attributed to your reseller account" href={`/reseller/${code}/orders`} link="All orders" />
            {metrics.recentOrders?.length ? <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{metrics.recentOrders.map(order => <div key={order.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{order.orderNumber}</p><p className="text-xs text-slate-500">{formatDate(order.createdAt)} · {order.itemCount} units</p></div><div className="text-right"><p className="text-sm font-bold text-slate-900 dark:text-white">{formatPrice(order.resellerTotal)}</p><p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">{order.status.replaceAll('_', ' ')}</p></div></div>)}</div>
              : <Empty icon={ShoppingBag} message="Attributed customer orders will appear here." />}
          </section>
        </div>

        <section className={`${card} p-5`}>
          <SectionHeading title="Top hardware SKUs" subtitle="Ranked by attributed sales" href={productsHref} link="Full catalog" />
          {metrics.topProducts?.some(item => item.unitsSold > 0) ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{metrics.topProducts.filter(item => item.unitsSold > 0).map(item => <div key={item.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><p className="truncate text-sm font-bold text-slate-900 dark:text-white">{item.name}</p><p className="mt-1 font-mono text-xs text-slate-500">{item.sku}</p><div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800"><span className="text-slate-500">{item.unitsSold} sold · {item.stock} in stock</span><strong className="text-amber-700 dark:text-amber-400">{formatPrice(item.revenue)}</strong></div></div>)}</div>
            : <Empty icon={Package} message="Top-selling SKUs will appear after orders are placed." />}
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Action href={`${productsHref}?action=new`} icon={Plus} title="Add hardware SKU" description="Create a full listing with variants and specifications" />
          <Action href={`/reseller/${code}/products/import`} icon={FileSpreadsheet} title="Import in bulk" description="Preview and upload catalog spreadsheets" />
          <Action href={`/reseller/${code}/inventory`} icon={Clock3} title="Review stock" description="Manage quantities and replenishment thresholds" />
        </div>
      </>}
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Package; tone: 'amber' | 'blue' | 'violet' | 'emerald' }) {
  const colors = { amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300', emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
  return <div className={`${card} p-5`}><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><span className={`rounded-xl p-2 ${colors[tone]}`}><Icon className="h-4 w-4" /></span></div><p className="mt-4 text-2xl font-black text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div>;
}

function Insight({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className={`${card} px-5 py-4`}><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{value}</p><p className="mt-0.5 text-xs text-slate-500">{detail}</p></div>;
}

function SectionHeading({ title, subtitle, href, link }: { title: string; subtitle: string; href: string; link: string }) {
  return <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-black text-slate-900 dark:text-white">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div><Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-amber-700 hover:underline dark:text-amber-400">{link}<ArrowUpRight className="h-3.5 w-3.5" /></Link></div>;
}

function Pipeline({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return <div><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span><strong className="text-slate-900 dark:text-white">{count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${total ? count / total * 100 : 0}%` }} /></div></div>;
}

function Empty({ icon: Icon, message }: { icon: typeof Package; message: string }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-slate-400"><Icon className="h-7 w-7" /><p className="max-w-xs text-xs">{message}</p></div>;
}

function Action({ href, icon: Icon, title, description }: { href: string; icon: typeof Package; title: string; description: string }) {
  return <Link href={href} className={`${card} group flex items-center gap-3 p-4 transition hover:border-amber-400 hover:shadow-md`}><div className="rounded-xl bg-amber-100 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p><p className="mt-0.5 text-xs text-slate-500">{description}</p></div><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-amber-600" /></Link>;
}
