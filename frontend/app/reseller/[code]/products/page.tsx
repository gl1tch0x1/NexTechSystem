'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CircleAlert, Clock3, FileSpreadsheet, Package, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { AdminProductModal } from '@/components/admin/AdminProductModal';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import type { Brand, Category, Product, Reseller } from '@/types';

type StatusFilter = 'ALL' | 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export default function ResellerProductsPage() {
  const { code } = useParams<{ code: string }>();
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [profile, setProfile] = useState<Reseller | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (!token || !code) return;
    if (refresh) setRefreshing(true);
    setError('');
    try {
      const [catalog, taxonomy, vendors, partner] = await Promise.all([
        ApiClient.get<Product[]>('/reseller/products', { token, params: { resellerCode: code, limit: 200 } }),
        ApiClient.get<Category[]>('/products/categories'),
        ApiClient.get<Brand[]>('/products/brands'),
        ApiClient.get<Reseller>('/reseller/profile', { token, params: { resellerCode: code } }),
      ]);
      setProducts(catalog || []);
      setCategories(taxonomy || []);
      setBrands(vendors || []);
      setProfile(partner);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your hardware catalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, code]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loading && categories.length && brands.length && new URLSearchParams(window.location.search).get('action') === 'new') {
      setEditing(null);
      setModalOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [loading, categories.length, brands.length]);

  const filtered = useMemo(() => products.filter(product => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || [product.name, product.sku, product.brandName, product.categoryName,
      ...(product.variants || []).map(variant => variant.sku)].some(value => value?.toLowerCase().includes(search));
    return matchesSearch && (filter === 'ALL' || product.approvalStatus === filter);
  }), [products, query, filter]);

  async function deleteProduct(product: Product) {
    if (!token || !window.confirm(`Delete ${product.name} (${product.sku})? This cannot be undone.`)) return;
    setDeleting(product.id);
    setError('');
    try {
      await ApiClient.delete(`/reseller/products/${product.id}`, { token, params: { resellerCode: code } });
      setNotice(`Deleted ${product.sku}.`);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the SKU.');
    } finally {
      setDeleting(null);
    }
  }

  const approved = products.filter(p => p.approvalStatus === 'APPROVED' && p.isActive).length;
  const pending = products.filter(p => p.approvalStatus === 'PENDING_APPROVAL').length;
  const rejected = products.filter(p => p.approvalStatus === 'REJECTED').length;
  const skuCount = products.reduce((sum, p) => sum + (p.hasVariants && p.variants?.length ? p.variants.length : 1), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Catalog management</p><h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Hardware SKUs</h1><p className="mt-1.5 max-w-xl text-sm text-slate-600 dark:text-slate-400">Create detailed listings, manage variant SKUs, and track each item through admin review.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</button><Link href={`/reseller/${code}/products/import`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><FileSpreadsheet className="h-4 w-4" /> Excel import</Link><button type="button" disabled={loading || !categories.length || !brands.length} onClick={() => { setEditing(null); setModalOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 disabled:opacity-50"><Plus className="h-4 w-4" /> Add hardware SKU</button></div>
      </div>

      {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><CircleAlert className="h-4 w-4" />{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p>}
      {!loading && (!categories.length || !brands.length) && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Categories and brands must be available before creating a SKU. Refresh the catalog when the service is ready.</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total SKUs" value={skuCount} detail={`${products.length} product records`} />
        <Stat label="Live listings" value={approved} detail="Approved and available" />
        <Stat label="In admin review" value={pending} detail="Not visible in storefront" />
        <Stat label="Needs correction" value={rejected} detail="Open to revise and resubmit" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title, SKU, variant, brand…" aria-label="Search hardware SKUs" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></div>
          <div className="flex items-center gap-2"><select aria-label="Filter approval status" value={filter} onChange={event => setFilter(event.target.value as StatusFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><option value="ALL">All statuses</option><option value="APPROVED">Approved</option><option value="PENDING_APPROVAL">In review</option><option value="REJECTED">Needs correction</option></select><span className="whitespace-nowrap text-xs text-slate-500">{filtered.length} shown</span></div>
        </div>

        {loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Loading catalog…</div>
          : filtered.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center"><Package className="h-9 w-9 text-slate-300" /><h2 className="font-bold text-slate-900 dark:text-white">{products.length ? 'No matching SKUs' : 'Your catalog is ready for its first SKU'}</h2><p className="max-w-sm text-sm text-slate-500">{products.length ? 'Try a different search or status filter.' : 'Add a hardware product with detailed pricing, specifications, stock, and variants.'}</p>{!products.length && categories.length > 0 && brands.length > 0 && <button onClick={() => { setEditing(null); setModalOpen(true); }} className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950">Add hardware SKU</button>}</div>
          : <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-950"><tr><th className="px-5 py-3">Hardware</th><th className="px-4 py-3">SKU / variants</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Approval</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map(product => <tr key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"><td className="px-5 py-4"><p className="max-w-xs truncate font-bold text-slate-900 dark:text-white">{product.name}</p><p className="mt-0.5 text-xs text-slate-500">{product.brandName} · {product.categoryName}</p></td><td className="px-4 py-4"><p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{product.sku}</p>{product.hasVariants && !!product.variants?.length && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{product.variants.length} variant SKUs</p>}</td><td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{formatPrice(product.salePrice || product.price, product.currency)}</td><td className="px-4 py-4"><span className={`rounded-lg px-2 py-1 text-xs font-bold ${product.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : product.stock <= product.lowStockThreshold ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{product.stock} units</span></td><td className="px-4 py-4"><Status product={product} />{product.rejectionReason && <p className="mt-1 max-w-40 text-xs text-red-600 dark:text-red-300">{product.rejectionReason}</p>}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => { setEditing(product); setModalOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-700 hover:border-amber-400 dark:border-slate-700 dark:text-slate-200" aria-label={`Edit ${product.name}`}><Pencil className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => void deleteProduct(product)} disabled={deleting === product.id} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-slate-700" aria-label={`Delete ${product.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></td></tr>)}</tbody></table></div>}
      </section>

      <p className="flex items-center gap-2 text-xs text-slate-500"><Clock3 className="h-4 w-4" /> Creating or editing a SKU sends it to NexTech administration for review before it appears in the storefront.</p>

      <AdminProductModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => { setNotice(editing ? 'Changes submitted for admin review.' : 'Hardware SKU submitted for admin review.'); void load(true); }} product={editing} categories={categories} brands={brands} resellers={profile ? [profile] : []} token={token} mode="reseller" resellerCode={code} />
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function Status({ product }: { product: Product }) {
  if (product.approvalStatus === 'REJECTED') return <span className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">Needs correction</span>;
  if (product.approvalStatus === 'PENDING_APPROVAL') return <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">In review</span>;
  if (product.approvalStatus === 'APPROVED' && product.isActive) return <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">Live</span>;
  return <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{product.approvalStatus || 'Draft'}</span>;
}
