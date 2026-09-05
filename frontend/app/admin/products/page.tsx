'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Product, ProductApprovalStatus, Category, Brand } from '@/types';
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  ShieldCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Boxes,
  Eye,
  Check,
  Cpu,
  Zap,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    sku: '',
    shortDescription: '',
    description: '',
    price: 0,
    originalPrice: 0,
    discountPercentage: 0,
    stock: 10,
    categoryId: 'cat_components',
    categoryName: 'Components & Hardware',
    brandId: 'brand_intel',
    brandName: 'Intel',
    primaryImage: '',
    socket: '',
    tdp: 125,
    formFactor: 'ATX',
    warrantyYears: 3,
    sellerType: 'ADMIN',
  });

  const fetchData = async () => {
    if (!token) return;
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        ApiClient.get<Product[]>('/admin/products?limit=100', { token }),
        ApiClient.get<Category[]>('/admin/categories', { token }).catch(() => []),
        ApiClient.get<Brand[]>('/admin/brands', { token }).catch(() => []),
      ]);
      setProducts(prodRes || []);
      setCategories(catRes || []);
      setBrands(brandRes || []);
    } catch (err) {
      console.error(err);
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
    setFormError('');
    setFormData({
      title: '',
      slug: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      shortDescription: '',
      description: '',
      price: 999,
      originalPrice: 1199,
      discountPercentage: 10,
      stock: 25,
      categoryId: categories[0]?.id || 'cat_components',
      categoryName: categories[0]?.name || 'Components & Hardware',
      brandId: brands[0]?.id || 'brand_intel',
      brandName: brands[0]?.name || 'Intel',
      primaryImage: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
      socket: 'LGA1700',
      tdp: 125,
      formFactor: 'ATX',
      warrantyYears: 3,
      sellerType: 'ADMIN',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setIsEditing(true);
    setSelectedProduct(prod);
    setFormError('');
    setFormData({
      title: prod.title || prod.name || '',
      slug: prod.slug,
      sku: prod.sku,
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      price: prod.price,
      originalPrice: prod.originalPrice || prod.compareAtPrice || prod.price,
      discountPercentage: prod.discountPercentage || 0,
      stock: prod.stock,
      categoryId: prod.categoryId,
      categoryName: prod.categoryName,
      brandId: prod.brandId,
      brandName: prod.brandName,
      primaryImage: prod.primaryImage || prod.thumbnail || (prod.images && prod.images[0]) || '',
      socket: prod.specs?.socket || '',
      tdp: prod.specs?.tdp || 125,
      formFactor: prod.specs?.formFactor || 'ATX',
      warrantyYears: prod.specs?.warrantyYears || 3,
      sellerType: prod.sellerType,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        title: formData.title,
        name: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: formData.sku,
        shortDescription: formData.shortDescription,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice || formData.price),
        discountPercentage: Number(formData.discountPercentage || 0),
        stock: Number(formData.stock),
        categoryId: formData.categoryId,
        categoryName: categories.find(c => c.id === formData.categoryId)?.name || formData.categoryName,
        brandId: formData.brandId,
        brandName: brands.find(b => b.id === formData.brandId)?.name || formData.brandName,
        primaryImage: formData.primaryImage,
        images: [formData.primaryImage],
        specs: {
          socket: formData.socket || undefined,
          tdp: formData.tdp ? Number(formData.tdp) : undefined,
          formFactor: formData.formFactor || undefined,
          warrantyYears: Number(formData.warrantyYears || 3),
        },
      };

      if (isEditing && selectedProduct) {
        await ApiClient.put(`/admin/products/${selectedProduct.id}`, payload, { token });
      } else {
        await ApiClient.post('/admin/products', payload, { token });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
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
    const matchesStatus = statusFilter === 'ALL' || p.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = products.filter(p => p.approvalStatus === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Global Hardware Directory & Approvals
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hardware Products & Catalog Control
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            End-to-end CRUD for CPUs, GPUs, enterprise servers, pricing models, and vendor approvals.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search catalog by title, SKU, brand, or specifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Listings' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'PENDING_APPROVAL', label: `Pending (${pendingCount})` },
            { id: 'REJECTED', label: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Data Table (Ant Design / Shadcn Style) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[900px] text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[260px]">Hardware Item & SKU</th>
                <th className="py-3.5 px-4 font-bold min-w-[140px]">Category & Brand</th>
                <th className="py-3.5 px-4 font-bold min-w-[130px] whitespace-nowrap">Price & Discount</th>
                <th className="py-3.5 px-4 font-bold min-w-[90px] whitespace-nowrap">Stock</th>
                <th className="py-3.5 px-4 font-bold min-w-[100px] whitespace-nowrap">Seller Type</th>
                <th className="py-3.5 px-4 font-bold min-w-[130px] whitespace-nowrap">Approval Status</th>
                <th className="py-3.5 px-4 font-bold text-right min-w-[120px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(prod => {
                  const title = prod.title || prod.name;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.primaryImage || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=150&q=80'}
                            alt={title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate">{title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">SKU: {prod.sku}</div>
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
                          {/* Moderation Actions for Pending Products */}
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

                          <button
                            onClick={() => openEditModal(prod)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

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

      {/* CREATE / EDIT PRODUCT MODAL (Ant Design / Shadcn Style Drawer) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-6 shadow-2xl my-8 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {isEditing ? 'Edit Hardware Product' : 'Add New Hardware SKU'}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure catalog specifications and inventory stock</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NVIDIA RTX 4090 OC 24GB"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">SKU Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKU-GPU-4090"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={e => {
                      const sel = categories.find(c => c.id === e.target.value);
                      setFormData({ ...formData, categoryId: e.target.value, categoryName: sel?.name || '' });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Brand / Manufacturer</label>
                  <select
                    value={formData.brandId}
                    onChange={e => {
                      const sel = brands.find(b => b.id === e.target.value);
                      setFormData({ ...formData, brandId: e.target.value, brandName: sel?.name || '' });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Price (د.إ) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Orig. Price (د.إ)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Stock Count *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.primaryImage}
                  onChange={e => setFormData({ ...formData, primaryImage: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Socket / Type</label>
                  <input
                    type="text"
                    placeholder="e.g. LGA1700, AM5"
                    value={formData.socket}
                    onChange={e => setFormData({ ...formData, socket: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">TDP (Watts)</label>
                  <input
                    type="number"
                    placeholder="e.g. 125, 450"
                    value={formData.tdp}
                    onChange={e => setFormData({ ...formData, tdp: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Warranty (Years)</label>
                  <input
                    type="number"
                    value={formData.warrantyYears}
                    onChange={e => setFormData({ ...formData, warrantyYears: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Flagship 24-core processor with up to 6.0 GHz Turbo..."
                  value={formData.shortDescription}
                  onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Hardware Product' : 'Create Product Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Reject Product Listing
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Provide a clear reason for rejecting <strong className="text-slate-900 dark:text-white">{rejectingProduct.title || rejectingProduct.name}</strong>.
            </p>
            <textarea
              rows={3}
              required
              placeholder="e.g. Incomplete specifications, pricing mismatch..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectingProduct(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSetApproval(rejectingProduct.id, 'REJECTED', rejectionReason)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Delete Product Confirmation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete this product from the global catalog?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(isDeleting)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
