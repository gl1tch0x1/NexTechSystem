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
  ChevronRight,
  X,
  Check,
  Laptop,
  Monitor,
  CheckCircle2,
  Gamepad2,
  Briefcase,
} from 'lucide-react';

interface AdvancedCatalogFilterProps {
  categories: Category[];
  brands: Brand[];
  totalResults: number;
}

export interface SubCategoryItem {
  id: string;
  name: string;
  shortLabel: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface CategoryTaxonomyRule {
  parentCategoryId: string;
  slugs: string[];
  title: string;
  items: SubCategoryItem[];
}

/**
 * Curated Enterprise Taxonomy of Specialized Sub-Categories & Hardware Workloads
 */
const CATEGORY_TAXONOMIES: CategoryTaxonomyRule[] = [
  {
    parentCategoryId: 'cat_laptops',
    slugs: ['laptops', 'cat_laptops', 'cat_gaming_laptops', 'gaming-laptops'],
    title: 'Laptop Workloads & Form Factors',
    items: [
      {
        id: 'gaming',
        name: 'Gaming & High-Performance',
        shortLabel: 'Gaming / Esports',
        badge: 'RTX / High-FPS',
        description: 'Alienware, ROG Strix, Legion, Katana, Nitro, Predator, Vector, TUF',
        icon: Gamepad2,
      },
      {
        id: 'work',
        name: 'Work & Professional',
        shortLabel: 'Work & Enterprise',
        badge: 'Enterprise Grade',
        description: 'ThinkPad, Latitude, ExpertBook, MacBook Pro, Precision, ZBook',
        icon: Briefcase,
      },
      {
        id: 'basics',
        name: 'Everyday & Ultra-Slim',
        shortLabel: 'Daily & Basics',
        badge: 'Portability',
        description: 'VivoBook, ZenBook, Aspire, Inspiron, IdeaPad, Yoga, Swift',
        icon: Laptop,
      },
    ],
  },
  {
    parentCategoryId: 'cat_storage',
    slugs: ['storage-drives', 'cat_storage', 'storage'],
    title: 'Storage Architecture & Media',
    items: [
      {
        id: 'nvme',
        name: 'High-Speed NVMe & M.2 SSDs',
        shortLabel: 'NVMe & M.2 SSDs',
        badge: 'Gen4 / Gen5 PCIe',
        description: 'Ultra-fast NVMe M.2 Solid State Drives, FireCuda, Crucial, Gen4',
        icon: Zap,
      },
      {
        id: 'hdd',
        name: 'Mechanical HDDs & Bulk Terabytes',
        shortLabel: 'Mechanical HDDs',
        badge: 'High-Capacity',
        description: 'Western Digital Blue, 2.5" & 3.5" High-Capacity Mechanical Storage',
        icon: HardDrive,
      },
      {
        id: 'flash',
        name: 'External Docks & Enclosures',
        shortLabel: 'Flash & Docks',
        badge: 'Portable & Hub',
        description: 'ADATA portable drives, docking stations, drive enclosures & brackets',
        icon: Layers,
      },
    ],
  },
  {
    parentCategoryId: 'cat_all_in_one',
    slugs: ['all-in-one-pcs', 'cat_all_in_one', 'desktops', 'cat_desktops'],
    title: 'Desktop Form Factors',
    items: [
      {
        id: 'aio',
        name: 'All-in-One Desktop PCs',
        shortLabel: 'All-in-One (AIO)',
        badge: 'Integrated Display',
        description: 'Integrated display workstations, IdeaCentre & enterprise all-in-ones',
        icon: Monitor,
      },
      {
        id: 'desktop',
        name: 'Tower Workstations & Desktops',
        shortLabel: 'Tower Desktops',
        badge: 'Expandable Chassis',
        description: 'Acer AXC series, expandable modular desktop computing towers',
        icon: Server,
      },
    ],
  },
  {
    parentCategoryId: 'cat_components',
    slugs: ['components', 'cat_components'],
    title: 'Core Hardware Components',
    items: [
      {
        id: 'ram',
        name: 'DDR5 & DDR4 Memory (RAM)',
        shortLabel: 'RAM Modules',
        badge: 'DDR4 / DDR5',
        description: 'High-frequency Desktop DIMM & Laptop SODIMM memory modules',
        icon: Cpu,
      },
      {
        id: 'cpu',
        name: 'Processors (CPUs)',
        shortLabel: 'Processors (CPUs)',
        badge: 'Multi-Core Compute',
        description: 'Intel Core i9 / i7 and AMD Ryzen flagship workstation processors',
        icon: Cpu,
      },
    ],
  },
  {
    parentCategoryId: 'cat_networking',
    slugs: ['networking', 'cat_networking'],
    title: 'Network & Infrastructure',
    items: [
      {
        id: 'network',
        name: 'Managed PoE & Switches',
        shortLabel: 'PoE Switches',
        badge: 'Enterprise Rack',
        description: 'Cisco SG series, Ubiquiti, managed PoE switches and access hardware',
        icon: Server,
      },
    ],
  },
];

export function AdvancedCatalogFilter({
  categories,
  brands,
  totalResults,
}: AdvancedCatalogFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentCurrency } = useCurrency();

