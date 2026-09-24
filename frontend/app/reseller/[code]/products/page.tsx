'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import {
  Package,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';

export default function ResellerProductsPage() {
  const params = useParams();
  const resellerCode = params.code as string;
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = () => {
    if (token) {
      ApiClient.get<Product[]>('/reseller/products', { token, params: { resellerCode } })
        .then(res => setProducts(res || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, resellerCode]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs text-amber-400 font-mono uppercase font-bold tracking-wider mb-1">
            Vendor Hardware Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Product Listings & Approval Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your pricing, inventory quantities, and track Admin catalog approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/reseller/${resellerCode}/products/import`}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Importer</span>
          </Link>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search my SKU, product title, brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredProducts.length} listings
        </div>
      </div>

      {/* Products Table */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Item Description</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Catalog Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.thumbnail || p.images?.[0]}
                        alt={p.name}
                        className="w-10 h-10 object-contain rounded-lg p-1 bg-slate-900 border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 max-w-sm">
                        <div className="font-bold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-amber-400 font-mono">{p.brandName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 font-mono text-slate-400">{p.sku}</td>
                  <td className="py-4 px-3 text-slate-300">{p.categoryName}</td>
                  <td className="py-4 px-3 text-right font-mono font-bold text-white">
                    {formatPrice(p.salePrice || p.price, p.currency)}
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        p.stock === 0
                          ? 'bg-red-950/60 text-red-400'
                          : p.stock <= p.lowStockThreshold
                          ? 'bg-amber-950/60 text-amber-400'
                          : 'bg-slate-900 text-emerald-400'
                      }`}
                    >
                      {p.stock} units
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    {p.approvalStatus === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
                        <CheckCircle2 className="w-3 h-3" /> Live & Approved
                      </span>
                    )}
                    {p.approvalStatus === 'PENDING_APPROVAL' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900">
                        <Clock className="w-3 h-3" /> In Review
                      </span>
                    )}
                    {p.approvalStatus === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
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
