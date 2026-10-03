'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { Product } from '@/types';
import {
  Boxes,
  Save,
  Search,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

export default function ResellerInventoryPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<'ALL' | 'LOW' | 'OOS'>('ALL');
  const [stockUpdates, setStockUpdates] = useState<Record<string, { stock: number; threshold: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await ApiClient.get<Product[]>('/reseller/products', {
        token,
        params: { resellerCode, limit: 100 },
      });
      setProducts(res || []);
      const initial: Record<string, { stock: number; threshold: number }> = {};
      (res || []).forEach(p => {
        initial[p.id] = { stock: p.stock, threshold: p.lowStockThreshold || 5 };
      });
      setStockUpdates(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, resellerCode]);

  const handleStockChange = (productId: string, val: string) => {
    const num = parseInt(val, 10);
    setStockUpdates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        stock: isNaN(num) || num < 0 ? 0 : num,
      },
    }));
  };

  const handleThresholdChange = (productId: string, val: string) => {
    const num = parseInt(val, 10);
    setStockUpdates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        threshold: isNaN(num) || num < 1 ? 1 : num,
      },
    }));
  };

  const handleSaveStock = async (productId: string) => {
    if (!token) return;
    const update = stockUpdates[productId];
    if (!update) return;

    try {
      setSavingId(productId);
      await ApiClient.patch(
        `/reseller/products/${productId}/inventory`,
        {
          stock: update.stock,
          lowStockThreshold: update.threshold,
        },
        { token }
      );
      setSavedId(productId);
      setTimeout(() => setSavedId(null), 2500);
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, stock: update.stock, lowStockThreshold: update.threshold } : p))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const currentStock = stockUpdates[p.id]?.stock ?? p.stock;
      const thresh = stockUpdates[p.id]?.threshold ?? (p.lowStockThreshold || 5);

      if (filterView === 'OOS') return currentStock <= 0;
      if (filterView === 'LOW') return currentStock > 0 && currentStock <= thresh;
      return true;
    });
  }, [products, searchQuery, filterView, stockUpdates]);

  const totalStockCount = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalValuation = products.reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length;
  const oosCount = products.filter(p => p.stock <= 0).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Warehousing & Stock Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-amber-500" />
            <span>Inventory Allocation & Reorder Thresholds</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time on-hand quantities, safety stock buffers, and warehouse dispatch node distribution.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProducts}
          disabled={loading}
          className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs hover:shadow cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Total Hardware Units on Hand
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{totalStockCount} units</div>
          <div className="text-[11px] text-slate-500">Across all active catalog listings</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Total Capitalized Inventory
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">{formatPrice(totalValuation)}</div>
          <div className="text-[11px] text-slate-500">Retail asset valuation</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            Buffer Safety Alerts
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-amber-800 font-mono">{lowStockCount} Low</span>
            <span className="text-slate-300">•</span>
            <span className="text-2xl font-black text-rose-700 font-mono">{oosCount} OOS</span>
          </div>
          <div className="text-[11px] text-slate-500">Below threshold trigger lines</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterView('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterView === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            All Hardware ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('LOW')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterView === 'LOW'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterView('OOS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterView === 'OOS'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Depleted ({oosCount})</span>
          </button>
        </div>

        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            type="text"
            placeholder="Search by SKU, model, or brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Syncing warehouse telemetry...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Hardware Model & SKU</th>
                  <th className="py-3 px-3">Warehouse Hub</th>
                  <th className="py-3 px-3 text-right">Unit MSRP</th>
                  <th className="py-3 px-3 text-center">Safety Buffer Threshold</th>
                  <th className="py-3 px-3 text-center">On-Hand Quantity</th>
                  <th className="py-3 px-3 text-right">Save Allocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(prod => {
                  const state = stockUpdates[prod.id] || { stock: prod.stock, threshold: prod.lowStockThreshold || 5 };
                  const isSaved = savedId === prod.id;
                  const isSaving = savingId === prod.id;
                  const isLow = state.stock > 0 && state.stock <= state.threshold;
                  const isOOS = state.stock <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Title & SKU */}
                      <td className="py-4 px-3">
                        <div className="font-bold text-slate-900 line-clamp-1">{prod.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            {prod.sku}
                          </span>
                          <span>• {prod.brandName}</span>
                        </div>
                      </td>

                      {/* Warehouse Hub */}
                      <td className="py-4 px-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[10.5px]">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>Dubai JAFZA Hub (Rack B-14)</span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 px-3 text-right">
                        <span className="font-black text-slate-900 font-mono">{formatPrice(prod.price)}</span>
                      </td>

                      {/* Threshold Input */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={state.threshold}
                            onChange={e => handleThresholdChange(prod.id, e.target.value)}
                            className="w-16 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">min</span>
                        </div>
                      </td>

                      {/* Stock Quantity Input */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={state.stock}
                            onChange={e => handleStockChange(prod.id, e.target.value)}
                            className={`w-20 px-2.5 py-1.5 rounded-lg text-center font-mono font-black text-xs border focus:bg-white focus:outline-none ${
                              isOOS
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : isLow
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                            }`}
                          />
                          <span className="text-[11px] text-slate-500 font-medium">units</span>
                        </div>
                      </td>

                      {/* Save Button */}
                      <td className="py-4 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveStock(prod.id)}
                          disabled={isSaving}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                            isSaved
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>{isSaving ? 'Updating...' : 'Save'}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-xs font-mono">
            No hardware lines match your inventory filter.
          </div>
        )}
      </div>
    </div>
  );
}
