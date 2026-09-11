'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Coupon, StoreSettings, Category, Brand } from '@/types';
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
  DollarSign,
  Eye,
  EyeOff,
  Sliders,
  Check,
  ArrowRight,
  BadgePercent,
  ShieldCheck,
  Calendar,
  Layers,
  Copy,
  AlertCircle
} from 'lucide-react';

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Landing page banner toggle states
  const [isBannerActive, setIsBannerActive] = useState(true);
  const [featuredCode, setFeaturedCode] = useState('TECH10');
  const [isSavingBannerSettings, setIsSavingBannerSettings] = useState(false);
  const [bannerSaveSuccess, setBannerSaveSuccess] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Rich Detailed Form
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    badgeText: 'GCC Direct Enterprise Promotion',
    description: 'Apply this verified promotional voucher at checkout or wallet settlement to receive an instant margin deduction on all workstations, processors, and rack servers.',
    ctaText: 'Apply to Catalog',
    ctaLink: '/products',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 10,
    minOrderAmount: 1000,
    maxDiscountAmount: 500,
    usageLimit: 1000,
    perUserLimit: 1,
    customerEligibility: 'ALL' as 'ALL' | 'B2B_ONLY' | 'VIP_ONLY',
    applicableCategoryId: '',
    applicableBrandId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    showOnLandingPage: true,
    isActive: true,
  });

  const fetchData = async () => {
    if (!token) return;
    try {
      const [couponsData, settingsData, catData, brandData] = await Promise.allSettled([
        ApiClient.get<Coupon[]>('/admin/coupons', { token }),
        ApiClient.get<StoreSettings>('/admin/settings', { token }),
        ApiClient.get<Category[]>('/products/categories'),
        ApiClient.get<Brand[]>('/products/brands'),
      ]);

      if (couponsData.status === 'fulfilled' && couponsData.value) {
        setCoupons(couponsData.value);
      }

      if (settingsData.status === 'fulfilled' && settingsData.value) {
        setSettings(settingsData.value);
        setIsBannerActive(settingsData.value.isLandingDiscountBannerActive !== false);
        setFeaturedCode(settingsData.value.featuredLandingCouponCode || 'TECH10');
      }

      if (catData.status === 'fulfilled' && catData.value) {
        setCategories(catData.value);
      }

      if (brandData.status === 'fulfilled' && brandData.value) {
        setBrands(brandData.value);
      }
    } catch (err) {
      console.error('Error loading coupon admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Save Landing Page Banner Settings
  const handleToggleLandingBanner = async (newActiveState: boolean, newFeaturedCode?: string) => {
    if (!token) return;
    setIsSavingBannerSettings(true);
    const codeToUse = newFeaturedCode !== undefined ? newFeaturedCode : featuredCode;

    try {
      await ApiClient.put(
        '/admin/settings',
        {
          isLandingDiscountBannerActive: newActiveActiveState(newActiveState),
          featuredLandingCouponCode: codeToUse,
        },
        { token }
      );

      setIsBannerActive(newActiveState);
      if (newFeaturedCode !== undefined) {
        setFeaturedCode(newFeaturedCode);
      }

      setBannerSaveSuccess(true);
      setTimeout(() => setBannerSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error('Failed to update landing banner settings:', err);
      alert(err.message || 'Failed to update landing discount banner settings.');
    } finally {
      setIsSavingBannerSettings(false);
    }
  };

  const newActiveActiveState = (state: boolean) => state;

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedCoupon(null);
    setFormError('');
    setFormData({
      code: '',
      title: '',
      badgeText: 'GCC Direct Enterprise Promotion',
      description: 'Apply this verified promotional voucher at checkout or wallet settlement to receive an instant margin deduction on all workstations, processors, and rack servers.',
      ctaText: 'Apply to Catalog',
      ctaLink: '/products',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 1000,
      maxDiscountAmount: 500,
      usageLimit: 1000,
      perUserLimit: 1,
      customerEligibility: 'ALL',
      applicableCategoryId: '',
      applicableBrandId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      showOnLandingPage: coupons.length === 0,
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
      title: c.title || '',
      badgeText: c.badgeText || 'GCC Direct Enterprise Promotion',
      description: c.description || 'Apply this verified promotional voucher at checkout or wallet settlement to receive an instant margin deduction on all workstations, processors, and rack servers.',
      ctaText: c.ctaText || 'Apply to Catalog',
      ctaLink: c.ctaLink || '/products',
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount || 0,
      maxDiscountAmount: c.maxDiscountAmount || 500,
      usageLimit: c.usageLimit || 1000,
      perUserLimit: c.perUserLimit || 1,
      customerEligibility: c.customerEligibility || 'ALL',
      applicableCategoryId: c.applicableCategoryIds?.[0] || '',
      applicableBrandId: c.applicableBrandIds?.[0] || '',
      startDate: c.startDate ? c.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: c.endDate ? c.endDate.split('T')[0] : '2026-12-31',
      showOnLandingPage: c.showOnLandingPage || c.code === featuredCode,
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
      const payload: Partial<Coupon> = {
        code: formData.code.toUpperCase().trim(),
        title: formData.title.trim() || undefined,
        badgeText: formData.badgeText.trim() || 'GCC Direct Enterprise Promotion',
        description: formData.description.trim(),
        ctaText: formData.ctaText.trim() || 'Apply to Catalog',
        ctaLink: formData.ctaLink.trim() || '/products',
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount),
        maxDiscountAmount: Number(formData.maxDiscountAmount),
        usageLimit: Number(formData.usageLimit) || 1000,
        perUserLimit: Number(formData.perUserLimit) || 1,
        customerEligibility: formData.customerEligibility,
        applicableCategoryIds: formData.applicableCategoryId ? [formData.applicableCategoryId] : [],
        applicableBrandIds: formData.applicableBrandId ? [formData.applicableBrandId] : [],
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(`${formData.endDate}T23:59:59Z`).toISOString(),
        showOnLandingPage: formData.showOnLandingPage,
        isActive: formData.isActive,
      };

      if (isEditing && selectedCoupon) {
        await ApiClient.put(`/admin/coupons/${selectedCoupon.id}`, payload, { token });
      } else {
        await ApiClient.post('/admin/coupons', payload, { token });
      }

      // If marked to show on landing page, also update featuredLandingCouponCode
      if (formData.showOnLandingPage) {
        await handleToggleLandingBanner(true, payload.code);
      }

      setIsModalOpen(false);
      fetchData();
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
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon.');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Active coupon currently featured in preview
  const currentFeaturedCoupon = coupons.find(c => c.code === featuredCode) || coupons[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-mono uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Marketing & Promotional Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Discount Coupons & Landing Promotions
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Configure enterprise discount vouchers, set redemption caps, and toggle the prominent promotional discount banner displayed on the landing page.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Detailed Coupon</span>
        </button>
      </div>

      {/* 1. MASTER LANDING PAGE DISCOUNT BANNER CONTROL CARD */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 shadow-md ${
              isBannerActive
                ? 'bg-purple-600 text-white shadow-purple-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <BadgePercent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Landing Page Promotional Discount Banner
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isBannerActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                }`}>
                  {isBannerActive ? '● DISPLAYED ON HOMEPAGE' : '○ DISABLED / HIDDEN'}
                </span>
                {bannerSaveSuccess && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-fadeIn flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Controls the live promotional coupon section displayed on the landing page between the Brand Marquee and Hardware Matrix.
              </p>
            </div>
          </div>

          {/* Controls: Master Switch & Featured Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 pl-2">Voucher:</span>
              <select
                value={featuredCode}
                onChange={e => handleToggleLandingBanner(isBannerActive, e.target.value)}
                disabled={isSavingBannerSettings || coupons.length === 0}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {coupons.map(c => (
                  <option key={c.id} value={c.code}>
                    {c.code} ({c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `AED ${c.discountValue}`})
                  </option>
                ))}
              </select>
            </div>

            {/* Master Toggle Button */}
            <button
              type="button"
              disabled={isSavingBannerSettings}
              onClick={() => handleToggleLandingBanner(!isBannerActive)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                isBannerActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isBannerActive ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Banner Enabled</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Banner Disabled</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Visual Preview of Landing Page Banner */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>Live Customer Preview (Landing Page):</span>
            <span>{isBannerActive ? 'Visibility: Published' : 'Visibility: Hidden'}</span>
          </div>

          <div className={`transition-opacity duration-300 ${isBannerActive ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
            <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-blue-600/10 via-purple-600/15 to-tech-cyan/10 border border-purple-500/30 shadow-sm">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-tech-blue text-white flex items-center justify-center shadow-lg shadow-tech-blue/25 shrink-0">
                    <BadgePercent className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{currentFeaturedCoupon?.badgeText || 'GCC Direct Enterprise Promotion'}</span>
                    </div>
                    <h4 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentFeaturedCoupon?.title || `Save ${currentFeaturedCoupon?.discountType === 'PERCENTAGE' ? `${currentFeaturedCoupon.discountValue}%` : `AED ${currentFeaturedCoupon?.discountValue || 100}`} on Enterprise Orders Over AED ${currentFeaturedCoupon?.minOrderAmount || 1000}`}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                      {currentFeaturedCoupon?.description || 'Apply this verified promotional voucher at checkout or wallet settlement to receive an instant margin deduction on all workstations, processors, and rack servers.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-600 font-mono font-black text-slate-900 dark:text-white text-sm shadow-sm">
                    <span className="text-purple-600 dark:text-purple-400 text-base tracking-wider">{currentFeaturedCoupon?.code || 'TECH10'}</span>
                    <Copy className="w-4 h-4 text-purple-600 dark:text-purple-400 opacity-60" />
                  </div>

                  <div className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5">
                    <span>{currentFeaturedCoupon?.ctaText || 'Apply to Catalog'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & TOTAL ACTIVE PROMOS */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search coupon codes or promotional campaigns..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold flex items-center gap-2">
          <span>{filteredCoupons.length} Active System Coupons</span>
        </div>
      </div>

      {/* 3. COUPONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCoupons.length > 0 ? (
          filteredCoupons.map(coupon => {
            const isCurrentlyOnLanding = isBannerActive && featuredCode === coupon.code;
            return (
              <div
                key={coupon.id}
                className={`p-5 rounded-3xl bg-white dark:bg-slate-900/80 border transition-all space-y-4 shadow-sm relative flex flex-col justify-between ${
                  isCurrentlyOnLanding
                    ? 'border-purple-500 shadow-purple-500/10 dark:border-purple-500/60'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-mono font-black text-purple-600 dark:text-purple-300 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-500/30">
                      {coupon.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isCurrentlyOnLanding && (
                        <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                          HOMEPAGE BANNER
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        coupon.isActive !== false
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                      }`}>
                        {coupon.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <button
                        onClick={() => openEditModal(coupon)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsDeleting(coupon.id)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {coupon.title && (
                    <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                      {coupon.title}
                    </h4>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Discount Benefit:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `AED ${coupon.discountValue} OFF`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Min. Order Spend:</span>
                      <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{formatPrice(coupon.minOrderAmount || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Max Discount Cap:</span>
                      <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">{coupon.maxDiscountAmount ? formatPrice(coupon.maxDiscountAmount) : 'No Cap'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Redemption Pool:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {coupon.usageCount || 0} / {coupon.usageLimit || '∞'} uses
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Eligibility:</span>
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {coupon.customerEligibility === 'B2B_ONLY' ? 'B2B Enterprise Only' : coupon.customerEligibility === 'VIP_ONLY' ? 'VIP Accounts Only' : 'All Customers'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Valid until:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-400">{formatDate(coupon.endDate || new Date().toISOString())}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No coupon promotions found.
          </div>
        )}
      </div>

      {/* 4. CREATE / EDIT DETAILED COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    {isEditing ? 'Edit Promotional Coupon Parameters' : 'Create Detailed Promotional Coupon'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set precise pricing reductions, target catalog scopes, and landing page appearance.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-900/50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* SECTION A: IDENTIFICATION & BANNER COPY */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. Voucher Identity & Landing Banner Copy</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TECH10, VIP25, ENTERPRISE50"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono uppercase font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Campaign Badge Text</label>
                    <input
                      type="text"
                      placeholder="e.g. GCC Direct Enterprise Promotion"
                      value={formData.badgeText}
                      onChange={e => setFormData({ ...formData, badgeText: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Promotional Headline / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Save 10% on Enterprise Orders Over AED 1000"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Promotional Terms / Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Details and eligible categories for this voucher..."
                    className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CTA Button Label</label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CTA Target Link</label>
                    <input
                      type="text"
                      value={formData.ctaLink}
                      onChange={e => setFormData({ ...formData, ctaLink: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: PRICING & BENEFIT CALCULATION */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-tech-blue dark:text-cyan-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  <span>2. Pricing Benefit & Financial Guardrails</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Discount Mode</label>
                    <select
                      value={formData.discountType}
                      onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer font-bold"
                    >
                      <option value="PERCENTAGE">Percentage Reduction (% Off)</option>
                      <option value="FIXED">Fixed Amount Voucher (AED Off)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Discount Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(AED)'} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.discountValue}
                      onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Min. Order Spend (AED)</label>
                    <input
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Discount Cap (AED)</label>
                    <input
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={e => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: QUOTAS & ELIGIBILITY */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>3. Quotas, Eligibility & Scope</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Pool Redemptions</label>
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      placeholder="e.g. 1000"
                      className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Limit Per Customer</label>
                    <input
                      type="number"
                      value={formData.perUserLimit}
                      onChange={e => setFormData({ ...formData, perUserLimit: Number(e.target.value) })}
                      placeholder="e.g. 1"
                      className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Eligibility</label>
                    <select
                      value={formData.customerEligibility}
                      onChange={e => setFormData({ ...formData, customerEligibility: e.target.value as any })}
                      className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="ALL">All Registered Customers</option>
                      <option value="B2B_ONLY">B2B Enterprise Accounts Only</option>
                      <option value="VIP_ONLY">VIP Accounts Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Applicable Category</label>
                    <select
                      value={formData.applicableCategoryId}
                      onChange={e => setFormData({ ...formData, applicableCategoryId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">All Hardware Categories (Storewide)</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Applicable Brand</label>
                    <select
                      value={formData.applicableBrandId}
                      onChange={e => setFormData({ ...formData, applicableBrandId: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">All Manufacturer Brands</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION D: SCHEDULE & LANDING PROMOTION */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>4. Validity Schedule & Landing Visibility</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End / Expiry Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.showOnLandingPage}
                      onChange={e => setFormData({ ...formData, showOnLandingPage: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Display as Featured Banner on Landing Page
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Coupon Active
                    </span>
                  </label>
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Saving Coupon...' : isEditing ? 'Update Coupon' : 'Publish Detailed Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION MODAL */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Delete Coupon Confirmation</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to permanently delete this promotional coupon? Customers will no longer be able to claim or apply this discount code.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-200"
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
