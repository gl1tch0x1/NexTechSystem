import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { AdvancedCatalogFilter } from '@/components/product/AdvancedCatalogFilter';
import { Product, Category, Brand } from '@/types';
import { Filter, SlidersHorizontal, ArrowUpDown, Search, RotateCcw, X, Boxes, ShieldCheck, Zap } from 'lucide-react';
import { getApiUrl } from '@/lib/api-client';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    onSale?: string;
    sellerType?: string;
    minRating?: string;
    location?: string;
    socket?: string;
    featured?: string;
    sort?: string;
    page?: string;
  }>;
}

async function getProductsData(params: Record<string, any>) {
  try {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) qs.append(k, v);
    }

    const res = await fetch(getApiUrl(`/products?${qs.toString()}`), { cache: 'no-store' });
    const json = await res.json();

    const catRes = await fetch(getApiUrl('/products/categories'), { next: { revalidate: 60 } });
    const catJson = await catRes.json();

    const brandRes = await fetch(getApiUrl('/products/brands'), { next: { revalidate: 60 } });
    const brandJson = await brandRes.json();

    return {
      products: (json.data || []) as Product[],
      total: json.meta?.total || 0,
      facets: json.meta?.facets || { categories: [], brands: [], priceRange: { min: 0, max: 50000 } },
      categories: (catJson.data || []) as Category[],
      brands: (brandJson.data || []) as Brand[],
    };
  } catch (err) {
    console.error('Error fetching catalog data:', err);
    return {
      products: [],
      total: 0,
      facets: { categories: [], brands: [], priceRange: { min: 0, max: 50000 } },
      categories: [],
      brands: [],
    };
  }
}

export default async function ProductsCatalogPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const { products, total, facets, categories, brands } = await getProductsData(resolvedParams);

  const currentCategory = resolvedParams.category;
  const currentBrand = resolvedParams.brand;
  const currentSearch = resolvedParams.search;
  const currentSort = resolvedParams.sort || 'newest';
  const inStockOnly = resolvedParams.inStock === 'true';
  const onSaleOnly = resolvedParams.onSale === 'true';
  const currentSellerType = resolvedParams.sellerType;
  const currentLocation = resolvedParams.location;
  const currentSocket = resolvedParams.socket;
  const currentMinPrice = resolvedParams.minPrice;
  const currentMaxPrice = resolvedParams.maxPrice;

  const categoryObj = categories.find(c => c.id === currentCategory || c.slug === currentCategory);
  const brandObj = brands.find(b => b.id === currentBrand || b.slug === currentBrand);

  // Active filter items for pills
  const activePills: Array<{ label: string; removeQuery: Record<string, any> }> = [];

  if (categoryObj) {
    const q = { ...resolvedParams };
    delete q.category;
    activePills.push({ label: `Category: ${categoryObj.name}`, removeQuery: q });
  }
  if (brandObj) {
    const q = { ...resolvedParams };
    delete q.brand;
    activePills.push({ label: `Brand: ${brandObj.name}`, removeQuery: q });
  }
  if (currentSearch) {
    const q = { ...resolvedParams };
    delete q.search;
    activePills.push({ label: `Search: "${currentSearch}"`, removeQuery: q });
  }
  if (currentMinPrice || currentMaxPrice) {
    const q = { ...resolvedParams };
    delete q.minPrice;
    delete q.maxPrice;
    const priceText = currentMinPrice && currentMaxPrice
      ? `Price: AED ${currentMinPrice} - ${currentMaxPrice}`
      : currentMinPrice
      ? `Price: > AED ${currentMinPrice}`
      : `Price: < AED ${currentMaxPrice}`;
    activePills.push({ label: priceText, removeQuery: q });
  }
  if (inStockOnly) {
    const q = { ...resolvedParams };
    delete q.inStock;
    activePills.push({ label: 'In-Stock UAE Pool', removeQuery: q });
  }
  if (onSaleOnly) {
    const q = { ...resolvedParams };
    delete q.onSale;
    activePills.push({ label: 'Deals & Rebates', removeQuery: q });
  }
  if (currentSellerType) {
    const q = { ...resolvedParams };
    delete q.sellerType;
    activePills.push({
      label: currentSellerType === 'ADMIN' ? 'OEM Direct Only' : 'Verified Partners Only',
      removeQuery: q
    });
  }
  if (currentLocation) {
    const q = { ...resolvedParams };
    delete q.location;
    activePills.push({ label: `Hub: ${currentLocation}`, removeQuery: q });
  }
  if (currentSocket) {
    const q = { ...resolvedParams };
    delete q.socket;
    activePills.push({ label: `Socket: ${currentSocket}`, removeQuery: q });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-200">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1.5 font-medium">
            <Link href="/" className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors">Home</Link>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-900 dark:text-slate-200 font-bold">Catalog</span>
            {categoryObj && (
              <>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-tech-blue dark:text-cyan-400 font-bold capitalize">
                  {categoryObj.name}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Computer Hardware & Components</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise procurement platform with real-time stock allocation across UAE logistics hubs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center gap-2">
            <Boxes className="w-4 h-4 text-tech-blue dark:text-cyan-400" />
            <span>{total} {total === 1 ? 'Product Verified' : 'Products Verified'}</span>
          </span>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Matrix */}
        <div className="lg:col-span-1">
          <AdvancedCatalogFilter
            categories={categories}
            brands={brands}
            totalResults={total}
          />
        </div>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-5">
          {/* Active Filter Chips Bar */}
          {activePills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-tech-blue dark:text-cyan-400" />
                Active:
              </span>
              {activePills.map((pill, idx) => (
                <Link
                  key={idx}
                  href={{ pathname: '/products', query: pill.removeQuery }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-slate-300 dark:hover:text-red-400 border border-slate-200/80 dark:border-slate-700 transition-colors group"
                >
                  <span>{pill.label}</span>
                  <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                </Link>
              ))}

              <Link
                href="/products"
                className="text-[11px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 ml-auto flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear All</span>
              </Link>
            </div>
          )}

          {/* Sorting and Results Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentSearch ? (
                <span>Search results for &ldquo;<strong className="text-slate-900 dark:text-white">{currentSearch}</strong>&rdquo;</span>
              ) : (
                <span>Displaying <strong className="text-slate-900 dark:text-white">{products.length}</strong> of <strong className="text-slate-900 dark:text-white">{total}</strong> enterprise listings</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800">
                <Link
                  href={{ pathname: '/products', query: { ...resolvedParams, sort: 'newest' } }}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${currentSort === 'newest' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Newest
                </Link>
                <Link
                  href={{ pathname: '/products', query: { ...resolvedParams, sort: 'price_asc' } }}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${currentSort === 'price_asc' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Price: Low to High
                </Link>
                <Link
                  href={{ pathname: '/products', query: { ...resolvedParams, sort: 'price_desc' } }}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${currentSort === 'price_desc' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Price: High to Low
                </Link>
                <Link
                  href={{ pathname: '/products', query: { ...resolvedParams, sort: 'rating' } }}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${currentSort === 'rating' ? 'bg-tech-blue text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  Top Rated
                </Link>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400 mx-auto border border-slate-200 dark:border-slate-800">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">No Matching Hardware Components Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No SKUs matched your current filter criteria. Try clearing some filters or widening your budget range.
              </p>
              <Link
                href="/products"
                className="inline-block px-5 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-md shadow-tech-blue/20"
              >
                Reset All Filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
