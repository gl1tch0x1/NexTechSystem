'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { Product, ProductApprovalStatus, Category, Brand, Reseller } from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_BRANDS } from '@/lib/default-taxonomy';
import { AdminProductModal } from '@/components/admin/AdminProductModal';
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Check,
} from 'lucide-react';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80';

/**
 * Validates and sanitizes image URLs to prevent DOM-based XSS (CWE-79 / js/xss-through-dom).
 * Strictly complies with CodeQL's MetacharEscapeSanitizer and UriEncodingSanitizer.
 */
function getSafeImageUrl(url: unknown, fallback: string = DEFAULT_FALLBACK_IMAGE): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Explicitly block dangerous pseudo-protocols
  if (/^(javascript|vbscript|data:(?!image\/))/i.test(trimmed)) {
    return fallback;
  }

  // Strictly validate HTTP, HTTPS, or safe relative paths
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  ) {
    try {
      const parsed = new URL(trimmed, 'https://nextech.local');
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        const escaped = trimmed.replace(/[<>'"]/g, '');
        return encodeURI(escaped);
      }
    } catch {
      if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        const escaped = trimmed.replace(/[<>'"]/g, '');
        return encodeURI(escaped);
      }
    }
  }

  return fallback;
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const fetchOpts = token ? { token } : {};
      const [prodRes, catRes, brandRes, resellerRes] = await Promise.all([
        token
          ? ApiClient.get<Product[]>('/admin/products?limit=100', { token }).catch(() => [])
          : Promise.resolve([]),
        ApiClient.get<Category[]>('/admin/categories', fetchOpts)
          .catch(() => ApiClient.get<Category[]>('/products/categories').catch(() => [])),
        ApiClient.get<Brand[]>('/admin/brands', fetchOpts)
          .catch(() => ApiClient.get<Brand[]>('/products/brands').catch(() => [])),
        token
          ? ApiClient.get<Reseller[]>('/admin/resellers', { token }).catch(() => [])
          : Promise.resolve([]),
      ]);

      if (prodRes && Array.isArray(prodRes) && prodRes.length > 0) {
        setProducts(prodRes);
      }
      if (catRes && Array.isArray(catRes) && catRes.length > 0) {
        setCategories(catRes);
      }
      if (brandRes && Array.isArray(brandRes) && brandRes.length > 0) {
        setBrands(brandRes);
      }
      if (resellerRes && Array.isArray(resellerRes) && resellerRes.length > 0) {
        setResellers(resellerRes);
      }
    } catch (err) {
      console.error('Failed to load admin products or taxonomy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setIsEditing(true);
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    try {
      await ApiClient.delete(`/admin/products/${id}`, { token });
      setIsDeleting(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product.');
    }
  };

  const handleSetApproval = async (id: string, status: ProductApprovalStatus, reason?: string) => {
    if (!token) return;
    try {
      await ApiClient.put(`/admin/products/${id}/approval`, { status, rejectionReason: reason }, { token });
      setRejectingProduct(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => {
    const title = p.title || p.name || '';
    const sku = p.sku || '';
    const brand = p.brandName || '';
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'APPROVED') return p.approvalStatus === 'APPROVED';
    if (statusFilter === 'PENDING') return p.approvalStatus === 'PENDING_APPROVAL';
    if (statusFilter === 'REJECTED') return p.approvalStatus === 'REJECTED';
    if (statusFilter === 'LOW_STOCK') return p.stock <= (p.lowStockThreshold || 5);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Hardware Catalog & Inventory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-mono font-bold border border-purple-200 dark:border-purple-800">
              {products.length} SKUs
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardized technical taxonomy, multi-variant options, warehouse inventory, and vendor moderation
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hardware SKU</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by Title, SKU, or Brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Catalog' },
            { id: 'APPROVED', label: 'Live Active' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'LOW_STOCK', label: 'Low Stock' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Hardware Item & Specs</th>
                <th className="py-3 px-4">Brand & Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Inventory</th>
                <th className="py-3 px-4">Origin Channel</th>
                <th className="py-3 px-4">Catalog Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading enterprise catalog products...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(prod => {
                  const title = prod.title || prod.name || 'Untitled SKU';
                  const specs = prod.specifications || {};
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getSafeImageUrl(prod.primaryImage, DEFAULT_FALLBACK_IMAGE)}
                            alt={title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate">{title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                              <span>SKU: {prod.sku}</span>
                              {prod.hasVariants && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                                  {prod.variants?.length || 0} Variants
                                </span>
                              )}
                            </div>
                            {/* Quick Specs Badges */}
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {specs['Condition'] && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                  {specs['Condition'].split('(')[0].trim()}
                                </span>
                              )}
                              {(specs['Socket Type'] || prod.specs?.socket) && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                                  {specs['Socket Type'] || prod.specs?.socket}
                                </span>
                              )}
                              {specs['RAM Capacity'] && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                                  {specs['RAM Capacity']}
                                </span>
                              )}
                              {specs['Storage Capacity'] && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono">
                                  {specs['Storage Capacity']}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-300">{prod.brandName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{prod.categoryName}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">{formatPrice(prod.price)}</div>
                        {(prod.discountPercentage || 0) > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            -{prod.discountPercentage}% off ({formatPrice(prod.originalPrice || prod.price)})
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                            prod.stock > 10
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : prod.stock > 0
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}
                        >
                          {prod.stock} in stock
                        </span>
                      </td>

                      {/* Seller Type */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {prod.sellerType === 'ADMIN' ? 'Official Store' : 'Partner Store'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {prod.approvalStatus === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {prod.approvalStatus === 'PENDING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {prod.approvalStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {prod.approvalStatus === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleSetApproval(prod.id, 'APPROVED')}
                                title="Approve Listing"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRejectingProduct(prod)}
                                title="Reject Listing"
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <Link
                            href={`/admin/products/${prod.id}/edit`}
                            title="Edit Product"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer inline-flex"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => setIsDeleting(prod.id)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No hardware products match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 9-STEP ENTERPRISE PRODUCT MODAL */}
      <AdminProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchData}
        product={isEditing ? selectedProduct : null}
        categories={categories}
        brands={brands}
        resellers={resellers}
        token={token}
      />

      {/* REJECT MODAL */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:white">Reject Vendor SKU Listing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide specific feedback to the vendor regarding why this listing cannot be approved:
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Inaccurate pricing or missing manufacturer datasheet specifications..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingProduct(null)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSetApproval(rejectingProduct.id, 'REJECTED', rejectionReason)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-600/20"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Product Listing?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will permanently delete this hardware listing and remove it from all customer catalogs.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(isDeleting)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-600/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
