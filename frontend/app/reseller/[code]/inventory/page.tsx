'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Boxes, CircleAlert, PackageX, Save, Search, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import type { Product } from '@/types';

type StockEdit = { stock: number; threshold: number };

export default function ResellerInventoryPage() {
  const { code } = useParams<{ code: string }>();
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [edits, setEdits] = useState<Record<string, StockEdit>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await ApiClient.get<Product[]>('/reseller/products', { token, params: { resellerCode: code, limit: 200 } });
      setProducts(data || []);
      setEdits(Object.fromEntries((data || []).map(p => [p.id, { stock: p.stock, threshold: p.lowStockThreshold ?? 5 }])));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load inventory.');
    } finally { setLoading(false); }
  }, [token, code]);

  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase().trim())), [products, query]);
  const low = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold ?? 5)).length;
  const out = products.filter(p => p.stock === 0).length;

  async function save(product: Product) {
    if (!token) return;
    const edit = edits[product.id];
    if (!edit || !Number.isInteger(edit.stock) || edit.stock < 0 || !Number.isInteger(edit.threshold) || edit.threshold < 0) {
      setError('Stock and alert levels must be non-negative whole numbers.'); return;
    }
    setSaving(product.id);
    setError('');
    try {
      await ApiClient.patch(`/reseller/products/${product.id}/inventory`, { stock: edit.stock, lowStockThreshold: edit.threshold }, { token, params: { resellerCode: code } });
      setSaved(product.id);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save stock.'); }
    finally { setSaving(null); }
  }

  return <div className="mx-auto max-w-7xl space-y-6 pb-12">
    <div className="border-b border-slate-200 pb-6 dark:border-slate-800"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Stock control</p><h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Inventory & alerts</h1><p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">Maintain available units and choose when a hardware SKU needs replenishment.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">{[[Boxes, 'Hardware listings', products.length], [TriangleAlert, 'Low stock', low], [PackageX, 'Out of stock', out]].map(([Icon, label, value]) => { const Symbol = Icon as typeof Boxes; return <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><Symbol className="h-5 w-5 text-amber-600 dark:text-amber-400" /><p className="mt-4 text-2xl font-black">{value as number}</p><p className="text-xs text-slate-500 dark:text-slate-400">{label as string}</p></div>; })}</div>
    {error && <p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"><CircleAlert className="h-4 w-4" />{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Stock ledger</h2><p className="text-xs text-slate-500">Changes are saved per listing.</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"><Search className="h-4 w-4 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name or SKU" aria-label="Search inventory" className="w-full bg-transparent text-sm outline-none sm:w-52" /></label></div>
      {loading ? <p role="status" className="p-12 text-center text-sm text-slate-500">Loading inventory…</p> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[690px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-950/50"><tr><th className="px-5 py-3">Hardware</th><th className="px-5 py-3">SKU</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Available</th><th className="px-5 py-3">Alert at</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filtered.map(p => <tr key={p.id}><td className="max-w-xs px-5 py-4 font-semibold">{p.name}</td><td className="px-5 py-4 font-mono text-xs text-slate-500">{p.sku}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.stock === 0 ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300' : p.stock <= (p.lowStockThreshold ?? 5) ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{p.stock === 0 ? 'Out of stock' : p.stock <= (p.lowStockThreshold ?? 5) ? 'Low stock' : 'Healthy'}</span></td><td className="px-5 py-4"><input type="number" min={0} step={1} value={edits[p.id]?.stock ?? p.stock} onChange={e => setEdits(old => ({ ...old, [p.id]: { ...old[p.id], stock: Number(e.target.value) } }))} aria-label={`Available units for ${p.sku}`} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center dark:border-slate-700 dark:bg-slate-950" /></td><td className="px-5 py-4"><input type="number" min={0} step={1} value={edits[p.id]?.threshold ?? p.lowStockThreshold ?? 5} onChange={e => setEdits(old => ({ ...old, [p.id]: { ...old[p.id], threshold: Number(e.target.value) } }))} aria-label={`Alert level for ${p.sku}`} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center dark:border-slate-700 dark:bg-slate-950" /></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => void save(p)} disabled={saving === p.id || (edits[p.id]?.stock === p.stock && edits[p.id]?.threshold === (p.lowStockThreshold ?? 5))} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving === p.id ? 'Saving…' : saved === p.id ? 'Saved' : 'Save'}</button></td></tr>)}</tbody></table></div> : <div className="py-16 text-center text-slate-500"><Boxes className="mx-auto mb-3 h-8 w-8 text-slate-400" /><p className="text-sm font-semibold">{query ? 'No inventory matches your search.' : 'No hardware SKUs yet.'}</p>{!query && <Link href={`/reseller/${code}/products?action=new`} className="mt-3 inline-flex text-sm font-bold text-amber-600 hover:underline">Add your first SKU</Link>}</div>}
    </section>
  </div>;
}
