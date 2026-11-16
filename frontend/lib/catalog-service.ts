import { Product, Category, Brand } from '@/types';
import productsData from '@/data/products.json';
import categoriesData from '@/data/categories.json';
import brandsData from '@/data/brands.json';

const rawProducts = (productsData as unknown as Product[]) || [];
const rawCategories = (categoriesData as unknown as Category[]) || [];
const rawBrands = (brandsData as unknown as Brand[]) || [];

/**
 * Enterprise Computing Priority Scoring:
 * Ranks Flagship Laptops, Mobile Workstations, Gaming Systems, and Desktops
 * before loose pull-out RAM sticks, bare SSDs, and accessories.
 */
export function getProductDisplayPriority(p: Product): number {
  const name = (p.name || '').toLowerCase();
  const cat = (p.categoryName || '').toLowerCase();
  const brand = (p.brandName || '').toLowerCase();
  const sku = (p.sku || '').toLowerCase();

  // Loose pull-out components and generic spare parts have lowest priority
  if (name.includes('pull out') || brand.includes('pull out') || sku.includes('pullout')) {
    return 10;
  }

  // Accessories, Cables, Bags, Headsets, Mice
  if (
    cat.includes('accessory') ||
    cat.includes('bag') ||
    cat.includes('peripheral') ||
    cat.includes('headset') ||
    name.includes('cestus') ||
    name.includes('mouse') ||
    name.includes('keyboard') ||
    name.includes('docking')
  ) {
    return 20;
  }

  // 1. High-Performance Gaming Laptops
  if (
    cat.includes('gaming laptop') ||
    name.includes('alienware') ||
    name.includes('omen') ||
    name.includes('rog') ||
    name.includes('predator helios') ||
    name.includes('legion') ||
    name.includes('katana') ||
    name.includes('vector 16')
  ) {
    return 100;
  }

  // 2. Laptops, Mobile Workstations, Ultrabooks, MacBooks
  if (
    cat.includes('laptop') ||
    name.includes('macbook') ||
    name.includes('thinkpad') ||
    name.includes('zenbook') ||
    name.includes('xps') ||
    name.includes('latitude') ||
    name.includes('elitebook') ||
    name.includes('vivobook') ||
    name.includes('ideapad') ||
    name.includes('yoga')
  ) {
    return 95;
  }

  // 3. All-in-One PCs & Desktop Workstations
  if (
    cat.includes('all-in-one') ||
    cat.includes('desktop') ||
    name.includes('all in one') ||
    name.includes('optiplex') ||
    name.includes('ideacentre')
  ) {
    return 90;
  }

  // 4. Servers & Enterprise Infrastructure
  if (
    cat.includes('server') ||
    cat.includes('network') ||
    name.includes('poweredge') ||
    name.includes('cisco') ||
    name.includes('ubiquiti')
  ) {
    return 75;
  }

  // 5. Processors & Dedicated GPUs
  if (
    name.includes('rtx') ||
    name.includes('geforce') ||
    name.includes('ryzen') ||
    name.includes('core i9') ||
    name.includes('core i7') ||
    cat.includes('processor')
  ) {
    return 60;
  }
  if (cat.includes('component')) return 50;

  // 6. Displays & Storage
  if (cat.includes('monitor') || cat.includes('display')) return 45;
  if (cat.includes('storage') || name.includes('ssd') || name.includes('hdd')) return 40;

  return 30;
}

/** Pre-sorted verified authoritative product catalog */
const sortedCatalog: Product[] = [...rawProducts].sort((a, b) => {
  const featA = a.isFeatured ? 1 : 0;
  const featB = b.isFeatured ? 1 : 0;
  if (featB !== featA) return featB - featA;

  const prioA = getProductDisplayPriority(a);
  const prioB = getProductDisplayPriority(b);
  if (prioB !== prioA) return prioB - prioA;

  return 0;
});

export function getAllCatalogProducts(): Product[] {
  return sortedCatalog;
}

export function getCatalogCategories(): Category[] {
  return rawCategories;
}

export function getCatalogBrands(): Brand[] {
  return rawBrands;
}

export function getCatalogProductBySlug(slug: string): Product | null {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();
  return (
    sortedCatalog.find(
      p => p.slug?.toLowerCase() === cleanSlug || p.id === slug || p.sku?.toLowerCase() === cleanSlug
    ) || null
  );
}

export interface CatalogFilterOptions {
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
  inStock?: boolean | string;
  onSale?: boolean | string;
  sellerType?: string;
  featured?: boolean | string;
  sort?: string;
  status?: string;
  page?: number | string;
  limit?: number | string;
}

export interface CatalogFilterResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: {
    categories: Array<{ id: string; name: string; count: number }>;
    brands: Array<{ id: string; name: string; count: number }>;
    priceRange: { min: number; max: number };
  };
}

