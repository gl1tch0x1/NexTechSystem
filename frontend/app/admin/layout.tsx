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
  Activity,
  Layers,
  Award,
  Image as ImageIcon,
  Sliders,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Server,
  BarChart3,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

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
        { href: '/admin/analytics', label: 'Real-Time Analytics', icon: BarChart3 },
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
      title: 'COMMERCE & PARTNERS',
      items: [
        { href: '/admin/orders', label: 'Global Orders', icon: ShoppingBag },
        { href: '/admin/customers', label: 'Customers & Wallets', icon: Users },
        { href: '/admin/resellers', label: 'Reseller Network', icon: Store },
      ],
    },
    {
      title: 'MARKETING & PROMO',
      items: [
        { href: '/admin/coupons', label: 'Discount Coupons', icon: Tag },
        { href: '/admin/banners', label: 'Storefront Banners', icon: ImageIcon },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="block">
              <div className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5 sm:gap-2">
                <span className="truncate max-w-[140px] sm:max-w-none">NEXTECH COMMAND</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30">
                  ENTERPRISE
                </span>
              </div>
              <div className="hidden xs:flex text-[10px] text-slate-500 dark:text-slate-400 font-mono items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                <span className="truncate max-w-[150px] sm:max-w-none">Cloud Firestore</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Live Clock Badge (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-tech-blue dark:text-tech-cyan" />
            <span>{currentTime || '00:00:00 GST'}</span>
          </div>

          {/* Quick Storefront Link */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Storefront</span>
          </Link>

          {/* Admin Profile Pill */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-purple-600/10 dark:bg-purple-600/30 border border-purple-500/30 dark:border-purple-500/40 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
              AD
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px]">{user?.name || 'Chief Admin'}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{user?.email || 'admin@nextech.com'}</div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
          } shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-800/80 transition-all duration-300 hidden lg:flex flex-col justify-between`}
        >
          <div className="p-3 space-y-5 overflow-y-auto custom-scrollbar">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!collapsed ? (
                  <div className="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-purple-600/10 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 dark:border-purple-500/40 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Desktop Collapse Toggle */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
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
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">COMMAND CENTER</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Admin Navigation</div>
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
                    <div className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                      {section.title}
                    </div>
                    {section.items.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
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
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
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
    </div>
  );
}