  // Collapsible section state (procurement section removed per requirement)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    price: true,
    brands: true,
  });

  // Track manually expanded category submenus
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    cat_laptops: true,
    cat_storage: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCategoryExpand = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Internal search filters for fast list querying
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // Extract current query states
  const currentCategory = searchParams.get('category') || '';
  const currentSubCategory = searchParams.get('subCategory') || searchParams.get('subType') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  // Local price inputs
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice);

  // Helper to push updated query params
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

  // Count active filters (strictly catalog filters, no procurement)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentCategory) count++;
    if (currentSubCategory) count++;
    if (currentBrand) count++;
    if (currentSearch) count++;
    if (currentMinPrice || currentMaxPrice) count++;
    return count;
  }, [
    currentCategory,
    currentSubCategory,
    currentBrand,
    currentSearch,
    currentMinPrice,
    currentMaxPrice,
  ]);

  // Find active taxonomy rule if current category matches one
  const activeCategoryTaxonomy = useMemo(() => {
    if (!currentCategory) return null;
    const catLower = currentCategory.toLowerCase();
    return (
      CATEGORY_TAXONOMIES.find(
        t =>
          t.parentCategoryId.toLowerCase() === catLower ||
          t.slugs.some(s => s.toLowerCase() === catLower)
      ) || null
    );
  }, [currentCategory]);

  // Helper to get taxonomy rule for any category item
  const getTaxonomyForCategory = (cat: Category) => {
    const idLower = cat.id.toLowerCase();
    const slugLower = (cat.slug || '').toLowerCase();
    const nameLower = cat.name.toLowerCase();

    return (
      CATEGORY_TAXONOMIES.find(
        t =>
          t.parentCategoryId.toLowerCase() === idLower ||
          t.slugs.some(s => s.toLowerCase() === idLower || s.toLowerCase() === slugLower) ||
          (nameLower.includes('laptop') && t.parentCategoryId === 'cat_laptops') ||
          (nameLower.includes('storage') && t.parentCategoryId === 'cat_storage') ||
          ((nameLower.includes('all-in-one') || nameLower.includes('desktop')) &&
            t.parentCategoryId === 'cat_all_in_one') ||
          (nameLower.includes('component') && t.parentCategoryId === 'cat_components') ||
          (nameLower.includes('network') && t.parentCategoryId === 'cat_networking')
      ) || null
    );
  };

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
    if (n.includes('server') || n.includes('poe') || n.includes('network') || n.includes('rack'))
      return Server;
    if (n.includes('monitor') || n.includes('display')) return Monitor;
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

      {/* 1. Hardware Taxonomy & Dynamic Sub-Category Tree */}
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
          <div className="space-y-2.5 pt-1">
            {/* Quick-Access Workload Strip (Appears when active category has sub-categories) */}
            {activeCategoryTaxonomy && (
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/40 dark:to-slate-900/60 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    <span>{activeCategoryTaxonomy.title}</span>
                  </span>
                  {currentSubCategory && (
                    <button
                      type="button"
                      onClick={() => updateFilters({ subCategory: null })}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                      <span>All {activeCategoryTaxonomy.items[0]?.shortLabel.split('/')[0]}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {activeCategoryTaxonomy.items.map(subItem => {
                    const SubIcon = subItem.icon;
                    const isSelected =
                      currentSubCategory.toLowerCase() === subItem.id.toLowerCase();
                    return (
                      <button
                        key={subItem.id}
                        type="button"
                        onClick={() =>
                          updateFilters({
                            subCategory: isSelected ? null : subItem.id,
                          })
                        }
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all text-left border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                            : 'bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <SubIcon
                            className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600 dark:text-cyan-400'}`}
                          />
                          <span className="truncate font-semibold">{subItem.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-100/60 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300'
                            }`}
                          >
                            {subItem.badge}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category Search Input */}
            {categories.length > 7 && (
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

            {/* Main Categories Tree */}
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {/* All Categories Option */}
              <button
                type="button"
                onClick={() => updateFilters({ category: null, subCategory: null })}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  !currentCategory
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles
                    className={`w-3.5 h-3.5 ${!currentCategory ? 'text-white' : 'text-slate-400'}`}
                  />
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

              {/* Categorized List with Hierarchical Sub-Categories */}
              {filteredCategories.map(cat => {
                const Icon = getCategoryIcon(cat.name);
                const isSelected =
                  currentCategory === cat.id || currentCategory === cat.slug;
                const taxonomy = getTaxonomyForCategory(cat);
                const hasSubCategories = !!taxonomy && taxonomy.items.length > 0;
                const isExpanded =
                  isSelected || !!expandedCategories[cat.id] || !!expandedCategories[cat.slug];

                return (
                  <div key={cat.id} className="space-y-1">
                    <div
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                          : 'border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          // Unselect category and its subcategory
                          updateFilters({ category: null, subCategory: null });
                        } else {
                          // Select category and clear stale subCategory
                          updateFilters({ category: cat.id, subCategory: null });
                          setExpandedCategories(prev => ({ ...prev, [cat.id]: true }));
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'
                          }`}
                        />
                        <span className="truncate">{cat.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {cat.productCount != null && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'text-slate-400'
                            }`}
                          >
                            {cat.productCount}
                          </span>
                        )}

                        {hasSubCategories && (
                          <button
                            type="button"
                            onClick={e => toggleCategoryExpand(cat.id, e)}
                            className={`p-0.5 rounded hover:bg-white/20 transition-colors ${
                              isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title="Toggle Sub-filters"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sub-Category Drawer */}
                    {hasSubCategories && isExpanded && (
                      <div className="ml-3 pl-3 border-l-2 border-blue-200 dark:border-blue-900/60 py-1 space-y-1">
                        {taxonomy.items.map(sub => {
                          const SubIcon = sub.icon;
                          const isSubSelected =
                            isSelected &&
                            currentSubCategory.toLowerCase() === sub.id.toLowerCase();

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                if (isSubSelected) {
                                  // Toggle sub-category off while keeping category
                                  updateFilters({ subCategory: null });
                                } else {
                                  // Select this subcategory and ensure parent category is selected
                                  updateFilters({
                                    category: cat.id,
                                    subCategory: sub.id,
                                  });
                                }
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left cursor-pointer border ${
                                isSubSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-cyan-300 font-bold shadow-2xs'
                                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <SubIcon
                                  className={`w-3 h-3 shrink-0 ${
                                    isSubSelected
                                      ? 'text-blue-600 dark:text-cyan-400'
                                      : 'text-slate-400'
                                  }`}
                                />
                                <span className="truncate">{sub.name}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span
                                  className={`text-[8.5px] font-mono px-1 py-0.2 rounded ${
                                    isSubSelected
                                      ? 'bg-blue-600 text-white font-bold'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {sub.badge}
                                </span>
                                {isSubSelected && (
                                  <Check className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
            <span className="text-[10px] font-mono text-slate-400 font-normal">
              ({currentCurrency.code})
            </span>
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

      {/* 3. Manufacturer Brands Accordion */}
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
                <span
                  className={`text-[10px] font-mono ${!currentBrand ? 'text-white' : 'text-slate-400'}`}
                >
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
                      <span
                        className={`text-[10px] font-mono ${isSelected ? 'text-white' : 'text-slate-400'}`}
                      >
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
