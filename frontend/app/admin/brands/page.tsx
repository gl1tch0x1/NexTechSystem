'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { Brand } from '@/types';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Camera,
  RefreshCw
} from 'lucide-react';

import { DEFAULT_BRANDS } from '@/lib/default-taxonomy';

const PRESET_BRAND_LOGOS = [
  { name: 'Intel', logo: '/brands/intel.svg' },
  { name: 'NVIDIA', logo: '/brands/nvidia.svg' },
  { name: 'AMD', logo: '/brands/amd.svg' },
  { name: 'ASUS', logo: '/brands/asus.svg' },
  { name: 'Dell', logo: '/brands/dell.svg' },
  { name: 'HPE', logo: '/brands/hpe.svg' },
  { name: 'Lenovo', logo: '/brands/lenovo.svg' },
  { name: 'Cisco', logo: '/brands/cisco.svg' },
  { name: 'Supermicro', logo: '/brands/supermicro.svg' },
  { name: 'Samsung', logo: '/brands/samsung.svg' },
  { name: 'Kingston', logo: '/brands/kingston.svg' },
  { name: 'Corsair', logo: '/brands/corsair.svg' },
  { name: 'Seasonic', logo: '/brands/seasonic.svg' },
  { name: 'Western Digital', logo: '/brands/wd.svg' },
  { name: 'Seagate', logo: '/brands/seagate.svg' },
  { name: 'Gigabyte', logo: '/brands/gigabyte.svg' },
  { name: 'MSI', logo: '/brands/msi.svg' },
  { name: 'Synology', logo: '/brands/synology.svg' },
  { name: 'Fortinet', logo: '/brands/fortinet.svg' },
  { name: 'Crucial', logo: '/brands/crucial.svg' },
];

