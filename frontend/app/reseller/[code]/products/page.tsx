'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Plus,
  Edit3,
  Trash2,
  Boxes,
  Package,
  X,
  AlertCircle,
  Check,
  ShieldCheck
} from 'lucide-react';

const HARDWARE_CATEGORIES = [
  { id: 'cat_servers', name: 'Enterprise Rackmount Servers' },
  { id: 'cat_gpus', name: 'Graphics Cards (GPUs)' },
  { id: 'cat_processors', name: 'Processors (CPUs)' },
  { id: 'cat_storage', name: 'Storage (NVMe/SSD/HDD)' },
  { id: 'cat_ram', name: 'Memory (RAM)' },
  { id: 'cat_networking', name: 'Enterprise Networking' },
  { id: 'cat_motherboards', name: 'Motherboards' },
  { id: 'cat_psus', name: 'Power Supplies (PSUs)' },
  { id: 'cat_laptops', name: 'Laptops & Workstations' },
  { id: 'cat_monitors', name: 'Monitors & Displays' },
  { id: 'cat_components', name: 'PC Components & Hardware' },
];

const HARDWARE_BRANDS = [
  { id: 'brand_dell', name: 'Dell Technologies' },
  { id: 'brand_cisco', name: 'Cisco Systems' },
  { id: 'brand_nvidia', name: 'NVIDIA' },
  { id: 'brand_intel', name: 'Intel' },
  { id: 'brand_amd', name: 'AMD' },
  { id: 'brand_asus', name: 'ASUS' },
  { id: 'brand_lenovo', name: 'Lenovo' },
  { id: 'brand_hp', name: 'HP Enterprise' },
  { id: 'brand_corsair', name: 'Corsair' },
  { id: 'brand_samsung', name: 'Samsung Semiconductor' },
  { id: 'brand_supermicro', name: 'Supermicro' },
  { id: 'brand_other', name: 'Other Enterprise Brand' },
];

const DEFAULT_IMAGE_FALLBACK =
  'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80';

