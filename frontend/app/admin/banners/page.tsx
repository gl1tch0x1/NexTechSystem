'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { Banner } from '@/types';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function AdminBannersPage() {
  const { token } = useAuth();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badgeText: 'NEW LAUNCH',
    link: '/products',
    buttonText: 'Shop Enterprise Hardware',
    image: '',
    isActive: true,
  });

  const fetchBanners = async () => {
    if (!token) return;
    try {
      const data = await ApiClient.get<Banner[]>('/admin/banners', { token });
      setBanners(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [token]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedBanner(null);
    setFormError('');
    setFormData({
      title: '',
      subtitle: '',
      badgeText: 'FLAGSHIP LAUNCH',
      link: '/products',
      buttonText: 'Explore Hardware',
      image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=80',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setIsEditing(true);
    setSelectedBanner(b);
    setFormError('');
    setFormData({
      title: b.title,
      subtitle: b.subtitle || '',
      badgeText: b.badgeText || '',
      link: b.link || '/products',
      buttonText: b.buttonText || 'Shop Now',
      image: b.image || '',
      isActive: b.isActive !== false,
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
        title: formData.title,
        subtitle: formData.subtitle,
        badgeText: formData.badgeText,
        link: formData.link,
        buttonText: formData.buttonText,
        image: formData.image,
        isActive: formData.isActive,
      };

      if (isEditing && selectedBanner) {
        await ApiClient.put(`/admin/banners/${selectedBanner.id}`, payload, { token });
      } else {
        await ApiClient.post('/admin/banners', payload, { token });
      }

      setIsModalOpen(false);
      fetchBanners();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save banner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await ApiClient.delete(`/admin/banners/${id}`, { token });
      setIsDeleting(null);
      fetchBanners();
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner.');
    }
  };

  const filteredBanners = banners.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.subtitle && b.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Storefront Media & Highlights
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Storefront Hero Banners & Announcements
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure rotating hero banners, promotional callouts, and seasonal hardware announcements.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Banner</span>
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBanners.length > 0 ? (
          filteredBanners.map(banner => (
            <div
              key={banner.id}
              className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between hover:border-purple-500/40 dark:hover:border-slate-700 transition-all"
            >
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-600 text-white uppercase tracking-wider shadow">
                      {banner.badgeText || 'PROMO'}
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur p-1 rounded-xl">
                      <button
                        onClick={() => openEditModal(banner)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-purple-400 cursor-pointer"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsDeleting(banner.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-red-400 cursor-pointer"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-black text-white text-lg tracking-tight">{banner.title}</h3>
                    <p className="text-xs text-slate-200 line-clamp-1">{banner.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-mono">Target: {banner.link || '/products'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No promotional banners configured.
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                {isEditing ? 'Edit Storefront Banner' : 'Create New Storefront Banner'}
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Enterprise AI Workstations"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Subtitle / Callout</label>
                <input
                  type="text"
                  placeholder="e.g. Powered by Intel Core i9 14900K and NVIDIA RTX 4090"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. LIMITED OFFER"
                    value={formData.badgeText}
                    onChange={e => setFormData({ ...formData, badgeText: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Target URL</label>
                  <input
                    type="text"
                    placeholder="/products?category=cat_components"
                    value={formData.link}
                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Background Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
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
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Banner' : 'Create Banner'}
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
              Delete Banner Confirmation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this promotional banner?
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

