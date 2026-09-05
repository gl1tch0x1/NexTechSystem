'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Cpu,
  Layers,
  ShieldCheck,
  Store,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  SlidersHorizontal,
  CreditCard,
  LogOut,
  PackageCheck
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export function Navbar() {
  const router = useRouter();
  const { user, role, reseller, logout } = useAuth();
  const { cartCount, wishlistCount, cart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/90 transition-colors duration-200 shadow-sm">
      {/* 1. TOP ANNOUNCEMENT BAR (Centered GCC Dispatch Highlight) */}
      <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
            <span className="font-extrabold text-amber-400 tracking-wider">
              GCC EXPRESS DISPATCH:
            </span>
            <span className="text-slate-200">
              Free Insured Shipping on Workstations, CPUs & Servers over AED 500
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 lg:gap-8">
        {/* Brand Logo (Modernized High-Impact Tech Badge) */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 group-hover:shadow-blue-500/40 transition-all duration-300">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1 leading-none">
              <span>NEXTECH</span>
              <span className="text-tech-blue dark:text-cyan-400">SYSTEMS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block ml-0.5"></span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mt-1">
              Enterprise Technology Platform
            </div>
          </div>
        </Link>

        {/* Search Field (Ultra-Modern Ant Design / Shadcn Command-Palette Style) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:block">
          <div className="relative flex items-center group">
            <div className="absolute left-3.5 text-slate-400 group-focus-within:text-tech-blue transition-colors">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              placeholder="Search CPUs, RTX 4090, PowerEdge Servers, LGA1700, DDR5, SKUs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/90 dark:bg-slate-800/80 text-slate-900 dark:text-white pl-10 pr-28 py-2.5 rounded-2xl text-xs font-medium border border-slate-200/90 dark:border-slate-700/80 focus:border-tech-blue focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-tech-blue/10 focus:outline-none transition-all duration-200 shadow-inner placeholder:text-slate-400"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              <span className="hidden lg:inline-block text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-2xs">
                ⌘K
              </span>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-tech-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-102 active:scale-98"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Right Navigation Actions (Sleek Modern Segment) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <ThemeToggle className="rounded-2xl" />

          {/* Wishlist Button */}
          <Link
            href="/account/wishlist"
            className="relative p-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 transition-all duration-200 shadow-sm group"
            title="Wishlist"
          >
            <Heart className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-red-500 transition-colors" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-pulse">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Modern Cart Button (Shadcn Style) */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600/10 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-500/20 text-tech-blue dark:text-cyan-300 hover:bg-tech-blue hover:text-white dark:hover:bg-tech-blue dark:hover:text-white border border-tech-blue/30 dark:border-cyan-500/30 transition-all duration-200 font-bold text-xs shadow-sm group"
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-tech-blue text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-mono text-xs">
              {cart.total > 0 ? formatPrice(cart.total) : 'Cart'}
            </span>
          </Link>

          {/* Modern Profile / User Button */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 border border-slate-200/90 dark:border-slate-700/80 transition-all duration-200 shadow-sm"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                {user ? user.name.slice(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="hidden xl:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                {user ? user.name.split(' ')[0] : 'Account'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200" />
            </button>

            {/* Profile Dropdown Menu (Ant Design / Shadcn Card Style) */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-fadeIn">
                {user ? (
                  <>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                            {user.email}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="inline-block text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 uppercase tracking-wider">
                              {user.role}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              Wallet: {formatPrice((user as any).walletBalance || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role Specific Shortcuts */}
                    <div className="space-y-1">
                      {role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Admin Command Center</span>
                        </Link>
                      )}

                      {role === 'RESELLER' && (
                        <Link
                          href={`/reseller/${reseller?.resellerCode || 'comnet101'}/dashboard`}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                        >
                          <Store className="w-4 h-4 shrink-0" />
                          <span>Reseller Portal ({reseller?.resellerCode || 'Vendor'})</span>
                        </Link>
                      )}

                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Customer Profile & Address</span>
                      </Link>

                      <Link
                        href="/account/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <PackageCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Orders & Verified E-Bills</span>
                      </Link>

                      <Link
                        href="/account/wallet"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Wallet Ledger & Top-Up</span>
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3">
                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block w-full py-2.5 bg-tech-blue text-white text-center text-xs font-bold rounded-2xl hover:bg-blue-600 transition-colors shadow-md"
                    >
                      Sign In / Register
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. SUB-NAVIGATION CATEGORIES BAR */}
      <nav className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-6 py-2.5 overflow-x-auto">
            <Link
              href="/products"
              className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5 font-bold text-slate-900 dark:text-white"
            >
              <Layers className="w-3.5 h-3.5 text-tech-blue dark:text-cyan-400" />
              <span>All Products</span>
            </Link>
            <Link href="/products?category=cat_components" className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">
              Processors & GPUs
            </Link>
            <Link href="/products?category=cat_storage" className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">
              Storage & NVMe SSDs
            </Link>
            <Link href="/products?category=cat_servers" className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">
              Servers & Enterprise
            </Link>
            <Link href="/products?category=cat_networking" className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">
              Networking & PoE
            </Link>
            <Link
              href="/pc-builder"
              className="text-tech-blue dark:text-cyan-400 hover:underline font-bold flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Custom PC Builder</span>
            </Link>
            <Link href="/compare" className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">
              Hardware Compare
            </Link>
          </div>

          <Link
            href="/products?featured=true"
            className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1.5 text-[11px]"
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>Deals & Enterprise Bundles</span>
          </Link>
        </div>
      </nav>

      {/* 4. MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-3 animate-fadeIn">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search hardware catalog..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-2xl text-xs border border-slate-200 dark:border-slate-700"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs bg-tech-blue text-white px-3 py-1.5 rounded-xl font-bold">
                Search
              </button>
            </div>
          </form>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link href="/products" className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">All Catalog</Link>
            <Link href="/pc-builder" className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-tech-blue dark:text-cyan-400 border border-slate-200 dark:border-slate-700">PC Builder</Link>
            <Link href="/products?featured=true" className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-amber-500 border border-slate-200 dark:border-slate-700">Deals & Promos</Link>
            <Link href="/account" className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">My Account</Link>
          </div>
        </div>
      )}
    </header>
  );
}
