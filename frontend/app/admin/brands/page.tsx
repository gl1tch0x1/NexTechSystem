'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function AdminBrandsPage() {
  const { token } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo: '',
    tier: 'TIER_1',
    description: '',
    website: '',
  });

  const fetchBrands = async () => {
    if (!token) return;
    try {
      const data = await ApiClient.get<Brand[]>('/admin/brands', { token });
      setBrands(data || []);
    } catch (err) {
      console.error(err);
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
    setFormData({
      name: '',
      slug: '',
      logo: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=200&q=80',
      tier: 'TIER_1',
      description: '',
      website: 'https://',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setIsEditing(true);
    setSelectedBrand(brand);
    setFormError('');
    setFormData({
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo || '',
      tier: brand.tier || 'TIER_1',
      description: brand.description || '',
      website: brand.website || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        logo: formData.logo,
        tier: formData.tier,
        description: formData.description,
        website: formData.website,
      };

      if (isEditing && selectedBrand) {
        await ApiClient.put(`/admin/brands/${selectedBrand.id}`, payload, { token });
      } else {
        await ApiClient.post('/admin/brands', payload, { token });
      }

      setIsModalOpen(false);
      fetchBrands();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await ApiClient.delete(`/admin/brands/${id}`, { token });
      setIsDeleting(null);
      fetchBrands();
    } catch (err: any) {
      alert(err.message || 'Failed to delete brand.');
    }
  };

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Authorized Hardware Manufacturers
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Brands & Vendor Partnerships
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Manage Tier-1 original equipment manufacturers, partner logos, and official warranty tiers.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Brand</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search manufacturer brands by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold">
          {brands.length} Verified Brands
        </div>
      </div>

      {/* Brands Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBrands.length > 0 ? (
          filteredBrands.map(brand => (
            <div
              key={brand.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 dark:hover:border-slate-700 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center shrink-0">
                    <img
                      src={brand.logo || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                      alt={brand.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{brand.name}</h3>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">{brand.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(brand)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Edit Brand"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsDeleting(brand.id)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Delete Brand"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {brand.description || 'Tier-1 authorized technology manufacturer and distribution partner.'}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  {brand.tier || 'TIER_1'}
                </span>
                {brand.website && (
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-tech-cyan hover:underline flex items-center gap-1 text-[11px] font-bold"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No brand records match your search.
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                {isEditing ? 'Edit Brand' : 'Create New Brand Record'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-900/50">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supermicro"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Slug Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. brand_supermicro"
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Tier Level</label>
                  <select
                    value={formData.tier}
                    onChange={e => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  >
                    <option value="TIER_1">TIER 1 (Global Partner)</option>
                    <option value="TIER_2">TIER 2 (Certified Distributor)</option>
                    <option value="TIER_3">TIER 3 (Regional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Logo URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.logo}
                  onChange={e => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Official Website</label>
                <input
                  type="url"
                  placeholder="https://supermicro.com"
                  value={formData.website}
                  onChange={e => setFormData({ ...formData, website: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Enterprise rack server and blade computing manufacturer..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-purple-600/20 transition-all"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Brand' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Delete Brand Confirmation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this manufacturer brand?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(isDeleting)}
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