export default function ResellerProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const resellerCode = params.code as string;
  const { token } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING_APPROVAL' | 'OUT_OF_STOCK'>('ALL');

  // Modal State for Adding / Editing SKUs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for SKU Creation/Editing
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    brandId: HARDWARE_BRANDS[0].id,
    brandName: HARDWARE_BRANDS[0].name,
    categoryId: HARDWARE_CATEGORIES[0].id,
    categoryName: HARDWARE_CATEGORIES[0].name,
    price: '',
    compareAtPrice: '',
    costPrice: '',
    stock: '',
    lowStockThreshold: '5',
    thumbnail: '',
    description: '',
    warranty: '3 Years Next Business Day On-Site Hardware Warranty',
    weight: '2.5',
    specs: {
      formFactor: '2U Rackmount',
      socket: 'Dual Socket',
      tdp: '350W',
      powerSupply: 'Hot-plug redundant 800W Titanium',
    } as Record<string, string>,
  });

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchProducts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await ApiClient.get<Product[]>('/reseller/products', {
        token,
        params: { resellerCode, limit: 100 },
      });
      setProducts(res || []);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to load vendor product catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, resellerCode]);

  // Open modal if URL query has ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openAddModal();
    }
  }, [searchParams]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `${resellerCode.toUpperCase().slice(0, 4)}-${Date.now().toString(36).toUpperCase()}`,
      barcode: '',
      brandId: HARDWARE_BRANDS[0].id,
      brandName: HARDWARE_BRANDS[0].name,
      categoryId: HARDWARE_CATEGORIES[0].id,
      categoryName: HARDWARE_CATEGORIES[0].name,
      price: '',
      compareAtPrice: '',
      costPrice: '',
      stock: '10',
      lowStockThreshold: '3',
      thumbnail: DEFAULT_IMAGE_FALLBACK,
      description: '',
      warranty: '3 Years Next Business Day On-Site Hardware Warranty',
      weight: '3.0',
      specs: {
        formFactor: 'Rackmount',
        powerSupply: 'Redundant Gold/Titanium',
        condition: 'Brand New Factory Sealed',
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode || '',
      brandId: prod.brandId,
      brandName: prod.brandName,
      categoryId: prod.categoryId,
      categoryName: prod.categoryName,
      price: String(prod.price),
      compareAtPrice: prod.compareAtPrice ? String(prod.compareAtPrice) : '',
      costPrice: prod.costPrice ? String(prod.costPrice) : '',
      stock: String(prod.stock),
      lowStockThreshold: String(prod.lowStockThreshold || 5),
      thumbnail: prod.thumbnail || prod.images?.[0] || DEFAULT_IMAGE_FALLBACK,
      description: prod.description || '',
      warranty: prod.warranty || '3 Years Next Business Day Warranty',
      weight: prod.weight ? String(prod.weight) : '2.5',
      specs: prod.specifications || (prod.specs as Record<string, string>) || {
        condition: 'Brand New Factory Sealed',
      },
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    if (searchParams.get('action')) {
      router.replace(`/reseller/${resellerCode}/products`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.name.trim()) {
      showToast('error', 'Please provide a valid product title/model name.');
      return;
    }
    if (!formData.sku.trim()) {
      showToast('error', 'SKU identifier code is required.');
      return;
    }
    const numPrice = parseFloat(formData.price);
    if (isNaN(numPrice) || numPrice < 0) {
      showToast('error', 'Please enter a valid selling price.');
      return;
    }
    const numStock = parseInt(formData.stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      showToast('error', 'Please enter a valid stock quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        barcode: formData.barcode.trim() || undefined,
        brandId: formData.brandId,
        brandName: formData.brandName,
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        price: numPrice,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        stock: numStock,
        lowStockThreshold: parseInt(formData.lowStockThreshold, 10) || 3,
        thumbnail: formData.thumbnail.trim() || DEFAULT_IMAGE_FALLBACK,
        images: [formData.thumbnail.trim() || DEFAULT_IMAGE_FALLBACK],
        description: formData.description.trim(),
        warranty: formData.warranty.trim(),
        weight: parseFloat(formData.weight) || 1.0,
        specifications: formData.specs,
        specs: formData.specs,
        currency: 'AED',
      };

      if (editingProduct) {
        await ApiClient.put(`/reseller/products/${editingProduct.id}`, payload, { token });
        showToast('success', `Product SKU "${payload.sku}" updated (Pending approval review).`);
      } else {
        await ApiClient.post('/reseller/products', payload, { token });
        showToast('success', `New Product SKU "${payload.sku}" submitted for Admin verification!`);
      }

      closeModal();
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to save product SKU.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (prod: Product) => {
    if (!token) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete SKU "${prod.sku}" (${prod.name}) from your vendor catalog?`
    );
    if (!confirmDelete) return;

    try {
      await ApiClient.delete(`/reseller/products/${prod.id}`, { token });
      showToast('success', `Product SKU "${prod.sku}" removed.`);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Failed to delete product.');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandName?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'APPROVED') {
        return p.approvalStatus === 'APPROVED';
      }
      if (statusFilter === 'PENDING_APPROVAL') {
        return p.approvalStatus === 'PENDING_APPROVAL' || p.approvalStatus === 'DRAFT';
      }
      if (statusFilter === 'OUT_OF_STOCK') {
        return (p.stock || 0) <= 0;
      }
      return true;
    });
  }, [products, searchQuery, statusFilter]);

  const approvedCount = products.filter(p => p.approvalStatus === 'APPROVED').length;
  const pendingCount = products.filter(p => p.approvalStatus === 'PENDING_APPROVAL' || p.approvalStatus === 'DRAFT').length;
  const oosCount = products.filter(p => (p.stock || 0) <= 0).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Multi-Tenant Hardware Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Vendor Hardware SKUs & Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, manage pricing, allocate stock, and track Admin catalog review status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/reseller/${resellerCode}/products/import`}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-xs hover:shadow"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Bulk Import</span>
          </Link>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product SKU</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            All SKUs ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Live Approved ({approvedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'PENDING_APPROVAL'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'OUT_OF_STOCK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/70'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Depleted Stock ({oosCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            type="text"
            placeholder="Search by SKU, product name, brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 text-xs text-slate-900 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Querying verified vendor product records...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Product / Hardware SKU</th>
                  <th className="py-3 px-3">Category & Brand</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-center">Stock Level</th>
                  <th className="py-3 px-3 text-center">Approval Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(prod => {
                  const isApproved = prod.approvalStatus === 'APPROVED';
                  const isPending = prod.approvalStatus === 'PENDING_APPROVAL' || prod.approvalStatus === 'DRAFT';
                  const isRejected = prod.approvalStatus === 'REJECTED';

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Product Thumbnail & Details */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.thumbnail || prod.images?.[0] || DEFAULT_IMAGE_FALLBACK}
                            alt={prod.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            onError={e => {
                              (e.target as HTMLImageElement).src = DEFAULT_IMAGE_FALLBACK;
                            }}
                          />
                          <div className="min-w-0 max-w-sm">
                            <div className="font-bold text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                              <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                {prod.sku}
                              </span>
                              {prod.barcode && <span>• EAN: {prod.barcode}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-4 px-3">
                        <div className="font-semibold text-slate-800">{prod.categoryName || 'General Hardware'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{prod.brandName || 'Generic'}</div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-3 text-right">
                        <div className="font-black text-slate-900 font-mono text-sm">
                          {formatPrice(prod.price)}
                        </div>
                        {prod.compareAtPrice && prod.compareAtPrice > prod.price && (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            MSRP: {formatPrice(prod.compareAtPrice)}
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-mono font-bold text-[11px] ${
                            prod.stock <= 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : prod.stock <= (prod.lowStockThreshold || 3)
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {prod.stock} units
                        </span>
                      </td>

                      {/* Catalog Approval Status */}
                      <td className="py-4 px-3 text-center">
                        {isApproved ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approved (Live)</span>
                          </div>
                        ) : isPending ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending Review</span>
                          </div>
                        ) : isRejected ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold" title={prod.rejectionReason || 'Requires revision'}>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Rejected</span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-500">{prod.approvalStatus}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit SKU Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(prod)}
                            className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">No hardware SKUs found</div>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? 'No products matched your search filter.'
                  : 'Start listing your enterprise hardware inventory on NexTech today.'}
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create First Product SKU</span>
            </button>
          </div>
        )}
      </div>

      {/* Comprehensive Product SKU Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-amber-700 font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reseller SKU Registry</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingProduct ? `Edit Hardware SKU: ${editingProduct.sku}` : 'Add New Hardware Product SKU'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submissions enter the Admin Approval Pipeline for verification before public storefront listing.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* 1. Basic Hardware Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  1. Hardware Model & Identification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Product Title / Model Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dell PowerEdge R760 2U Rack Server (Dual Xeon Gold, 128GB RAM)"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Unique Hardware SKU *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. COM-DL-R760-01"
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      className="w-full font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Barcode / EAN (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 5060000000000"
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Hardware Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={e => {
                        const sel = HARDWARE_CATEGORIES.find(c => c.id === e.target.value);
                        setFormData({
                          ...formData,
                          categoryId: e.target.value,
                          categoryName: sel?.name || 'Hardware',
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    >
                      {HARDWARE_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Manufacturer / Brand *</label>
                    <select
                      value={formData.brandId}
                      onChange={e => {
                        const sel = HARDWARE_BRANDS.find(b => b.id === e.target.value);
                        setFormData({
                          ...formData,
                          brandId: e.target.value,
                          brandName: sel?.name || 'Manufacturer',
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    >
                      {HARDWARE_BRANDS.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Commercial Pricing & Inventory */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  2. Pricing, Margin & Stock Allocation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Selling Price (AED) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 18500.00"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">MSRP / Compare Price (AED)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 21000.00"
                      value={formData.compareAtPrice}
                      onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Wholesale Cost (AED)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Internal cost margin"
                      value={formData.costPrice}
                      onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Available Stock on Hand *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.lowStockThreshold}
                      onChange={e => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 15.0"
                      value={formData.weight}
                      onChange={e => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Media & Product Thumbnail */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  3. Media & Primary Product Imagery
                </h3>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={formData.thumbnail || DEFAULT_IMAGE_FALLBACK}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).src = DEFAULT_IMAGE_FALLBACK;
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-1.5 w-full">
                    <label className="font-bold text-slate-700">Image HTTPS URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.thumbnail}
                      onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-400">
                      Must be a valid HTTPS image link (JPG, PNG, or WebP). High-res hardware imagery recommended.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Specifications & Description */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                  4. Hardware Specifications & Warranty
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Form Factor / Chassis</label>
                    <input
                      type="text"
                      placeholder="e.g. 1U / 2U Rackmount, ATX Mid-Tower"
                      value={formData.specs.formFactor || ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          specs: { ...formData.specs, formFactor: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Warranty Coverage</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 Years ProSupport Next Business Day"
                      value={formData.warranty}
                      onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Hardware Description & Datasheet Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Detail technical specs, processor generation, memory channels, expansion slots, and enterprise deployment use-cases..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer / Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Submitted items will be tagged PENDING_APPROVAL until Admin verified.</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{isSubmitting ? 'Saving SKU...' : editingProduct ? 'Update SKU' : 'Publish Product SKU'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
