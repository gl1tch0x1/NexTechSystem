import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { Product, Category, Brand } from '@/types';
import { Filter, SlidersHorizontal, ArrowUpDown, Search, RotateCcw } from 'lucide-react';

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
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

    const res = await fetch(`http://localhost:5000/api/products?${qs.toString()}`, { cache: 'no-store' });
    const json = await res.json();

    const catRes = await fetch('http://localhost:5000/api/products/categories', { next: { revalidate: 60 } });
    const catJson = await catRes.json();

    const brandRes = await fetch('http://localhost:5000/api/products/brands', { next: { revalidate: 60 } });
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-200">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Link href="/" className="hover:text-tech-blue">Home</Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-200 font-bold">Catalog</span>
            {currentCategory && (
              <>
                <span>/</span>
                <span className="text-tech-blue capitalize">
                  {categories.find(c => c.id === currentCategory)?.name || currentCategory}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Computer Hardware & Components
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {total} {total === 1 ? 'Product Found' : 'Products Available'}
          </span>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <aside className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
              Filter Catalog
            </h3>
            {(currentCategory || currentBrand || currentSearch || inStockOnly) && (
              <Link
                href="/products"
                className="text-[11px] text-red-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </Link>
            )}
          </div>

          {/* Categories Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Categories</h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <Link
                href={{ pathname: '/products', query: { ...resolvedParams, category: undefined } }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  !currentCategory
                    ? 'bg-tech-blue text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Categories</span>
                <span>{total}</span>
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={{ pathname: '/products', query: { ...resolvedParams, category: cat.id } }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    currentCategory === cat.id
                      ? 'bg-tech-blue text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[11px] opacity-75">{cat.productCount}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Manufacturer Brands</h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <Link
                href={{ pathname: '/products', query: { ...resolvedParams, brand: undefined } }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  !currentBrand
                    ? 'bg-tech-blue text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Brands</span>
              </Link>
              {brands.map(brand => (
                <Link
                  key={brand.id}
                  href={{ pathname: '/products', query: { ...resolvedParams, brand: brand.id } }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    currentBrand === brand.id
                      ? 'bg-tech-blue text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{brand.name}</span>
                  <span className="text-[11px] opacity-75">{brand.productCount}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Stock Filter Toggle */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={{
                pathname: '/products',
                query: { ...resolvedParams, inStock: inStockOnly ? undefined : 'true' },
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                inStockOnly
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-tech-blue'
              }`}
            >
              <span>In-Stock Hardware Only</span>
              <span>{inStockOnly ? '✓' : ''}</span>
            </Link>
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting and Active Search Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentSearch ? (
                <span>Search results for &ldquo;<strong className="text-slate-900 dark:text-white">{currentSearch}</strong>&rdquo;</span>
              ) : (
                <span>Showing official & verified partner listings</span>
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
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400 mx-auto border border-slate-200 dark:border-slate-800">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Matching Products Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Try loosening your filters, checking for spelling errors, or browsing our full category directory.
              </p>
              <Link
                href="/products"
                className="inline-block px-4 py-2 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
              >
                Clear All Filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
