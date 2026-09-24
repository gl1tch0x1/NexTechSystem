'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { Product } from '@/types';
import { Boxes, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

import { useParams } from 'next/navigation';

export default function ResellerInventoryPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockUpdates, setStockUpdates] = useState<Record<string, { stock: number; threshold: number }>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const fetchProducts = () => {
    if (token) {
      ApiClient.get<Product[]>('/reseller/products', { token, params: { resellerCode } })
        .then(res => {
          setProducts(res || []);
          const initial: Record<string, { stock: number; threshold: number }> = {};
          (res || []).forEach(p => {
            initial[p.id] = { stock: p.stock, threshold: p.lowStockThreshold || 5 };
          });
          setStockUpdates(initial);
        })
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, resellerCode]);

  const handleSaveStock = async (productId: string) => {
    if (!token) return;
    const update = stockUpdates[productId];
    if (!update) return;

    try {
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
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="pb-6 border-b border-slate-800">
        <div className="text-xs text-amber-400 font-mono uppercase font-bold tracking-wider mb-1">
          Real-Time Inventory Allocation
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Boxes className="w-7 h-7 text-amber-400" />
          Stock Levels & Low-Stock Alert Thresholds
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Adjust live stock counts and configure early warning thresholds for automated replenishment.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-center">Available Units</th>
                <th className="py-3 px-3 text-center">Low-Stock Alert Level</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-4 px-3 font-bold text-white max-w-xs truncate">{p.name}</td>
                  <td className="py-4 px-3 font-mono text-slate-400">{p.sku}</td>
                  <td className="py-4 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      value={stockUpdates[p.id]?.stock ?? p.stock}
                      onChange={e =>
                        setStockUpdates({
                          ...stockUpdates,
                          [p.id]: { ...stockUpdates[p.id], stock: parseInt(e.target.value, 10) || 0 },
                        })
                      }
                      className="w-24 bg-slate-900 p-2 rounded-xl text-center font-mono font-bold text-white border border-slate-800"
                    />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <input
                      type="number"
                      min={1}
                      value={stockUpdates[p.id]?.threshold ?? p.lowStockThreshold}
                      onChange={e =>
                        setStockUpdates({
                          ...stockUpdates,
                          [p.id]: { ...stockUpdates[p.id], threshold: parseInt(e.target.value, 10) || 1 },
                        })
                      }
                      className="w-24 bg-slate-900 p-2 rounded-xl text-center font-mono text-amber-400 border border-slate-800"
                    />
                  </td>
                  <td className="py-4 px-3 text-right">
                    <button
                      onClick={() => handleSaveStock(p.id)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition-colors shadow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savedId === p.id ? 'Saved ✓' : 'Update'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
