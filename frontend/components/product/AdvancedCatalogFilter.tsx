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
  Check,
  Laptop,
  ShieldCheck,
  Flame,
  CheckCircle2,
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
    procurement: true,
    price: true,
    categories: true,
    brands: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Internal search filters for fast list querying
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // Extract current query states
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentInStock = searchParams.get('inStock') === 'true';
  const currentOnSale = searchParams.get('onSale') === 'true';
  const currentSellerType = searchParams.get('sellerType') || '';

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
    setCategorySearch('');
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
    if (currentInStock) count++;
    if (currentOnSale) count++;
    if (currentSellerType) count++;
    return count;
  }, [
    currentCategory,
    currentBrand,
    currentSearch,
    currentMinPrice,
    currentMaxPrice,
    currentInStock,
    currentOnSale,
    currentSellerType,
  ]);

  // Filtered categories by local search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const q = categorySearch.toLowerCase().trim();
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  // Filtered brands by local search
  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase().trim();
    return brands.filter(b => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  // Category icon mapping
  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('laptop') || n.includes('notebook')) return Laptop;
    if (n.includes('processor') || n.includes('cpu')) return Cpu;
    if (n.includes('graphic') || n.includes('gpu')) return Zap;
    if (n.includes('storage') || n.includes('ssd') || n.includes('nvme')) return HardDrive;
    if (n.includes('server') || n.includes('poe') || n.includes('network') || n.includes('rack')) return Server;
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
    { label: '< AED 1,000', min: '0', max: '1000' },
    { label: '1,000 - 3,000', min: '1000', max: '3000' },
    { label: '3,000 - 6,000', min: '3000', max: '6000' },
    { label: '6,000 - 10,000', min: '6000', max: '10000' },
    { label: 'AED 10,000+', min: '10000', max: '' },
  ];

  return (
    <aside className="space-y-5 bg-white dark:bg-slate-900/95 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all">
      {/* Filter Matrix Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-cyan-400 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Filter Catalog</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {activeFilterCount}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">{totalResults} SKUs Available</p>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-[11px] text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 font-bold py-1 px-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* 1. Procurement Availability & Verified Channel (Fast Toggles) */}
      <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div
          onClick={() => toggleSection('procurement')}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Procurement & Stock</span>
          </h4>
          {openSections.procurement ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          )}
        </div>

        {openSections.procurement && (
          <div className="space-y-1.5 pt-1">
            {/* In-Stock Toggle */}
            <button
              type="button"
              onClick={() => updateFilters({ inStock: currentInStock ? null : 'true' })}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                currentInStock
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${currentInStock ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <span>In-Stock UAE Pool</span>
              </div>
              {currentInStock && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>

            {/* On-Sale / Promotions Toggle */}
            <button
              type="button"
              onClick={() => updateFilters({ onSale: currentOnSale ? null : 'true' })}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                currentOnSale
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className={`w-3.5 h-3.5 ${currentOnSale ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>Special Offers & Deals</span>
              </div>
              {currentOnSale && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            </button>

            {/* Direct OEM Warranty Toggle */}
            <button
              type="button"
              onClick={() => updateFilters({ sellerType: currentSellerType === 'ADMIN' ? null : 'ADMIN' })}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                currentSellerType === 'ADMIN'
                  ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-cyan-300 font-bold'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-3.5 h-3.5 ${currentSellerType === 'ADMIN' ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                <span>Tier-1 Direct OEM</span>
              </div>
              {currentSellerType === 'ADMIN' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />}
            </button>
          </div>
        )}
      </div>

      {/* 2. Procurement Budget / Price Range */}
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
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold text-center transition-all cursor-pointer truncate border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800'
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
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                  AED
                </span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPriceInput}
                  onChange={e => setMinPriceInput(e.target.value)}
                  className="w-full pl-9 pr-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-cyan-400 font-mono"
                />
              </div>
              <span className="text-slate-400 text-xs">-</span>
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                  AED
                </span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPriceInput}
                  onChange={e => setMaxPriceInput(e.target.value)}
                  className="w-full pl-9 pr-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-cyan-400 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. Hardware Categories Accordion */}
      <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Hardware Taxonomy</span>
          </h4>
          {openSections.categories ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
          )}
        </div>

        {openSections.categories && (
          <div className="space-y-2 pt-1">
            {/* Category Search Input */}
            {categories.length > 8 && (
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  className="w-full pl-7 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-cyan-400"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Categories List */}
            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => updateFilters({ category: null })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  !currentCategory
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-3.5 h-3.5 ${!currentCategory ? 'text-white' : 'text-slate-400'}`} />
                  <span>All Categories</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    !currentCategory ? 'bg-white/20 text-white' : 'text-slate-400'
                  }`}
                >
                  {totalResults}
                </span>
              </button>

              {filteredCategories.map(cat => {
                const Icon = getCategoryIcon(cat.name);
                const isSelected = currentCategory === cat.id || currentCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateFilters({ category: isSelected ? null : cat.id })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {cat.productCount != null && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'text-slate-400'
                        }`}
                      >
                        {cat.productCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Manufacturer Brands Accordion */}
      <div className="space-y-3">
        <div
          onClick={() => toggleSection('brands')}
          className="flex items-center justify-between cursor-pointer group select-none"
        >
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>OEM Brands</span>
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
                className="w-full pl-7 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-cyan-400"
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
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
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
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
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
