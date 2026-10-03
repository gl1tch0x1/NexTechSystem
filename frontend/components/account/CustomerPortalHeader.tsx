'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  ShieldCheck,
  MapPin,
  LogOut,
  Mail,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

interface CustomerPortalHeaderProps {
  activeTab?: 'overview' | 'security' | 'settings';
  onTabChange?: (tab: 'overview' | 'security' | 'settings') => void;
  walletBalance?: number;
  totalOrdersCount?: number;
}

export function CustomerPortalHeader({
  activeTab = 'overview',
  onTabChange,
  totalOrdersCount = 0,
}: CustomerPortalHeaderProps) {
  const { user, logout } = useAuth();
  const { wishlist } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const isBaseAccountPage = pathname === '/account';
  const isOrdersPage = pathname.startsWith('/account/orders');
  const isWishlistPage = pathname.startsWith('/account/wishlist');

  const navItems = [
    {
      id: 'overview',
      label: 'Overview & Activity',
      icon: LayoutDashboard,
      href: '/account',
      isActive: isBaseAccountPage && activeTab === 'overview',
      badge: null,
      onClick: () => {
        if (isBaseAccountPage && onTabChange) {
          onTabChange('overview');
        } else {
          router.push('/account');
        }
      },
    },
    {
      id: 'orders',
      label: 'Orders & Invoices',
      icon: ShoppingBag,
      href: '/account/orders',
      isActive: isOrdersPage,
      badge: totalOrdersCount > 0 ? String(totalOrdersCount) : null,
      onClick: () => router.push('/account/orders'),
    },
    {
      id: 'wishlist',
      label: 'Saved Wishlist',
      icon: Heart,
      href: '/account/wishlist',
      isActive: isWishlistPage,
      badge: wishlist.length > 0 ? String(wishlist.length) : null,
      onClick: () => router.push('/account/wishlist'),
    },
    {
      id: 'settings',
      label: 'Addresses & Profile',
      icon: MapPin,
      href: '/account?tab=settings',
      isActive: isBaseAccountPage && activeTab === 'settings',
      badge: user?.addresses?.length ? `${user.addresses.length} saved` : null,
      onClick: () => {
        if (isBaseAccountPage && onTabChange) {
          onTabChange('settings');
        } else {
          router.push('/account?tab=settings');
        }
      },
    },
    {
      id: 'security',
      label: 'Security & Password',
      icon: ShieldCheck,
      href: '/account?tab=security',
      isActive: isBaseAccountPage && activeTab === 'security',
      badge: null,
      onClick: () => {
        if (isBaseAccountPage && onTabChange) {
          onTabChange('security');
        } else {
          router.push('/account?tab=security');
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Profile Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-7 transition-all">
        {/* Subtle architectural background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Info Avatar & Monogram */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-lg sm:text-xl border border-slate-700 shadow-sm">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-7 h-7" />}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 flex items-center justify-center"
                title="Active Account"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>Verified Customer • GCC Dispatch</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {user?.id?.replace(/^user_/, '').slice(0, 8) || 'NXT-CLI'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {user?.name || 'Valued Customer'}
              </h1>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span className="truncate">{user?.email}</span>
                </span>
                <span>•</span>
                <span>United Arab Emirates</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Logout */}
          <div className="flex items-center flex-wrap gap-3 sm:gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            {/* Orders quick capsule */}
            <Link
              href="/account/orders"
              className="group flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50/70 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 transition-all shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  My Orders
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                  {totalOrdersCount} {totalOrdersCount === 1 ? 'Order' : 'Orders'}
                </div>
              </div>
            </Link>

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Sign Out of Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Tab Navigation Bar */}
      <div className="relative border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <nav className="flex items-center gap-2 min-w-max pb-2" aria-label="Customer Portal Tabs">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = item.isActive;
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
