'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Product, ProductApprovalStatus, Category, Brand, SellerType } from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_BRANDS } from '@/lib/default-taxonomy';
import {
  SPECIFICATION_FIELDS,
  SPECIFICATION_PRESETS,
  SPECIFICATION_GROUPS,
} from '@/lib/specification-presets';
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
  Sparkles,
  Database,
  HardDrive,
  Monitor,
  Layers,
  Settings
} from 'lucide-react';

interface ProductFormData {
  title: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
  stock: number;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  primaryImage: string;
  socket: string;
  tdp: number;
  formFactor: string;
  warrantyYears: number;
  sellerType: SellerType;
  specifications: Record<string, string>;
  customSpecs: { key: string; value: string }[];
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
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
  const [activeSpecTab, setActiveSpecTab] = useState<string>('core');

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    slug: '',
    sku: '',
    shortDescription: '',
    description: '',
    price: 0,
    originalPrice: 0,
    discountPercentage: 0,
    stock: 10,
    categoryId: 'cat_processors',
    categoryName: 'Processors (CPUs)',
    brandId: 'brand_intel',
    brandName: 'Intel',
    primaryImage: '',
    socket: 'LGA1700',
    tdp: 125,
    formFactor: 'ATX',
    warrantyYears: 3,
    sellerType: 'ADMIN',
    specifications: {},
    customSpecs: [],
  });

  const fetchData = async () => {
    try {
      const fetchOpts = token ? { token } : {};
      const [prodRes, catRes, brandRes] = await Promise.all([
        token
          ? ApiClient.get<Product[]>('/admin/products?limit=100', { token }).catch(() => [])
          : Promise.resolve([]),
        ApiClient.get<Category[]>('/admin/categories', fetchOpts)
          .catch(() => ApiClient.get<Category[]>('/products/categories').catch(() => [])),
        ApiClient.get<Brand[]>('/admin/brands', fetchOpts)
          .catch(() => ApiClient.get<Brand[]>('/products/brands').catch(() => [])),
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
    setFormError('');
    setActiveSpecTab('core');
    const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const activeBrands = brands.length > 0 ? brands : DEFAULT_BRANDS;
    const initialCat = activeCats[0];
    const initialBrand = activeBrands[0];

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
      categoryId: initialCat?.id || 'cat_processors',
      categoryName: initialCat?.name || 'Processors (CPUs)',
      brandId: initialBrand?.id || 'brand_asus',
      brandName: initialBrand?.name || 'ASUS',
      primaryImage: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=600&q=80',
      socket: 'LGA1700',
      tdp: 125,
      formFactor: 'ATX',
      warrantyYears: 3,
      sellerType: 'ADMIN',
      specifications: {
        Condition: 'Brand New (Factory Sealed)',
        'Product Category': initialCat?.name || 'Processors (CPUs)',
        'Processor Brand': 'Intel',
        'Socket Type': 'LGA1700',
        'Form Factor': 'ATX',
        Warranty: '3 Years Official Manufacturer Warranty',
      },
      customSpecs: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setIsEditing(true);
    setSelectedProduct(prod);
    setFormError('');
    setActiveSpecTab('core');

    const loadedSpecs: Record<string, string> = { ...(prod.specifications || {}) };
    if (prod.specs?.socket && !loadedSpecs['Socket Type']) loadedSpecs['Socket Type'] = prod.specs.socket;
    if (prod.specs?.formFactor && !loadedSpecs['Form Factor']) loadedSpecs['Form Factor'] = prod.specs.formFactor;
    if (prod.specs?.warrantyYears && !loadedSpecs['Warranty']) loadedSpecs['Warranty'] = `${prod.specs.warrantyYears} Years Official Manufacturer Warranty`;

    const standardKeys = new Set<string>(SPECIFICATION_FIELDS);
    const customSpecsList: { key: string; value: string }[] = [];
    Object.entries(loadedSpecs).forEach(([k, v]) => {
      if (!standardKeys.has(k)) {
        customSpecsList.push({ key: k, value: String(v) });
      }
    });

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
      socket: prod.specs?.socket || loadedSpecs['Socket Type'] || '',
      tdp: prod.specs?.tdp || (loadedSpecs['Power Supply Wattage'] ? parseInt(loadedSpecs['Power Supply Wattage'], 10) || 125 : 125),
      formFactor: prod.specs?.formFactor || loadedSpecs['Form Factor'] || 'ATX',
      warrantyYears: prod.specs?.warrantyYears || 3,
      sellerType: prod.sellerType,
      specifications: loadedSpecs,
      customSpecs: customSpecsList,
    });
    setIsModalOpen(true);
  };

  const handleSpecChange = (key: string, value: string) => {
    const updatedSpecs = { ...formData.specifications, [key]: value };
    const updates: Partial<ProductFormData> = { specifications: updatedSpecs };

    if (key === 'Socket Type') {
      updates.socket = value;
    } else if (key === 'Form Factor') {
      updates.formFactor = value;
    } else if (key === 'Power Supply Wattage') {
      const match = value.match(/\d+/);
      if (match) updates.tdp = parseInt(match[0], 10);
    } else if (key === 'Warranty') {
      const match = value.match(/(\d+)\s*Year/i);
      if (match) updates.warrantyYears = parseInt(match[1], 10);
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleAddCustomSpec = () => {
    setFormData(prev => ({
      ...prev,
      customSpecs: [...prev.customSpecs, { key: '', value: '' }],
    }));
  };

  const handleCustomSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    setFormData(prev => {
      const next = [...prev.customSpecs];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, customSpecs: next };
    });
  };

  const handleRemoveCustomSpec = (index: number) => {
    setFormData(prev => {
      const next = prev.customSpecs.filter((_, i) => i !== index);
      return { ...prev, customSpecs: next };
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      const finalSpecs: Record<string, string> = { ...formData.specifications };
      formData.customSpecs.forEach(cs => {
        if (cs.key.trim() && cs.value.trim()) {
          finalSpecs[cs.key.trim()] = cs.value.trim();
        }
      });

      if (formData.socket && !finalSpecs['Socket Type']) {
        finalSpecs['Socket Type'] = formData.socket;
      }
      if (formData.formFactor && !finalSpecs['Form Factor']) {
        finalSpecs['Form Factor'] = formData.formFactor;
      }

      const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
      const activeBrands = brands.length > 0 ? brands : DEFAULT_BRANDS;
      const matchedCat = activeCats.find(c => c.id === formData.categoryId);
      const matchedBrand = activeBrands.find(b => b.id === formData.brandId);

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
        categoryName: matchedCat?.name || formData.categoryName,
        brandId: formData.brandId,
        brandName: matchedBrand?.name || formData.brandName,
        primaryImage: formData.primaryImage,
        images: [formData.primaryImage],
        specifications: finalSpecs,
        specs: {
          socket: formData.socket || finalSpecs['Socket Type'] || undefined,
          tdp: formData.tdp ? Number(formData.tdp) : undefined,
          formFactor: formData.formFactor || finalSpecs['Form Factor'] || undefined,
          warrantyYears: Number(formData.warrantyYears || 3),
          ...finalSpecs,
        },
        warranty: finalSpecs['Warranty'] || `${formData.warrantyYears} Years Manufacturer Warranty`,
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

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'APPROVED') return p.approvalStatus === 'APPROVED';
    if (statusFilter === 'PENDING') return p.approvalStatus === 'PENDING_APPROVAL';
    if (statusFilter === 'REJECTED') return p.approvalStatus === 'REJECTED';
    if (statusFilter === 'LOW_STOCK') return p.stock <= (p.lowStockThreshold || 5);
    return true;
  });

  const configuredSpecsCount =
    Object.keys(formData.specifications).filter(k => !!formData.specifications[k]).length +
    formData.customSpecs.filter(c => !!c.key && !!c.value).length;

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
            Standardized technical taxonomy, multi-category inventory, and vendor moderation
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hardware SKU</span>
        </button>
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
                            src={prod.primaryImage || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=150&q=80'}
                            alt={title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate">{title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">SKU: {prod.sku}</div>
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{isEditing ? 'Edit Hardware Product' : 'Add New Hardware SKU'}</span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {configuredSpecsCount} Specs Configured
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Configure catalog taxonomy, price, stock, and complete technical specifications matrix
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-6">
              {/* Core Information Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Intel Core i9-14900K Flagship 24-Core Desktop Processor"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">SKU Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SKU-CPU-14900K"
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Category & Brand Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Hardware Category *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={e => {
                        const availableCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
                        const sel = availableCats.find(c => c.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          categoryId: e.target.value,
                          categoryName: sel?.name || '',
                          specifications: {
                            ...prev.specifications,
                            'Product Category': sel?.name || prev.specifications['Product Category'] || '',
                          },
                        }));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-semibold"
                    >
                      {(categories.length > 0 ? categories : DEFAULT_CATEGORIES).map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Brand / Manufacturer *
                    </label>
                    <select
                      value={formData.brandId}
                      onChange={e => {
                        const availableBrands = brands.length > 0 ? brands : DEFAULT_BRANDS;
                        const sel = availableBrands.find(b => b.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          brandId: e.target.value,
                          brandName: sel?.name || '',
                          specifications: {
                            ...prev.specifications,
                            Brand: sel?.name || prev.specifications['Brand'] || '',
                          },
                        }));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-semibold"
                    >
                      {(brands.length > 0 ? brands : DEFAULT_BRANDS).map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pricing and Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Primary Image */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Primary Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formData.primaryImage}
                    onChange={e => setFormData({ ...formData, primaryImage: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Short Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief highlights e.g. Flagship 24-core processor with up to 6.0 GHz Turbo and PCIe Gen 5 support..."
                    value={formData.shortDescription}
                    onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* HARDWARE SPECIFICATIONS MATRIX SECTION */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Technical Specifications Matrix</span>
                        <span className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full font-mono font-bold">
                          {configuredSpecsCount} Active
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Choose standardized architecture presets or type custom hardware metrics
                      </p>
                    </div>
                  </div>
                </div>

                {/* Specification Category Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
                  {SPECIFICATION_GROUPS.map(grp => (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setActiveSpecTab(grp.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        activeSpecTab === grp.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {grp.id === 'core' && <Cpu className="w-3.5 h-3.5" />}
                      {grp.id === 'memory_storage' && <Database className="w-3.5 h-3.5" />}
                      {grp.id === 'graphics_power' && <Zap className="w-3.5 h-3.5" />}
                      {grp.id === 'display_system' && <Monitor className="w-3.5 h-3.5" />}
                      <span>{grp.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveSpecTab('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      activeSpecTab === 'custom'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Custom Specifications ({formData.customSpecs.length})</span>
                  </button>
                </div>

                {/* Active Tab Fields Rendering */}
                {SPECIFICATION_GROUPS.map(grp => {
                  if (activeSpecTab !== grp.id) return null;
                  return (
                    <div key={grp.id} className="space-y-3 animate-fadeIn">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        {grp.description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {grp.fields.map(f => {
                          const presets = f.presetKey ? SPECIFICATION_PRESETS[f.presetKey] : undefined;
                          const currentValue = formData.specifications[f.key] || '';
                          return (
                            <div key={f.key} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  {f.label}
                                </label>
                                {currentValue && (
                                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                    Set
                                  </span>
                                )}
                              </div>

                              {presets && presets.length > 0 ? (
                                <div className="space-y-1.5">
                                  {/* Presets Select Dropdown */}
                                  <select
                                    value={presets.includes(currentValue) ? currentValue : ''}
                                    onChange={e => {
                                      if (e.target.value) {
                                        handleSpecChange(f.key, e.target.value);
                                      }
                                    }}
                                    className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                  >
                                    <option value="">-- Choose {f.label} Preset --</option>
                                    {presets.map(opt => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Custom Value / Input With Datalist for Direct Editing */}
                                  <div className="relative">
                                    <input
                                      type="text"
                                      list={`datalist-${f.key.replace(/\s+/g, '-')}`}
                                      placeholder={f.placeholder}
                                      value={currentValue}
                                      onChange={e => handleSpecChange(f.key, e.target.value)}
                                      className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                                    />
                                    <datalist id={`datalist-${f.key.replace(/\s+/g, '-')}`}>
                                      {presets.map(opt => (
                                        <option key={opt} value={opt} />
                                      ))}
                                    </datalist>
                                  </div>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  placeholder={f.placeholder}
                                  value={currentValue}
                                  onChange={e => handleSpecChange(f.key, e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Custom Specifications Tab */}
                {activeSpecTab === 'custom' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Add any specific enterprise technical keys (e.g. Cache Size, PCIe Lane Count, Interface, Max Temp)
                      </p>
                      <button
                        type="button"
                        onClick={handleAddCustomSpec}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Parameter</span>
                      </button>
                    </div>

                    {formData.customSpecs.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        No custom specification parameters configured. Click &quot;Add Parameter&quot; to insert custom attributes.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {formData.customSpecs.map((cs, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Parameter Name (e.g. L3 Cache)"
                              value={cs.key}
                              onChange={e => handleCustomSpecChange(idx, 'key', e.target.value)}
                              className="flex-1 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                            />
                            <input
                              type="text"
                              placeholder="Parameter Value (e.g. 36 MB Intel Smart Cache)"
                              value={cs.value}
                              onChange={e => handleCustomSpecChange(idx, 'value', e.target.value)}
                              className="flex-1 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomSpec(idx)}
                              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                              title="Delete parameter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
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

      {/* REJECT MODAL */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Reject Vendor SKU Listing</h3>
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
