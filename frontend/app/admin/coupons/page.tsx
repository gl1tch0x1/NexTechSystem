'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Coupon } from '@/types';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  CheckCircle2,
  Sparkles,
  Percent,
  DollarSign
} from 'lucide-react';

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 10,
    minOrderAmount: 500,
    maxDiscountAmount: 1000,
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  });

  const fetchCoupons = async () => {
    if (!token) return;
    try {
      const data = await ApiClient.get<Coupon[]>('/admin/coupons', { token });
      setCoupons(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedCoupon(null);
    setFormError('');
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscountAmount: 1000,
      endDate: '2026-12-31T23:59:59Z',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Coupon) => {
    setIsEditing(true);
    setSelectedCoupon(c);
    setFormError('');
    setFormData({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount || 0,
      maxDiscountAmount: c.maxDiscountAmount || 1000,
      endDate: c.endDate || '2026-12-31T23:59:59Z',
      isActive: c.isActive !== false,
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
        code: formData.code.toUpperCase().trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount),
        maxDiscountAmount: Number(formData.maxDiscountAmount),
        startDate: new Date().toISOString(),
        endDate: formData.endDate,
        isActive: formData.isActive,
      };

      if (isEditing && selectedCoupon) {
        await ApiClient.put(`/admin/coupons/${selectedCoupon.id}`, payload, { token });
      } else {
        await ApiClient.post('/admin/coupons', payload, { token });
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await ApiClient.delete(`/admin/coupons/${id}`, { token });
      setIsDeleting(null);
      fetchCoupons();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon.');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1">
            Marketing & Promotional Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Discount Coupons & Promo Codes
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Create percentage or fixed price promotions, set minimum spend thresholds, and manage redemption limits.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Coupon</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search coupon codes (e.g. TECH10, SUMMER50)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold">
          {coupons.length} Active Promos
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.length > 0 ? (
          filteredCoupons.map(coupon => (
            <div
              key={coupon.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 dark:hover:border-slate-700 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-mono font-black text-purple-600 dark:text-purple-300 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-500/30">
                  {coupon.code}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {coupon.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button
                    onClick={() => openEditModal(coupon)}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Edit Coupon"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsDeleting(coupon.id)}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Discount Benefit:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `${formatPrice(coupon.discountValue)} OFF`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Min. Order Spend:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{formatPrice(coupon.minOrderAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Redemption Count:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{coupon.usageCount || 0} uses</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Valid until:</span>
                <span className="font-mono text-slate-700 dark:text-slate-400">{formatDate(coupon.endDate || new Date().toISOString())}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No coupon promotions found.
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                {isEditing ? 'Edit Promotional Coupon' : 'Create New Promotional Coupon'}
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP20, FALL2026"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono uppercase transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  >
                    <option value="PERCENTAGE">Percentage (% Off)</option>
                    <option value="FIXED">Fixed Amount (د.إ Off)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.discountValue}
                    onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Min. Order Spend (د.إ)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">Max Discount Cap (د.إ)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={e => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono transition-all"
                  />
                </div>
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
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Coupon' : 'Issue Coupon'}
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
              Delete Coupon Confirmation
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete this discount coupon?
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

