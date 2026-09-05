'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { ApiClient } from '@/lib/api-client';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { Cpu, Plus, Trash2, ShoppingCart, CheckCircle2, XCircle, X } from 'lucide-react';

export default function ComparePage() {
  const { addToCart } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    ApiClient.get<Product[]>('/products?limit=50')
      .then(res => {
        setAllProducts(res || []);
        if (res && res.length >= 2) {
          // Pre-populate with first 2 products for quick demo
          setComparedProducts([res[0], res[1]]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleAddProduct = (product: Product) => {
    if (comparedProducts.length < 4 && !comparedProducts.some(p => p.id === product.id)) {
      setComparedProducts([...comparedProducts, product]);
    }
    setModalOpen(false);
  };

  const handleRemove = (productId: string) => {
    setComparedProducts(comparedProducts.filter(p => p.id !== productId));
  };

  const specKeys = Array.from(
    new Set(comparedProducts.flatMap(p => Object.keys(p.specifications || {})))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-tech-slate">
        <div>
          <div className="text-xs text-tech-blue font-bold uppercase tracking-wider mb-1">Architecture Comparison</div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Side-by-Side Hardware Comparison
          </h1>
          <p className="text-xs text-slate-500 mt-1">Compare up to 4 components across specs, wattage, sockets, and pricing.</p>
        </div>

        {comparedProducts.length < 4 && (
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Component ({comparedProducts.length}/4)</span>
          </button>
        )}
      </div>

      {comparedProducts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-tech-card rounded-3xl border border-slate-200 dark:border-tech-slate overflow-hidden border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-tech-slate bg-slate-50 dark:bg-tech-darker">
                <th className="p-4 text-left font-bold text-slate-400 w-48">Hardware Overview</th>
                {comparedProducts.map(prod => (
                  <th key={prod.id} className="p-4 text-left min-w-[220px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-tech-blue uppercase">{prod.brandName}</span>
                      <button
                        onClick={() => handleRemove(prod.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Remove from comparison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="aspect-[4/3] rounded-xl bg-white dark:bg-tech-slate/40 p-3 flex items-center justify-center mb-3">
                      <img
                        src={prod.thumbnail || prod.images?.[0]}
                        alt={prod.name}
                        className="max-h-full object-contain"
                      />
                    </div>
                    <Link
                      href={`/products/${prod.slug}`}
                      className="font-black text-slate-900 dark:text-white line-clamp-2 hover:text-tech-blue text-xs"
                    >
                      {prod.name}
                    </Link>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                      {formatPrice(prod.salePrice || prod.price, prod.currency)}
                    </div>
                    <button
                      onClick={() => addToCart(prod, 1)}
                      className="mt-3 w-full py-2 bg-tech-blue hover:bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-tech-slate">
              <tr>
                <td className="p-4 font-bold text-slate-400 bg-slate-50/50 dark:bg-tech-darker/50">Stock Availability</td>
                {comparedProducts.map(p => (
                  <td key={p.id} className="p-4">
                    {p.stock > 0 ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({p.stock} units)
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Out of Stock
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-400 bg-slate-50/50 dark:bg-tech-darker/50">Seller Attribution</td>
                {comparedProducts.map(p => (
                  <td key={p.id} className="p-4 font-medium text-slate-700 dark:text-slate-300">
                    {p.sellerType === 'RESELLER' ? `Reseller: ${p.resellerCode}` : 'Official NexTech Store'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-400 bg-slate-50/50 dark:bg-tech-darker/50">Warranty</td>
                {comparedProducts.map(p => (
                  <td key={p.id} className="p-4 text-slate-700 dark:text-slate-300">
                    {p.warranty || '1 Year Standard Warranty'}
                  </td>
                ))}
              </tr>

              {/* Dynamic Specifications */}
              {specKeys.map(spec => (
                <tr key={spec}>
                  <td className="p-4 font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-tech-darker/50">
                    {spec.replace(/([A-Z])/g, ' $1')}
                  </td>
                  {comparedProducts.map(p => (
                    <td key={p.id} className="p-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {p.specifications?.[spec] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-tech-card rounded-3xl border border-slate-200 dark:border-tech-slate p-8">
          <p className="text-slate-400 text-xs mb-4">No products currently selected for comparison.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-3 bg-tech-blue text-white rounded-xl text-xs font-bold"
          >
            Select Components to Compare
          </button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-tech-dark w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-tech-slate max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-tech-slate">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Product to Compare</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
              {allProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleAddProduct(p)}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-tech-slate/40 hover:border-purple-500 border border-slate-200/80 dark:border-transparent flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img src={p.thumbnail || p.images?.[0]} alt={p.name} className="w-10 h-10 object-contain" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{formatPrice(p.salePrice || p.price, p.currency)}</div>
                    </div>
                  </div>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">Select +</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
