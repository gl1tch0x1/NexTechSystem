'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Command,
  Package,
  Layers,
  Award,
  Zap,
  Tag,
  Store,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  CornerDownLeft,
  X,
  SlidersHorizontal,
  LayoutDashboard,
  Cpu
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { Product, Category, Brand } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCurrency } from '@/lib/currency-context';

export function GlobalCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { formatPrice } = useCurrency();

  // Open / Close Keyboard Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Load Categories & Brands taxonomy on initial open
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      ApiClient.get<Category[]>('/products/categories')
        .then(res => setCategories(Array.isArray(res) ? res.slice(0, 8) : []))
        .catch(() => {});
      ApiClient.get<Brand[]>('/products/brands')
        .then(res => setBrands(Array.isArray(res) ? res.slice(0, 8) : []))
        .catch(() => {});
    }
  }, [isOpen, categories.length]);

  // Debounced Search Execution
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await ApiClient.get<any>(`/products?search=${encodeURIComponent(query.trim())}&limit=8`);
        const prods = Array.isArray(res) ? res : (res?.products || res?.data || []);
        setResults(prods);
        setSelectedIndex(0);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Quick navigation shortcuts
  const staticShortcuts = [
    { label: 'Enterprise Hardware Catalog', href: '/products', icon: Package, badge: 'CATALOG' },
    { label: 'Interactive Custom Rig Builder', href: '/pc-builder', icon: Cpu, badge: 'BUILDER' },
    { label: 'Storefront Promotional Vouchers', href: '/products?featured=deals', icon: Tag, badge: 'PROMO' },
    { label: 'Admin Command Center & Operations', href: '/admin', icon: LayoutDashboard, badge: 'ADMIN' },
  ];

  // Navigate to item
  const handleSelectProduct = useCallback((product: Product) => {
    setIsOpen(false);
    router.push(`/products/${product.slug || product.id}`);
  }, [router]);

  const handleSelectShortcut = useCallback((href: string) => {
    setIsOpen(false);
    router.push(href);
  }, [router]);

  // Keyboard navigation up/down
  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelectProduct(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDownList}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
          <Search className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value.replace(/[<>'"]/g, ''))}
            placeholder="Search enterprise CPUs, GPUs, server racks, SKUs, or system commands..."
            className="w-full bg-transparent px-3.5 py-1 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none font-medium"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin shrink-0 mr-2" />
          )}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Scrollable Results & Suggestions Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Active Search Results */}
          {query.trim() !== '' && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Hardware Catalog Matches ({results.length})</span>
                {results.length > 0 && <span className="text-purple-600 font-bold">Use ↑ ↓ & Enter</span>}
              </div>

              {results.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {results.map((prod, idx) => {
                    const isSelected = idx === selectedIndex;
                    const priceFormatted = formatPrice(prod.price);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduct(prod)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300/60 dark:border-slate-700/60">
                            <img
                              src={prod.primaryImage || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=150&q=80'}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {prod.name}
                            </div>
                            <div className={`text-[10px] flex items-center gap-2 ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                              <span className="font-mono">SKU: {prod.sku}</span>
                              {prod.brandName && (
                                <>
                                  <span>•</span>
                                  <span>{prod.brandName}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{prod.stock > 0 ? `${prod.stock} In Stock` : 'Out of Stock'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className={`text-xs font-mono font-bold ${isSelected ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}>
                            {priceFormatted}
                          </span>
                          <CornerDownLeft className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !loading ? (
                <div className="text-center py-8">
                  <Package className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-500">No hardware components found matching &ldquo;{query}&rdquo;</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try searching for CPU, RTX 4090, ASUS, DDR5, or SKU code.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Quick Platform Shortcuts (When query is empty or complementary) */}
          {query.trim() === '' && (
            <div className="space-y-4">
              <div>
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Quick Navigation Shortcuts
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
                  {staticShortcuts.map((sc, idx) => {
                    const Icon = sc.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectShortcut(sc.href)}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/50 text-left transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate">
                            {sc.label}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/60">
                          {sc.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Browse by Categories */}
              {categories.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Popular Component Categories</span>
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectShortcut(`/products?category=${cat.id}`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Authorized Brands */}
              {brands.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Tier-1 Partner Brands</span>
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {brands.map(brand => (
                      <button
                        key={brand.id}
                        onClick={() => handleSelectShortcut(`/products?brand=${brand.id}`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/90 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">ESC</kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">
            <Sparkles className="w-3 h-3" />
            <span>NexTech Global Search Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