export default function AdminBrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Image Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewDarkTheme, setPreviewDarkTheme] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    tier: 'TIER_1',
    description: '',
    website: '',
    isActive: true,
  });

  const fetchBrands = async () => {
    try {
      const fetchOpts = token ? { token } : {};
      const data = await ApiClient.get<Brand[]>('/admin/brands', fetchOpts)
        .catch(() => ApiClient.get<Brand[]>('/products/brands').catch(() => []));
      if (data && Array.isArray(data) && data.length > 0) {
        setBrands(data);
      } else {
        setBrands(DEFAULT_BRANDS);
      }
    } catch (err) {
      console.error('Failed to fetch brands:', err);
      setBrands(DEFAULT_BRANDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [token]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedBrand(null);
    setFormError('');
    setFormSuccess('');
    setFormData({
      name: '',
      slug: '',
      logo: '/brands/intel.svg',
      tier: 'TIER_1',
      description: '',
      website: 'https://',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setIsEditing(true);
    setSelectedBrand(brand);
    setFormError('');
    setFormSuccess('');
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || '',
      tier: brand.tier || 'TIER_1',
      description: brand.description || '',
      website: brand.website || '',
      isActive: brand.isActive !== false,
    });
    setIsModalOpen(true);
  };

  // Name change handler: auto-generates slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: isEditing ? prev.slug : generatedSlug ? `brand_${generatedSlug}` : '',
    }));
  };

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError('');

    try {
      const bodyFormData = new FormData();
      bodyFormData.append('file', file);
      bodyFormData.append('folder', 'brands');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: bodyFormData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setFormData(prev => ({ ...prev, logo: data.url }));
          setFormSuccess('Image uploaded successfully!');
          return;
        }
      }

      // Fallback: use FileReader data URL
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setFormData(prev => ({ ...prev, logo: result }));
          setFormSuccess('Image loaded as local data URL');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.warn('Upload route fallback to data URL:', err);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setFormData(prev => ({ ...prev, logo: result }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim() || `brand_${formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        logo: formData.logo.trim(),
        tier: formData.tier,
        description: formData.description.trim(),
        website: formData.website.trim(),
        isActive: formData.isActive,
      };

      if (!payload.name) {
        throw new Error('Brand name is required');
      }

      const fetchOpts = token ? { token } : {};

      if (isEditing && selectedBrand) {
        await ApiClient.put(`/admin/brands/${selectedBrand.id}`, payload, fetchOpts);
        // Optimistic local update
        setBrands(prev => prev.map(b => b.id === selectedBrand.id ? { ...b, ...payload } : b));
      } else {
        const newBrand = await ApiClient.post<Brand>('/admin/brands', payload, fetchOpts);
        // Optimistic local add
        if (newBrand && newBrand.id) {
          setBrands(prev => [newBrand, ...prev]);
        }
      }

      setIsModalOpen(false);
      fetchBrands();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    setIsSubmitting(true);

    try {
      const fetchOpts = token ? { token } : {};
      await ApiClient.delete(`/admin/brands/${isDeleting.id}`, fetchOpts);
      // Optimistic local remove
      setBrands(prev => prev.filter(b => b.id !== isDeleting.id));
      setIsDeleting(null);
      fetchBrands();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBrands = brands.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = tierFilter === 'ALL' || b.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-tech-blue dark:text-tech-cyan font-mono uppercase font-bold tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Tier-1 Authorized GCC Hardware Supply Chain</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Brands & Vendor Supply Chain
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Manage Tier-1 original equipment manufacturers, update brand logo images, or add and remove vendor partners appearing in the storefront marquee.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBrands}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-tech-blue dark:hover:text-tech-cyan transition-colors"
            title="Refresh Brands"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-tech-blue hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Brand</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            placeholder="Search manufacturer brands by name or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-tech-blue"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-500 text-[11px]">Tier:</span>
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-tech-blue"
            >
              <option value="ALL">All Tiers ({brands.length})</option>
              <option value="TIER_1">Tier-1 Direct</option>
              <option value="TIER_2">Tier-2 Certified</option>
              <option value="TIER_3">Tier-3 Regional</option>
            </select>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
            {filteredBrands.length} Brands
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBrands.length > 0 ? (
          filteredBrands.map(brand => (
            <div
              key={brand.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-tech-blue/50 dark:hover:border-tech-cyan/50 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3.5">
                {/* Brand Header with Logo and Action Buttons */}
                <div className="flex items-start justify-between gap-3">
                  {/* Brand Logo Box with Hover Quick-Edit Camera */}
                  <div
                    onClick={() => openEditModal(brand)}
                    className="relative w-24 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-2 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group/logo shadow-inner"
                    title="Click to change brand logo"
                  >
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="max-h-8 max-w-full object-contain filter dark:brightness-110 contrast-125"
                        onError={(e) => {
                          // Fallback on broken image
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}

                    {/* Overlay Camera hint on hover */}
                    <div className="absolute inset-0 bg-slate-950/70 text-white flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-tech-cyan" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(brand)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-tech-blue dark:hover:text-tech-cyan hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                      title="Edit Brand & Logo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(brand)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Brand Name & Metadata */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {brand.name}
                    </h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-tech-blue dark:text-tech-cyan border border-blue-200/60 dark:border-blue-800/50 shrink-0">
                      {brand.tier === 'TIER_1' ? 'Tier-1 Direct' : brand.tier === 'TIER_2' ? 'Tier-2' : 'Tier-3'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 block mt-0.5 truncate">
                    {brand.slug}
                  </span>
                </div>

                {/* Role / Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {brand.description || 'Authorized GCC technology manufacturer and supply chain partner.'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>{brand.productCount || 0} Products</span>
                </span>

                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-tech-blue dark:text-tech-cyan hover:underline flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <span>Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Award className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No brand records found</p>
            <p className="text-xs text-slate-500 mt-1">Try changing your search terms or click "Add New Brand" above.</p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT BRAND MODAL WITH ADVANCED IMAGE SELECTOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
                {isEditing ? `Edit Brand: ${selectedBrand?.name}` : 'Register New Manufacturer Brand'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-900/50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Brand Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Supermicro"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Slug Identifier</label>
                  <input
                    type="text"
                    placeholder="brand_supermicro"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue font-mono transition-all"
                  />
                </div>
              </div>

              {/* BRAND IMAGE SECTION: Preview, Upload, URL, and Presets */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
                    <span>Brand Logo Image</span>
                  </label>

                  {/* Toggle Preview Contrast (Light/Dark checker) */}
                  <button
                    type="button"
                    onClick={() => setPreviewDarkTheme(!previewDarkTheme)}
                    className="text-[11px] font-mono text-slate-500 hover:text-tech-blue dark:hover:text-tech-cyan cursor-pointer flex items-center gap-1"
                  >
                    <span>Preview Contrast:</span>
                    <span className="font-bold underline">{previewDarkTheme ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </div>

                {/* Live Logo Preview Box */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-32 h-16 rounded-xl border p-3 flex items-center justify-center shrink-0 transition-colors shadow-sm ${
                      previewDarkTheme
                        ? 'bg-[#070B14] border-slate-700'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Logo Preview"
                        className="max-h-12 max-w-full object-contain filter contrast-125"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">No Image</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* File Upload Trigger Button */}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-tech-blue hover:text-white dark:hover:bg-tech-cyan dark:hover:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">PNG, SVG, JPG, WEBP</span>
                    </div>

                    {/* Direct Image URL input */}
                    <input
                      type="text"
                      placeholder="Or paste image URL (e.g. /brands/intel.svg or https://...)"
                      value={formData.logo}
                      onChange={e => setFormData({ ...formData, logo: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue font-mono transition-all"
                    />
                  </div>
                </div>

                {/* Preset Vector SVG Quick-Picker */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                  <div className="text-[11px] font-mono text-slate-500 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Quick Select Built-In Tier-1 Brand Logos:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1">
                    {PRESET_BRAND_LOGOS.map(preset => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            logo: preset.logo,
                            name: prev.name || preset.name,
                            slug: prev.slug || `brand_${preset.name.toLowerCase()}`
                          }));
                        }}
                        className={`px-2 py-1 rounded-md text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                          formData.logo === preset.logo
                            ? 'bg-tech-blue text-white border-tech-blue'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-tech-blue/50'
                        }`}
                      >
                        <img src={preset.logo} alt="" className="w-3.5 h-3.5 object-contain" />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tier & Specialization / Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Partnership Tier</label>
                  <select
                    value={formData.tier}
                    onChange={e => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue transition-all"
                  >
                    <option value="TIER_1">Tier-1 Direct OEM Partner</option>
                    <option value="TIER_2">Tier-2 Certified Distributor</option>
                    <option value="TIER_3">Tier-3 Regional Solution Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supply Scope / Hardware Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI Accelerators & GPUs"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue transition-all"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Official Website</label>
                <input
                  type="url"
                  placeholder="https://supermicro.com"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-tech-blue/20 focus:border-tech-blue transition-all"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="brandActiveToggle"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-tech-blue focus:ring-tech-blue"
                />
                <label htmlFor="brandActiveToggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Display in Tier-1 storefront supply chain marquee and active brand filters
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-tech-blue hover:bg-blue-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Brand & Image' : 'Save New Brand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Remove Brand Partner
                </h3>
                <p className="text-xs text-slate-500 font-mono">{isDeleting.name} ({isDeleting.slug})</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              {isDeleting.logo && (
                <div className="w-14 h-8 rounded-lg bg-white dark:bg-slate-900 p-1 flex items-center justify-center border border-slate-200 dark:border-slate-800 shrink-0">
                  <img src={isDeleting.logo} alt="" className="max-h-6 max-w-full object-contain" />
                </div>
              )}
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{isDeleting.name}</strong> from the GCC supply chain and brand catalog?
              </div>
            </div>

            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>This brand will be removed from the homepage marquee and catalog filters.</span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleting(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Deleting...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
