'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category, Brand } from '@/types';
import { useCurrency } from '@/lib/currency-context';
import {
  SlidersHorizontal,
  RotateCcw,
  Search,
  Cpu,
  Zap,
  HardDrive,
  Layers,
  Server,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

interface AdvancedCatalogFilterProps {
  categories: Category[];
  brands: Brand[];
  totalResults: number;
}

export function AdvancedCatalogFilter({
  categories,
  brands,
  totalResults,
}: AdvancedCatalogFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentCurrency } = useCurrency();

  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    categories: true,
    brands: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Internal brand search for fast filtering
  const [brandSearch, setBrandSearch] = useState('');

  // Extract current query states
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  // Local price inputs
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  // Helper to push updated query params without reloading
  const updateFilters = (updates: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset to page 1 on filter changes
    params.delete('page');

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setBrandSearch('');
    router.push('/products');
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentCategory) count++;
    if (currentBrand) count++;
    if (currentSearch) count++;
    if (currentMinPrice || currentMaxPrice) count++;
    return count;
  }, [
    currentCategory,
    currentBrand,
    currentSearch,
    currentMinPrice,
    currentMaxPrice,
  ]);

  // Filtered brands by local search
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase().trim();
    return brands.filter(b => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  // Category icon mapping
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('processor') || n.includes('cpu')) return Cpu;
    if (n.includes('graphic') || n.includes('gpu')) return Zap;
    if (n.includes('storage') || n.includes('ssd') || n.includes('nvme')) return HardDrive;
    if (n.includes('server') || n.includes('poe') || n.includes('network')) return Server;
    return Layers;
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({
      minPrice: minPriceInput || null,
      maxPrice: maxPriceInput || null,
    });
  };

  const pricePresets = [
    { label: 'All Budgets', min: '', max: '' },
    { label: 'Under 500', min: '0', max: '500' },
    { label: '500 - 1,500', min: '500', max: '1500' },
    { label: '1,500 - 3,000', min: '1500', max: '3000' },
    { label: '3,000 - 6,000', min: '3000', max: '6000' },
    { label: '6,000+', min: '6000', max: '' },
  ];

  return (
    <aside className="space-y-5 bg-white dark:bg-slate-900/95 p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-2xl transition-all">
      {/* Filter Matrix Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-tech-blue/10 dark:bg-cyan-500/10 flex items-center justify-center text-tech-blue dark:text-cyan-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Filter Catalog</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-tech-blue text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Hardware Parameters</p>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-[11px] text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 font-bold py-1 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Procurement Budget / Price Range */}
      <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>Price & Budget</span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">({currentCurrency.code})</span>
          </h4>
          {openSections.price ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          )}
        </div>

        {openSections.price && (
          <div className="space-y-3 pt-1">
            {/* Quick Price Preset Pills */}
            <div className="grid grid-cols-2 gap-1.5">
              {pricePresets.map(preset => {
                const isSelected =
                  currentMinPrice === preset.min && currentMaxPrice === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setMinPriceInput(preset.min);
                      setMaxPriceInput(preset.max);
                      updateFilters({
                        minPrice: preset.min || null,
                        maxPrice: preset.max || null,
                      });
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold text-center transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-tech-blue text-white shadow-sm font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Manual Min / Max Inputs */}
            <form onSubmit={handlePriceApply} className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={e => setMinPriceInput(e.target.value)}
                  className="w-full pl-3 pr-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue dark:focus:border-cyan-400 font-mono"
                />
              </div>
              <span className="text-slate-400 text-xs">-</span>
              <div className="relative flex-1">
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={e => setMaxPriceInput(e.target.value)}
                  className="w-full pl-3 pr-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue dark:focus:border-cyan-400 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Categories Accordion */}
      <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Hardware Categories
          </h4>
          {openSections.categories ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          )}
        </div>

        {openSections.categories && (
          <div className="space-y-1 pt-1 max-h-56 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => updateFilters({ category: null })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !currentCategory
                  ? 'bg-tech-blue text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className={`w-3.5 h-3.5 ${!currentCategory ? 'text-white' : 'text-slate-400'}`} />
                <span>All Categories</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${!currentCategory ? 'bg-white/20 text-white' : 'text-slate-400'}`}>
                {totalResults}
              </span>
            </button>

            {categories.map(cat => {
              const Icon = getCategoryIcon(cat.name);
              const isSelected = currentCategory === cat.id || currentCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateFilters({ category: isSelected ? null : cat.id })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-tech-blue text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  {cat.productCount != null && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'text-slate-400'}`}>
                      {cat.productCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Brands Accordion with Instant Search */}
      <div className="space-y-3">
        <div
          onClick={() => toggleSection('brands')}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Manufacturer Brands
          </h4>
          {openSections.brands ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          )}
        </div>

        {openSections.brands && (
          <div className="space-y-2 pt-1">
            {/* Brand Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearch}
                onChange={e => setBrandSearch(e.target.value)}
                className="w-full pl-7 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue dark:focus:border-cyan-400"
              />
              {brandSearch && (
                <button
                  type="button"
                  onClick={() => setBrandSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Brands List */}
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateFilters({ brand: null })}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !currentBrand
                    ? 'bg-tech-blue text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <span>All Brands</span>
                <span className={`text-[10px] font-mono ${!currentBrand ? 'text-white' : 'text-slate-400'}`}>
                  {brands.length}
                </span>
              </button>

              {filteredBrands.map(brand => {
                const isSelected = currentBrand === brand.id || currentBrand === brand.slug;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onClick={() => updateFilters({ brand: isSelected ? null : brand.id })}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-tech-blue text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="truncate">{brand.name}</span>
                    {brand.productCount != null && (
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                        {brand.productCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
