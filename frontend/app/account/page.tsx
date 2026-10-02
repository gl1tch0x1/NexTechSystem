'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order, Address } from '@/types';
import { CustomerPortalHeader } from '@/components/account/CustomerPortalHeader';
import { AddressManagementModal } from '@/components/account/AddressManagementModal';
import {
  User,
  ShoppingBag,
  FileText,
  ShieldCheck,
  KeyRound,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Truck,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Check,
  Calendar,
  MapPin,
  Plus,
  Phone,
  Edit2,
  Cpu,
  PackageCheck,
  Heart
} from 'lucide-react';

type TabType = 'overview' | 'security' | 'settings';

function CustomerAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isAuthenticated, logout, refreshUser } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab State synced with URL query parameter
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'overview');

  useEffect(() => {
    if (tabParam && ['overview', 'security', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/account${query}`, { scroll: false });
  };

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Delete Account State & Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  // Load orders
  useEffect(() => {
    if (token) {
      setLoading(true);
      ApiClient.get<Order[]>('/orders/my', { token })
        .then((ordRes) => {
          setOrders(ordRes || []);
        })
        .catch(() => {
          setOrders([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Handle Profile Update (Name & Phone)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileSaving(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to update profile.');
      }

      await refreshUser();
      setProfileSuccess('Profile information updated successfully.');
      setEditingProfile(false);
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'An error occurred while saving profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Address Save (Add or Update)
  const handleSaveAddress = async (savedAddress: Address) => {
    const currentAddresses = user?.addresses || [];
    let updatedAddresses: Address[];

    const exists = currentAddresses.some(a => a.id === savedAddress.id);
    if (exists) {
      updatedAddresses = currentAddresses.map(a => {
        if (a.id === savedAddress.id) return savedAddress;
        return {
          ...a,
          isDefaultShipping: savedAddress.isDefaultShipping ? false : a.isDefaultShipping,
          isDefaultBilling: savedAddress.isDefaultBilling ? false : a.isDefaultBilling,
        };
      });
    } else {
      updatedAddresses = [
        ...currentAddresses.map(a => ({
          ...a,
          isDefaultShipping: savedAddress.isDefaultShipping ? false : a.isDefaultShipping,
          isDefaultBilling: savedAddress.isDefaultBilling ? false : a.isDefaultBilling,
        })),
        savedAddress,
      ];
    }

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        addresses: updatedAddresses,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || 'Failed to update delivery addresses.');
    }

    await refreshUser();
  };

  // Handle Address Deletion
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;
    const currentAddresses = user?.addresses || [];
    const updatedAddresses = currentAddresses.filter(a => a.id !== addressId);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          addresses: updatedAddresses,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to delete address.');
      }

      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Error deleting address');
    }
  };

  // Handle Set Default Address
  const handleSetDefaultAddress = async (addressId: string, type: 'shipping' | 'billing') => {
    const currentAddresses = user?.addresses || [];
    const updated = currentAddresses.map(a => {
      if (type === 'shipping') {
        return { ...a, isDefaultShipping: a.id === addressId };
      } else {
        return { ...a, isDefaultBilling: a.id === addressId };
      }
    });

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addresses: updated }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to update password.');
      }

      setPasswordSuccess('Password has been updated successfully. Your new credentials are now active.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'An unexpected error occurred while changing password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle permanent account deletion
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (!deleteConfirmation.trim()) {
      setDeleteError('Please enter your password or type DELETE to confirm.');
      return;
    }

    setDeleteLoading(true);
    try {
      const isDeleteWord = deleteConfirmation.trim() === 'DELETE';
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmation: isDeleteWord ? 'DELETE' : undefined,
          password: !isDeleteWord ? deleteConfirmation : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to delete account.');
      }

      setIsDeleteModalOpen(false);
      logout();
      router.push('/login?accountDeleted=true');
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred during account deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-tech-blue dark:text-tech-cyan mx-auto shadow-xl shadow-blue-500/10">
          <User className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Customer Account Access
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Please sign in to securely access your hardware orders, purchase invoices, saved delivery addresses, and account security.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 bg-tech-blue hover:bg-blue-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            Sign In to Customer Portal
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700"
          >
            Create New Account
          </Link>
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrders = orders.filter(
    o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );

  const passwordRequirements = [
    { label: 'Minimum 8 characters in length', met: newPassword.length >= 8 },
    { label: 'Contains at least one uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword) },
    { label: 'Contains at least one number or symbol', met: /[0-9!@#$%^&*]/.test(newPassword) },
    { label: 'Passwords match', met: newPassword.length > 0 && newPassword === confirmPassword },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Unified Portal Navigation & Profile Shell */}
      <CustomerPortalHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        totalOrdersCount={orders.length}
      />

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & ACTIVITY */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Card 1: Completed Orders */}
            <Link
              href="/account/orders"
              className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-tech-blue dark:hover:border-tech-blue shadow-xs hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Purchases</span>
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-slate-800 text-tech-blue dark:text-tech-cyan group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">{orders.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 group-hover:text-tech-blue transition-colors">
                <span>View itemized invoices</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Lifetime Spend */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider">Lifetime Spend</span>
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {formatPrice(totalSpent)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Includes UAE 5% VAT & GCC dispatch
              </div>
            </div>

            {/* Card 3: Active Shipments */}
            <Link
              href="/account/orders"
              className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 shadow-xs hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Shipments</span>
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {activeOrders.length}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeOrders.length > 0 ? 'Hardware in transit / processing' : 'All packages delivered'}
              </div>
            </Link>

            {/* Card 4: Saved Delivery Addresses */}
            <button
              type="button"
              onClick={() => handleTabChange('settings')}
              className="text-left group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-tech-cyan dark:hover:border-tech-cyan shadow-xs hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider">Saved Addresses</span>
                <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-slate-800 text-tech-cyan group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {user?.addresses?.length || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 group-hover:text-tech-cyan transition-colors">
                <span>Manage delivery locations</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Quick Actions Hub */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Customer Actions
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/products"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-tech-blue text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs hover:shadow flex flex-col gap-2"
              >
                <Cpu className="w-5 h-5 text-tech-blue dark:text-tech-cyan" />
                <span>Browse Hardware</span>
              </Link>
              <Link
                href="/pc-builder"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-tech-blue text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs hover:shadow flex flex-col gap-2"
              >
                <PackageCheck className="w-5 h-5 text-emerald-500" />
                <span>PC Builder Matrix</span>
              </Link>
              <button
                type="button"
                onClick={() => handleTabChange('settings')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-tech-blue text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs hover:shadow flex flex-col gap-2 text-left"
              >
                <MapPin className="w-5 h-5 text-purple-500" />
                <span>Manage Addresses</span>
              </button>
              <Link
                href="/account/wishlist"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-tech-blue text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs hover:shadow flex flex-col gap-2"
              >
                <Heart className="w-5 h-5 text-rose-500" />
                <span>Saved Wishlist</span>
              </Link>
            </div>
          </div>

          {/* Recent Orders Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-tech-blue dark:text-tech-cyan" />
                  Recent Purchases & Digital E-Bills
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track delivery progress, download itemized tax invoices, and review specifications
                </p>
              </div>
              {orders.length > 0 && (
                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-tech-blue dark:text-tech-cyan bg-blue-50 dark:bg-slate-800/80 hover:bg-blue-100 dark:hover:bg-slate-800 transition-colors w-fit"
                >
                  <span>View All {orders.length} Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-tech-blue" />
                <span>Loading your orders...</span>
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map(order => {
                  const statusColors: Record<string, string> = {
                    PENDING_APPROVAL: 'bg-amber-500/15 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700/60 ring-1 ring-amber-500/20',
                    DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
                    SHIPPED: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800/60',
                    PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
                    CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60',
                  };
                  const badgeClass = statusColors[order.orderStatus] || statusColors.PROCESSING;

                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all shadow-xs"
                    >
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-mono font-black text-slate-900 dark:text-white">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
                            {order.orderStatus === 'PENDING_APPROVAL' ? 'Pending to Approve' : order.orderStatus}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            via {order.paymentMethod || 'Credit Card / Wallet'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Placed on {formatDate(order.createdAt)}</span>
                          </span>
                          <span>•</span>
                          <span>{order.items?.length || 1} hardware item{(order.items?.length || 1) > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                        <div className="text-left md:text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Price</div>
                          <div className="text-base font-black text-slate-900 dark:text-white">
                            {formatPrice(order.total)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/orders/${order.id}/invoice`}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                            title="Official UAE FTA Tax Invoice"
                          >
                            <FileText className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
                            <span className="hidden sm:inline">Tax Invoice</span>
                          </Link>
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="px-4 py-2 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                          >
                            <span>E-Bill</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">No previous orders found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    You have not placed any orders yet. Discover cutting-edge enterprise hardware, servers, and custom PC builds.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    href="/products"
                    className="px-5 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    Browse Catalog
                  </Link>
                  <Link
                    href="/pc-builder"
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    Configure Custom PC
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY & PASSWORDS */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fadeIn max-w-3xl">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="space-y-1 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tech-blue dark:text-tech-cyan">
                <Lock className="w-4 h-4" />
                <span>Account Protection</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Change Account Password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update your account password regularly to ensure enterprise-grade security for your transactions.
              </p>
            </div>

            {/* Error & Success Feedback */}
            {passwordError && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-200 text-xs flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-700 dark:text-red-300">Unable to update password</div>
                  <div>{passwordError}</div>
                </div>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-200 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">Password Changed Successfully</div>
                  <div>{passwordSuccess}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter at least 8 characters"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-tech-blue transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Checklist */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Password Strength Requirements
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {passwordRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />
                      )}
                      <span className={req.met ? 'text-slate-900 dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full sm:w-auto px-7 py-3 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Security Credentials...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Save New Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADDRESSES & PROFILE SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-fadeIn max-w-4xl">
          {/* Profile Details Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Client Profile Information</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Personal and contact details linked to your NexTech account
                </p>
              </div>

              {!editingProfile && (
                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {profileSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{profileError}</span>
              </div>
            )}

            {editingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={e => setProfilePhone(e.target.value)}
                      required
                      placeholder="+971 50 123 4567"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileName(user?.name || '');
                      setProfilePhone(user?.phone || '');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-tech-blue hover:bg-blue-600 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || 'Customer'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.email}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Phone</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{user?.phone || 'Not set'}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dispatch Region</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">UAE / GCC Hub</div>
                </div>
              </div>
            )}
          </div>

          {/* Complete Address Book Manager */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-tech-blue dark:text-tech-cyan" />
                  Delivery & Invoicing Address Book
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage primary delivery destinations for rapid hardware checkout and FTA compliant invoices
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-tech-blue hover:bg-blue-600 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Address</span>
              </button>
            </div>

            {user?.addresses && user.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map(addr => (
                  <div
                    key={addr.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 relative space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          {addr.fullName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{addr.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddress(addr);
                            setIsAddressModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-tech-blue hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5 leading-relaxed">
                      <div>{addr.addressLine1}</div>
                      {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                      <div>
                        {addr.city}, {addr.state}, {addr.country} {addr.postalCode ? `• ${addr.postalCode}` : ''}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                      {addr.isDefaultShipping ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-tech-blue dark:text-tech-cyan border border-blue-200 dark:border-blue-900/60">
                          Default Shipping
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id, 'shipping')}
                          className="text-[11px] text-slate-500 hover:text-tech-blue dark:hover:text-tech-cyan underline font-medium"
                        >
                          Set default shipping
                        </button>
                      )}

                      {addr.isDefaultBilling ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                          Default Billing
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id, 'billing')}
                          className="text-[11px] text-slate-500 hover:text-tech-blue dark:hover:text-tech-cyan underline font-medium"
                        >
                          Set default billing
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <MapPin className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">No delivery addresses registered</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Add your warehouse, office, or residential address for expedited UAE and GCC logistics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-tech-blue text-white text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Add First Address
                </button>
              </div>
            )}
          </div>

          {/* Danger Zone: Permanent Account Deletion */}
          <div className="p-6 sm:p-8 rounded-3xl bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-500/30 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">
                  Danger Zone
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Permanently Delete Account</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Permanently remove your NexTech customer account, purchase invoices, delivery addresses, and personal credentials.
                  Once deleted, this action cannot be recovered or undone.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmation('');
                  setDeleteError(null);
                  setIsDeleteModalOpen(true);
                }}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-950/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Management Modal */}
      <AddressManagementModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        initialAddress={editingAddress}
      />

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900 dark:text-white">Delete Account Permanently?</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  This action is irreversible. All your order history and profile details will be completely purged from our database.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
                {deleteError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To confirm permanent deletion, enter your current password (or type <span className="font-mono text-red-500 dark:text-red-400">DELETE</span> if signed in with Google):
              </label>
              <input
                type="password"
                value={deleteConfirmation}
                onChange={e => setDeleteConfirmation(e.target.value)}
                placeholder="Enter your password or DELETE"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading || !deleteConfirmation.trim()}
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2 shadow-lg shadow-red-950/20 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Deletion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerAccountDashboard() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading Account Dashboard...</div>}>
      <CustomerAccountContent />
    </Suspense>
  );
}
