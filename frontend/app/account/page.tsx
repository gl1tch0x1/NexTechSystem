'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Order } from '@/types';
import {
  User,
  ShoppingBag,
  Heart,
  FileText,
  ShieldCheck,
  KeyRound,
  Trash2,
  AlertTriangle,
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
  Mail,
  UserCheck
} from 'lucide-react';

type TabType = 'overview' | 'security' | 'settings';

export default function CustomerAccountDashboard() {
  const router = useRouter();
  const { user, token, isAuthenticated, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  // Delete Account State & Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      ApiClient.get<Order[]>('/orders/my', { token })
        .then(ordRes => {
          setOrders(ordRes || []);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

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
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-tech-cyan mx-auto shadow-lg shadow-cyan-950/20">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Customer Account Access</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            Please sign in to securely access your hardware orders, purchase invoices, and personal security settings.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-6 py-3 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-tech"
          >
            Sign In to Account
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-700"
          >
            Create an Account
          </Link>
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 4);
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOrders = orders.filter(
    o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );

  const passwordRequirements = [
    { label: 'Minimum 8 characters in length', met: newPassword.length >= 8 },
    { label: 'Contains at least one uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword) },
    { label: 'Contains at least one number or special symbol', met: /[0-9!@#$%^&*]/.test(newPassword) },
    { label: 'Passwords match', met: newPassword.length > 0 && newPassword === confirmPassword },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-tech-dark via-slate-900 to-tech-slate border border-slate-700 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-tech">
        <div className="space-y-3">
          {/* Replaced raw ID with verified client badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Verified Customer Account • UAE Region</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || 'Valued Client'}!
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-tech-cyan" />
              <span>{user?.email}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">NexTech Enterprise Commerce Portal</span>
            </p>
          </div>
        </div>

        {/* Quick Portal Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'security'
                ? 'bg-tech-blue text-white border-tech-blue shadow-tech'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4 text-tech-cyan" />
            <span>Change Password</span>
          </button>
          <Link
            href="/account/orders"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-tech-cyan" />
            <span>Order History</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-tech-cyan border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Overview & Orders</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-950 text-slate-300">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-slate-800 text-tech-cyan border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-tech-cyan border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Profile & Account Settings</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ORDERS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Quick Metrics Grid (No Wallet Credits) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Orders */}
            <Link
              href="/account/orders"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-tech-blue hover:shadow-lg hover:shadow-blue-950/20 transition-all group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Total Purchases</span>
                <div className="p-2 rounded-xl bg-slate-800 text-tech-cyan group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">{orders.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Lifetime completed orders</div>
            </Link>

            {/* Card 2: Total Spend */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Lifetime Spend</span>
                <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">{formatPrice(totalSpent)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Includes UAE VAT & GCC logistics</div>
            </div>

            {/* Card 3: Active Shipments (Replaced Wallet Credits) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Active Shipments</span>
                <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">{activeOrders.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {activeOrders.length > 0 ? 'Orders in transit / processing' : 'All packages delivered'}
              </div>
            </div>

            {/* Card 4: Wishlist */}
            <Link
              href="/account/wishlist"
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-950/20 transition-all group"
            >
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">Saved Wishlist</span>
                <div className="p-2 rounded-xl bg-slate-800 text-red-500 group-hover:scale-110 transition-transform">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white">View Saved</div>
              <div className="text-[11px] text-slate-400 mt-1">High-performance components</div>
            </Link>
          </div>

          {/* Recent Orders Section */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-tech-cyan" />
                  Recent Purchases & Digital E-Bills
                </h3>
                <p className="text-xs text-slate-400">View real-time delivery status and itemized tax invoices</p>
              </div>
              {orders.length > 0 && (
                <Link
                  href="/account/orders"
                  className="text-xs font-bold text-tech-cyan hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>View All Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map(order => {
                  const statusColors: Record<string, string> = {
                    DELIVERED: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60',
                    SHIPPED: 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60',
                    PROCESSING: 'bg-blue-950/50 text-blue-300 border-blue-800/60',
                    PENDING: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
                    CANCELLED: 'bg-red-950/50 text-red-300 border-red-800/60',
                  };
                  const badgeClass = statusColors[order.orderStatus] || statusColors.PROCESSING;

                  return (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-white tracking-wide">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>Placed on {formatDate(order.createdAt)}</span>
                          <span>•</span>
                          <span>{order.items?.length || 1} hardware item{(order.items?.length || 1) > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-500">Order Amount</div>
                          <div className="text-sm font-extrabold text-white">
                            {formatPrice(order.total)}
                          </div>
                        </div>
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="px-4 py-2 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-1.5 shadow-tech"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No previous orders found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    You have not placed any orders yet. Discover cutting-edge enterprise components and custom workstations.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    href="/products"
                    className="px-5 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-tech"
                  >
                    Browse Hardware Catalog
                  </Link>
                  <Link
                    href="/pc-builder"
                    className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                  >
                    Configure Custom PC
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 max-w-2xl space-y-6">
            <div className="space-y-1 pb-4 border-b border-slate-800">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tech-cyan">
                <Lock className="w-4 h-4" />
                <span>Account Protection</span>
              </div>
              <h3 className="text-xl font-black text-white">Change Account Password</h3>
              <p className="text-xs text-slate-400">
                Update your account password regularly to ensure enterprise-grade protection for your purchases.
              </p>
            </div>

            {/* Error & Success Feedback */}
            {passwordError && (
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-300">Unable to update password</div>
                  <div>{passwordError}</div>
                </div>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-300">Password Changed Successfully</div>
                  <div>{passwordSuccess}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tech-blue transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter at least 8 characters"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tech-blue transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-tech-blue transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Password Strength Requirements
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {passwordRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {req.met ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                      )}
                      <span className={req.met ? 'text-slate-200' : 'text-slate-500'}>
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
                className="w-full sm:w-auto px-6 py-3 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-tech flex items-center justify-center gap-2 disabled:opacity-60"
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

      {/* TAB 3: PROFILE & ACCOUNT SETTINGS (WITH DANGER ZONE) */}
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-fadeIn max-w-3xl">
          {/* Profile Details Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="space-y-1 pb-4 border-b border-slate-800">
              <h3 className="text-xl font-black text-white">Client Information</h3>
              <p className="text-xs text-slate-400">Personal details registered with your NexTech membership</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</div>
                <div className="text-sm font-bold text-white">{user?.name || 'Customer'}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</div>
                <div className="text-sm font-bold text-white">{user?.email}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Role</div>
                <div className="text-sm font-bold text-emerald-400 capitalize">
                  {user?.role?.toLowerCase() || 'Verified Customer'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Region & Dispatch</div>
                <div className="text-sm font-bold text-white">GCC / United Arab Emirates</div>
              </div>
            </div>
          </div>

          {/* Danger Zone: Permanent Account Deletion */}
          <div className="p-6 sm:p-8 rounded-3xl bg-red-950/10 border border-red-500/30 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300">
                  Danger Zone
                </div>
                <h3 className="text-lg font-black text-white">Permanently Delete Account</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permanently remove your NexTech customer account, order history, delivery addresses, and personal credentials.
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
                className="px-5 py-3 rounded-xl bg-red-600/90 text-white text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-950/30"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-white">Delete Account Permanently?</h4>
                <p className="text-xs text-slate-400">
                  This action is irreversible. All your order history and profile details will be completely purged from our database.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
                {deleteError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                To confirm permanent deletion, enter your current password or type <span className="font-mono text-red-400">DELETE</span>:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={e => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE or your password"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading || !deleteConfirmation.trim()}
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2 shadow-lg shadow-red-950/30 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Permanent Deletion</span>
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
