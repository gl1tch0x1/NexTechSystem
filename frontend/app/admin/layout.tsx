'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  LayoutDashboard,
  Package,
  Store,
  Users,
  ShoppingBag,
  Tag,
  ShieldCheck,
  Layers,
  Award,
  Image as ImageIcon,
  Sliders,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  Server,
  BarChart3,
  Menu,
  X,
  FileText,
  KeyRound,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, token, logout, refreshUser, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Admin Credentials Modal State
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [credentialsToast, setCredentialsToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [isLoading, user, role, router]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' GST');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const navSections = [
    {
      title: 'OVERVIEW & CORE',
      items: [
        { href: '/admin', label: 'Command Center', icon: LayoutDashboard },
        { href: '/admin/analytics', label: 'Sales & Purchase Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'SALES & PROCUREMENT',
      items: [
        { href: '/admin/orders', label: 'Customer Sales Orders', icon: ShoppingBag },
        { href: '/admin/quotes', label: 'B2B Quotes Engine', icon: FileText },
        { href: '/admin/purchase-orders', label: 'Supplier Purchase Orders', icon: Server },
        { href: '/admin/customers', label: 'Customers & Wallets', icon: Users },
        { href: '/admin/resellers', label: 'Reseller Network', icon: Store },
      ],
    },
    {
      title: 'CATALOG & INVENTORY',
      items: [
        { href: '/admin/products', label: 'Hardware Products', icon: Package },
        { href: '/admin/categories', label: 'Categories Taxonomy', icon: Layers },
        { href: '/admin/brands', label: 'Brands & Vendors', icon: Award },
      ],
    },
    {
      title: 'MARKETING & CMS',
      items: [
        { href: '/admin/coupons', label: 'Discount Coupons', icon: Tag },
        { href: '/admin/banners', label: 'Storefront Banners', icon: ImageIcon },
        { href: '/admin/cms', label: 'Storefront CMS & Content', icon: Sliders },
      ],
    },
  ];

  const handleOpenCredentialsModal = () => {
    setNewUsername(user?.username || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCredentialsToast(null);
    setCredentialsModalOpen(true);
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsToast(null);

    const trimmedUsername = newUsername.trim();
    const trimmedNewPass = newPassword.trim();
    const trimmedCurrentPass = currentPassword.trim();
    const currentUsername = user?.username || '';

    const isUpdatingUsername = trimmedUsername && trimmedUsername !== currentUsername;
    const isUpdatingPassword = !!trimmedNewPass;

    if (!isUpdatingUsername && !isUpdatingPassword) {
      setCredentialsToast({
        type: 'error',
        message: 'No changes detected. Enter a new username or new password to update.',
      });
      return;
    }

    if (isUpdatingUsername && trimmedUsername.length < 3) {
      setCredentialsToast({
        type: 'error',
        message: 'Username must be at least 3 characters long.',
      });
      return;
    }

    if (isUpdatingPassword) {
      if (!trimmedCurrentPass) {
        setCredentialsToast({
          type: 'error',
          message: 'Current password is required to set a new password.',
        });
        return;
      }
      if (trimmedNewPass.length < 6) {
        setCredentialsToast({
          type: 'error',
          message: 'New password must be at least 6 characters long.',
        });
        return;
      }
      if (trimmedNewPass !== confirmPassword.trim()) {
        setCredentialsToast({
          type: 'error',
          message: 'New password and confirmation password do not match.',
        });
        return;
      }
    }

    try {
      setSavingCredentials(true);
      const res = await fetch('/api/admin/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          username: isUpdatingUsername ? trimmedUsername : undefined,
          currentPassword: isUpdatingPassword ? trimmedCurrentPass : undefined,
          newPassword: isUpdatingPassword ? trimmedNewPass : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCredentialsToast({
          type: 'error',
          message: data.error?.message || 'Failed to update credentials. Please check your current password.',
        });
        return;
      }

      setCredentialsToast({
        type: 'success',
        message: 'Admin credentials updated successfully!',
      });

      if (refreshUser) {
        await refreshUser();
      }

      setTimeout(() => {
        setCredentialsModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCredentialsToast(null);
      }, 1400);
    } catch (err: any) {
      setCredentialsToast({
        type: 'error',
        message: err.message || 'Network error while updating credentials.',
      });
    } finally {
      setSavingCredentials(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Mobile Drawer Toggle (Visible on < lg) */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Enterprise Pill */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-tech-cyan dark:text-white" />
            </div>
            <div className="block">
              <div className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5 sm:gap-2">
                <span className="truncate max-w-[140px] sm:max-w-none">NEXTECH COMMAND</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                  ENTERPRISE
                </span>
              </div>
              <div className="hidden xs:flex text-[10px] text-slate-500 dark:text-slate-400 font-mono items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="truncate max-w-[150px] sm:max-w-none">Node.js Engine • Synced</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Live Clock Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
            <span>{currentTime || '00:00:00 GST'}</span>
          </div>

          {/* Quick Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Storefront</span>
          </Link>

          {/* Admin Profile Pill (Clickable) */}
          <div
            onClick={handleOpenCredentialsModal}
            className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800 cursor-pointer group"
            title="Click to update username & password"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 group-hover:border-blue-400 dark:group-hover:border-blue-500 text-slate-800 dark:text-white flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
              AD
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[120px] transition-colors">{user?.username || user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[120px]">{user?.email || 'admin@nextech.com'}</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              title="Sign Out"
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-0.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar (Visible on lg+) */}
        <aside
          className={`${
            collapsed ? 'w-20' : 'w-64'
          } shrink-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 hidden lg:flex flex-col justify-between z-20`}
        >
          <div className="p-3 space-y-4 overflow-y-auto custom-scrollbar">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed ? (
                  <div className="px-3 pt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono">
                    {section.title}
                  </div>
                ) : (
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-2" />
                )}
                {section.items.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={collapsed ? label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Desktop Collapse Toggle */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!collapsed && <span>Collapse Sidebar</span>}
            </button>
          </div>
        </aside>

        {/* Mobile / Tablet Slide-out Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            />

            {/* Drawer Content */}
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 z-10 animate-in slide-in-from-left duration-200">
              <div className="space-y-6 overflow-y-auto custom-scrollbar">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white shadow-md">
                      <ShieldCheck className="w-4 h-4 text-tech-cyan dark:text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">NEXTECH COMMAND</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Enterprise Portal</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav Sections */}
                {navSections.map((section, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="px-2 pt-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase font-mono">
                      {section.title}
                    </div>
                    {section.items.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Mobile Credentials Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    handleOpenCredentialsModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
                  <span>Security & Credentials</span>
                </button>
              </div>

              {/* Drawer Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  href="/"
                  target="_blank"
                  className="text-xs font-bold text-tech-blue dark:text-tech-cyan flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Storefront</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50 dark:bg-[#090D16] p-3 sm:p-5 md:p-6 lg:p-8 transition-colors duration-200">
          {children}
        </main>
      </div>

      {/* Admin Credentials & Security Modal */}
      {credentialsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Admin Credentials & Access</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your administrator username or login password</p>
                </div>
              </div>
              <button
                onClick={() => setCredentialsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateCredentials} className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {credentialsToast && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold ${
                    credentialsToast.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                  }`}
                >
                  {credentialsToast.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{credentialsToast.message}</span>
                </div>
              )}

              {/* Section 1: Username */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
                    <span>Administrator Username</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Current: <strong className="text-slate-700 dark:text-slate-300">{user?.username || 'admin'}</strong>
                  </span>
                </div>
                <div>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Leave unchanged or enter a new unique username (min 3 chars).
                  </p>
                </div>
              </div>

              {/* Section 2: Password */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Change Security Password</span>
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Current Password {newPassword ? <span className="text-red-500">*</span> : ''}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    New Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && confirmPassword && (
                    <div className="mt-1 flex items-center gap-1 text-[11px]">
                      {newPassword === confirmPassword ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCredentialsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCredentials}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {savingCredentials && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{savingCredentials ? 'Saving...' : 'Save Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
