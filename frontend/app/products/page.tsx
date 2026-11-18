import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { AdvancedCatalogFilter } from '@/components/product/AdvancedCatalogFilter';
import { Product, Category, Brand } from '@/types';
import {
  Filter,
  ArrowUpDown,
  Search,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-client';
import {
  filterCatalogProducts,
  getCatalogCategories,
  getCatalogBrands,
} from '@/lib/catalog-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    subCategory?: string;
    subType?: string;
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

const SUB_CATEGORY_LABELS: Record<string, string> = {
  gaming: 'Gaming & High-Performance',
  work: 'Work & Professional',
  basics: 'Everyday & Ultra-Slim',
  everyday: 'Everyday & Ultra-Slim',
  nvme: 'High-Speed NVMe & M.2 SSDs',
  ssd: 'Solid State Drives (SSDs)',
  hdd: 'Mechanical Hard Drives (HDDs)',
  flash: 'Flash, Enclosures & Docks',
  aio: 'All-in-One Desktop PCs',
  desktop: 'Tower Workstations & Desktops',
  ram: 'DDR5 & DDR4 Memory (RAM)',
  cpu: 'Processors (CPUs)',
  network: 'Managed PoE & Switches',
};

/**
 * Smart windowed page numbers generator:
 * Produces accessible, clean arrays like [1, 2, 3, 4, 5, '...', 31] or [1, '...', 14, 15, 16, '...', 31].
 */
function getPaginationItems(currentPage: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

async function getProductsData(params: Record<string, any>) {
  let products: Product[] = [];
  let total = 0;
  let page = Math.max(1, Number(params.page) || 1);
  const limit = 10; // strictly 10 products per page
  let totalPages = 1;
  let facets: any = null;
  let categories: Category[] = [];
  let brands: Brand[] = [];

  try {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) qs.append(k, v);
    }
    // Strictly enforce 10 listings per page
    qs.set('limit', String(limit));
    if (!qs.has('page')) qs.set('page', String(page));

    const res = await fetch(getApiUrl(`/products?${qs.toString()}`), { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      products = (json.data || []) as Product[];
      total = json.meta?.total || products.length;
      page = json.meta?.page || page;
      totalPages = json.meta?.totalPages || Math.ceil(total / limit) || 1;
      facets = json.meta?.facets;
    }

    const catRes = await fetch(getApiUrl('/products/categories'), { cache: 'no-store' });
    if (catRes.ok) {
      const catJson = await catRes.json();
      categories = (catJson.data || []) as Category[];
    }

    const brandRes = await fetch(getApiUrl('/products/brands'), { cache: 'no-store' });
    if (brandRes.ok) {
      const brandJson = await brandRes.json();
      brands = (brandJson.data || []) as Brand[];
    }
  } catch (err) {
    console.warn('[Products] Error fetching catalog data from backend API:', err);
  }

  // If remote backend returned sparse or incomplete products, seamlessly populate from verified catalog
  if (products.length <= 2 && total <= 2) {
    const catalogResult = filterCatalogProducts({
      ...params,
      page,
      limit,
    });
    products = catalogResult.products;
    total = catalogResult.total;
    page = catalogResult.page;
    totalPages = catalogResult.totalPages;
    if (!facets || !facets.categories || facets.categories.length === 0) {
      facets = catalogResult.facets;
    }
  }

  if (categories.length === 0) {
    categories = getCatalogCategories();
  }
  if (brands.length === 0) {
    brands = getCatalogBrands();
  }

  if (!facets) {
    facets = {
      categories: categories.map(c => ({ id: c.id, name: c.name, count: c.productCount || 0 })),
      brands: brands.map(b => ({ id: b.id, name: b.name, count: b.productCount || 0 })),
      priceRange: { min: 0, max: 50000 },
    };
  }

  return {
    products,
    total,
    page,
    limit,
    totalPages,
    facets,
    categories,
    brands,
  };
}

export default async function ProductsCatalogPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const { products, total, page, limit, totalPages, categories, brands } = await getProductsData(resolvedParams);

  const currentCategory = resolvedParams.category;
  const currentSubCategory = resolvedParams.subCategory || resolvedParams.subType;
  const currentBrand = resolvedParams.brand;
  const currentSearch = resolvedParams.search;
  const currentSort = resolvedParams.sort || 'newest';
  const currentMinPrice = resolvedParams.minPrice;
  const currentMaxPrice = resolvedParams.maxPrice;
  const currentInStock = resolvedParams.inStock === 'true';
  const currentOnSale = resolvedParams.onSale === 'true';
  const currentSellerType = resolvedParams.sellerType;

  const categoryObj = categories.find(c => c.id === currentCategory || c.slug === currentCategory);
  const brandObj = brands.find(b => b.id === currentBrand || b.slug === currentBrand);

  // Active filter items for pills
  const activePills: Array<{ label: string; removeQuery: Record<string, any> }> = [];

  if (categoryObj) {
    const q = { ...resolvedParams };
    delete q.category;
    delete q.subCategory;
    delete q.subType;
    delete q.page;
    activePills.push({ label: `Category: ${categoryObj.name}`, removeQuery: q });
  }
  if (currentSubCategory) {
    const q = { ...resolvedParams };
    delete q.subCategory;
    delete q.subType;
    delete q.page;
    const subLabel = SUB_CATEGORY_LABELS[currentSubCategory.toLowerCase()] || currentSubCategory;
    activePills.push({ label: `Workload: ${subLabel}`, removeQuery: q });
  }
  if (brandObj) {
    const q = { ...resolvedParams };
    delete q.brand;
    delete q.page;
    activePills.push({ label: `Brand: ${brandObj.name}`, removeQuery: q });
  }
  if (currentSearch) {
    const q = { ...resolvedParams };
    delete q.search;
    delete q.page;
    activePills.push({ label: `Search: "${currentSearch}"`, removeQuery: q });
  }
  if (currentMinPrice || currentMaxPrice) {
    const q = { ...resolvedParams };
    delete q.minPrice;
    delete q.maxPrice;
    delete q.page;
    const priceText = currentMinPrice && currentMaxPrice
      ? `Price: AED ${currentMinPrice} - ${currentMaxPrice}`
      : currentMinPrice
      ? `Price: > AED ${currentMinPrice}`
      : `Price: < AED ${currentMaxPrice}`;
    activePills.push({ label: priceText, removeQuery: q });
  }
  if (currentInStock) {
    const q = { ...resolvedParams };
    delete q.inStock;
    delete q.page;
    activePills.push({ label: 'In-Stock UAE Pool Only', removeQuery: q });
  }
  if (currentOnSale) {
    const q = { ...resolvedParams };
    delete q.onSale;
    delete q.page;
    activePills.push({ label: 'Discounted / Deals Only', removeQuery: q });
  }
  if (currentSellerType === 'ADMIN') {
    const q = { ...resolvedParams };
    delete q.sellerType;
    delete q.page;
    activePills.push({ label: 'Tier-1 Direct OEM Only', removeQuery: q });
  }

  // Helper to build canonical page URL preserving all active filters
  const buildPageUrl = (targetPage: number) => {
    const q: Record<string, string> = {};
    for (const [k, v] of Object.entries(resolvedParams)) {
      if (v && k !== 'page' && k !== 'limit') {
        q[k] = String(v);
      }
    }
    if (targetPage > 1) {
      q.page = String(targetPage);
    }
    return { pathname: '/products', query: q };
  };

  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);
  const paginationItems = getPaginationItems(page, totalPages);

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
                <Link
                  href={{ pathname: '/products', query: { category: categoryObj.id } }}
                  className="hover:text-tech-blue dark:hover:text-cyan-400 transition-colors capitalize"
                >
                  {categoryObj.name}
                </Link>
              </>
            )}
            {currentSubCategory && (
              <>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-tech-blue dark:text-cyan-400 font-bold capitalize">
                  {SUB_CATEGORY_LABELS[currentSubCategory.toLowerCase()] || currentSubCategory}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Computer Hardware & Components</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 font-mono font-bold border border-blue-200 dark:border-blue-800">
              {total} Total Listings
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise procurement platform with real-time stock allocation across UAE logistics hubs.
          </p>
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
        <div className="lg:col-span-3 space-y-6">
          {/* Active Filter Chips Bar */}
          {activePills.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                Active:
              </span>
              {activePills.map((pill, idx) => (
                <Link
                  key={idx}
                  href={{ pathname: '/products', query: pill.removeQuery }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-slate-300 dark:hover:text-red-400 border border-slate-200/80 dark:border-slate-700 transition-colors group"
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
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {currentSearch ? (
                <span>
                  Search results for &ldquo;<strong className="text-slate-900 dark:text-white">{currentSearch}</strong>&rdquo; &bull; Showing{' '}
                  <strong className="text-slate-900 dark:text-white">{startItem}–{endItem}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{total}</strong>
                </span>
              ) : (
                <span>
                  Displaying <strong className="text-slate-900 dark:text-white">{startItem}–{endItem}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{total}</strong> enterprise listings{' '}
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">(Page {page} of {totalPages})</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800">
                <Link
                  href={{ pathname: '/products', query: { ...resolvedParams, sort: 'newest', page: undefined } }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    currentSort === 'newest'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Newest
                </Link>
                <Link
                  href={{ pathname: '/products', query: { ...resolvedParams, sort: 'price_asc', page: undefined } }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    currentSort === 'price_asc'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Price: Low to High
                </Link>
                <Link
                  href={{ pathname: '/products', query: { ...resolvedParams, sort: 'price_desc', page: undefined } }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    currentSort === 'price_desc'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Price: High to Low
                </Link>
                <Link
                  href={{ pathname: '/products', query: { ...resolvedParams, sort: 'rating', page: undefined } }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    currentSort === 'rating'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Top Rated
                </Link>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Enhanced Enterprise Pagination Bar */}
              {totalPages > 1 && (
                <nav
                  aria-label="Catalog pagination"
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-8"
                >
                  {/* Left: Summary Count */}
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                    Showing <strong className="text-slate-900 dark:text-white font-mono">{startItem}</strong> to{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">{endItem}</strong> of{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">{total}</strong> products
                  </div>

                  {/* Right: Page Navigation Controls */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {/* First Page Button */}
                    {page > 2 && totalPages > 5 && (
                      <Link
                        href={buildPageUrl(1)}
                        title="First Page"
                        aria-label="Go to first page"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Link>
                    )}

                    {/* Previous Page Button */}
                    {page > 1 ? (
                      <Link
                        href={buildPageUrl(page - 1)}
                        aria-label="Go to previous page"
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Prev</span>
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 flex items-center gap-1 text-xs font-bold cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Prev</span>
                      </span>
                    )}

                    {/* Number Pills with Smart Windowing */}
                    <div className="flex items-center gap-1">
                      {paginationItems.map((item, idx) => {
                        if (item === '...') {
                          return (
                            <span
                              key={`ellipsis-${idx}`}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold text-xs select-none"
                            >
                              &hellip;
                            </span>
                          );
                        }

                        const targetPage = item as number;
                        const isActive = targetPage === page;

                        return (
                          <Link
                            key={`page-${targetPage}`}
                            href={buildPageUrl(targetPage)}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={`Page ${targetPage}`}
                            className={`min-w-8 h-8 px-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 border border-blue-600'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            {targetPage}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Next Page Button */}
                    {page < totalPages ? (
                      <Link
                        href={buildPageUrl(page + 1)}
                        aria-label="Go to next page"
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-bold"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <span
                        aria-disabled="true"
                        className="px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/50 text-slate-300 dark:text-slate-700 flex items-center gap-1 text-xs font-bold cursor-not-allowed"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}

                    {/* Last Page Button */}
                    {page < totalPages - 1 && totalPages > 5 && (
                      <Link
                        href={buildPageUrl(totalPages)}
                        title="Last Page"
                        aria-label="Go to last page"
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-8 space-y-4 shadow-xs">
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