export function filterCatalogProducts(options: CatalogFilterOptions = {}): CatalogFilterResult {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Number(options.limit) || 10);

  const q = options.search ? String(options.search).toLowerCase().trim() : '';
  const categoryFilter = options.category ? String(options.category).toLowerCase().trim() : '';
  const brandFilter = options.brand ? String(options.brand).toLowerCase().trim() : '';
  const minPrice = options.minPrice !== undefined && options.minPrice !== '' ? Number(options.minPrice) : null;
  const maxPrice = options.maxPrice !== undefined && options.maxPrice !== '' ? Number(options.maxPrice) : null;
  const inStockOnly = options.inStock === true || options.inStock === 'true' || options.inStock === '1';
  const onSaleOnly = options.onSale === true || options.onSale === 'true' || options.onSale === '1';
  const featuredOnly = options.featured === true || options.featured === 'true' || options.featured === '1';
  const sellerTypeFilter = options.sellerType ? String(options.sellerType).toUpperCase().trim() : '';

  let filtered = sortedCatalog.filter(p => {
    if (featuredOnly && !p.isFeatured) return false;
    if (inStockOnly && (p.stock || 0) <= 0) return false;
    if (onSaleOnly) {
      const hasDiscount = (p.salePrice && p.salePrice < p.price) || (p.compareAtPrice && p.compareAtPrice > p.price);
      if (!hasDiscount) return false;
    }
    if (sellerTypeFilter && (p.sellerType || 'ADMIN').toUpperCase() !== sellerTypeFilter) return false;

    // Status filter (for Admin & Vendor views)
    if (options.status && options.status !== 'ALL') {
      const targetStatus = options.status.toUpperCase();
      if (targetStatus === 'APPROVED') {
        if (p.approvalStatus !== 'APPROVED' && p.approvalStatus !== 'ACTIVE') return false;
      } else if (targetStatus === 'PENDING' || targetStatus === 'PENDING_APPROVAL') {
        if (p.approvalStatus !== 'PENDING_APPROVAL') return false;
      } else if (targetStatus === 'REJECTED') {
        if (p.approvalStatus !== 'REJECTED') return false;
      } else if (targetStatus === 'LOW_STOCK') {
        if ((p.stock || 0) > (p.lowStockThreshold || 5)) return false;
      }
    }

    const price = p.salePrice || p.price || 0;
    if (minPrice !== null && !isNaN(minPrice) && price < minPrice) return false;
    if (maxPrice !== null && !isNaN(maxPrice) && price > maxPrice) return false;

    if (categoryFilter) {
      const matchCat =
        p.categoryId?.toLowerCase() === categoryFilter ||
        p.categoryName?.toLowerCase() === categoryFilter ||
        p.categoryName?.toLowerCase().includes(categoryFilter);
      if (!matchCat) return false;
    }

    if (brandFilter) {
      const matchBrand =
        p.brandId?.toLowerCase() === brandFilter ||
        p.brandName?.toLowerCase() === brandFilter ||
        p.brandName?.toLowerCase().includes(brandFilter);
      if (!matchBrand) return false;
    }

    if (q) {
      const name = (p.name || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const bName = (p.brandName || '').toLowerCase();
      const cName = (p.categoryName || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const match =
        name.includes(q) ||
        sku.includes(q) ||
        bName.includes(q) ||
        cName.includes(q) ||
        desc.includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Sorting
  const sort = (options.sort || 'featured').toLowerCase();
  filtered = [...filtered].sort((a, b) => {
    const priceA = a.salePrice || a.price || 0;
    const priceB = b.salePrice || b.price || 0;

    if (sort === 'price_asc' || sort === 'price-asc') return priceA - priceB;
    if (sort === 'price_desc' || sort === 'price-desc') return priceB - priceA;
    if (sort === 'stock_desc' || sort === 'stock-desc') return (b.stock || 0) - (a.stock || 0);
    if (sort === 'stock_asc' || sort === 'stock-asc') return (a.stock || 0) - (b.stock || 0);
    if (sort === 'name_asc' || sort === 'name-asc') return (a.name || a.title || '').localeCompare(b.name || b.title || '');
    if (sort === 'newest') {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    }

    // Default 'featured': Laptops & systems first, featured first
    const featA = a.isFeatured ? 1 : 0;
    const featB = b.isFeatured ? 1 : 0;
    if (featB !== featA) return featB - featA;

    const prioA = getProductDisplayPriority(a);
    const prioB = getProductDisplayPriority(b);
    if (prioB !== prioA) return prioB - prioA;

    return 0;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const pagedProducts = filtered.slice(startIndex, startIndex + limit);

  // Calculate facets
  const catCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};
  let minP = Infinity;
  let maxP = -Infinity;

  for (const p of sortedCatalog) {
    if (p.categoryId) catCounts[p.categoryId] = (catCounts[p.categoryId] || 0) + 1;
    if (p.brandId) brandCounts[p.brandId] = (brandCounts[p.brandId] || 0) + 1;
    const pPrice = p.salePrice || p.price || 0;
    if (pPrice < minP) minP = pPrice;
    if (pPrice > maxP) maxP = pPrice;
  }

  const categoryFacets = rawCategories.map(c => ({
    id: c.id,
    name: c.name,
    count: catCounts[c.id] || 0,
  }));

  const brandFacets = rawBrands.map(b => ({
    id: b.id,
    name: b.name,
    count: brandCounts[b.id] || 0,
  }));

  return {
    products: pagedProducts,
    total,
    page,
    limit,
    totalPages,
    facets: {
      categories: categoryFacets,
      brands: brandFacets,
      priceRange: {
        min: minP === Infinity ? 0 : minP,
        max: maxP === -Infinity ? 50000 : maxP,
      },
    },
  };
}
