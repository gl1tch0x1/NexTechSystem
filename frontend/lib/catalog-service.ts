import { Product, Category, Brand } from '@/types';
import productsData from '@/data/products.json';
import categoriesData from '@/data/categories.json';
import brandsData from '@/data/brands.json';

const rawProducts = (productsData as unknown as Product[]) || [];
let catalogProductsStore: Product[] = [...rawProducts];
let lastCatalogMtime = 0;
const rawCategories = (categoriesData as unknown as Category[]) || [];
const rawBrands = (brandsData as unknown as Brand[]) || [];

/**
 * Synchronizes catalogProductsStore directly with verified data file on disk if modified.
 * Avoids TOCTOU race conditions (CWE-367 / js/file-system-race) by using file descriptors.
 */
function syncCatalogStoreFromDisk(): void {
  if (typeof window === 'undefined') {
    try {
      const fs = require('fs');
      const path = require('path');
      const candidatePaths = [
        path.resolve(process.cwd(), 'frontend', 'data', 'products.json'),
        path.resolve(process.cwd(), 'data', 'products.json'),
        path.resolve(process.cwd(), 'backend', 'data_store', 'products.json'),
        path.resolve(process.cwd(), '..', 'backend', 'data_store', 'products.json'),
      ];
      for (const p of candidatePaths) {
        let fd: number | null = null;
        try {
          fd = fs.openSync(p, 'r');
          const stat = fs.fstatSync(fd);
          if (stat.mtimeMs > lastCatalogMtime) {
            const raw = fs.readFileSync(fd, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              catalogProductsStore = parsed;
              lastCatalogMtime = stat.mtimeMs;
              break;
            }
          }
        } catch {
          // File does not exist or unreadable; continue to next path
        } finally {
          if (fd !== null) {
            try { fs.closeSync(fd); } catch {}
          }
        }
      }
    } catch {
      // Non-fatal if filesystem is restricted
    }
  }
}

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

export function getSortedCatalog(): Product[] {
  syncCatalogStoreFromDisk();
  return [...catalogProductsStore].sort((a, b) => {
    const featA = a.isFeatured ? 1 : 0;
    const featB = b.isFeatured ? 1 : 0;
    if (featB !== featA) return featB - featA;

    const prioA = getProductDisplayPriority(a);
    const prioB = getProductDisplayPriority(b);
    if (prioB !== prioA) return prioB - prioA;

    return 0;
  });
}

export function getAllCatalogProducts(): Product[] {
  return getSortedCatalog();
}

export function getCatalogCategories(): Category[] {
  return rawCategories;
}

export function getCatalogBrands(): Brand[] {
  return rawBrands;
}

export function getCatalogProductBySlug(slug: string): Product | null {
  if (!slug) return null;
  syncCatalogStoreFromDisk();
  const cleanSlug = slug.toLowerCase().trim();
  return (
    catalogProductsStore.find(
      p =>
        p.slug?.toLowerCase() === cleanSlug ||
        p.id?.toLowerCase() === cleanSlug ||
        p.sku?.toLowerCase() === cleanSlug
    ) || null
  );
}

function persistCatalogToFile(): void {
  try {
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');
      const targetPaths = [
        path.resolve(process.cwd(), 'data', 'products.json'),
        path.resolve(process.cwd(), 'frontend', 'data', 'products.json'),
        path.resolve(process.cwd(), '..', 'frontend', 'data', 'products.json'),
        path.resolve(process.cwd(), 'backend', 'data_store', 'products.json'),
        path.resolve(process.cwd(), '..', 'backend', 'data_store', 'products.json'),
        path.resolve(process.cwd(), 'data_store', 'products.json'),
        path.resolve(process.cwd(), '..', 'data_store', 'products.json'),
      ];
      const dataBuf = Buffer.from(JSON.stringify(catalogProductsStore, null, 2), 'utf8');
      for (const p of targetPaths) {
        let fd: number | null = null;
        try {
          // Open with 'r+' which atomically requires the file to exist, avoiding TOCTOU race conditions (CWE-367 / js/file-system-race)
          fd = fs.openSync(p, 'r+');
          fs.ftruncateSync(fd, 0);
          fs.writeSync(fd, dataBuf, 0, dataBuf.length, 0);
        } catch {
          // Path does not exist or is not accessible in current environment; proceed
        } finally {
          if (fd !== null) {
            try {
              fs.closeSync(fd);
            } catch {
              // Ignore descriptor close errors
            }
          }
        }
      }
      lastCatalogMtime = Date.now();
    }
  } catch {
    // Non-fatal if serverless filesystem is read-only
  }
}

export function updateCatalogProduct(id: string, updates: Partial<Product>): Product | null {
  if (!id && !updates.id && !updates.slug) return null;
  const targetId = (id || updates.id || updates.slug || '').trim().toLowerCase();
  const idx = catalogProductsStore.findIndex(
    p =>
      p.id?.toLowerCase() === targetId ||
      p.slug?.toLowerCase() === targetId ||
      p.sku?.toLowerCase() === targetId
  );

  const primaryImg =
    updates.primaryImage ||
    updates.thumbnail ||
    (updates as any).image ||
    (updates.images && updates.images[0]) ||
    '';

  if (idx === -1) {
    if (updates.name || updates.title) {
      const newImages = updates.images && updates.images.length > 0
        ? updates.images
        : (primaryImg ? [primaryImg] : []);
      const newProd = {
        id: updates.id || `prod_${Date.now()}`,
        slug:
          updates.slug ||
          (updates.name || updates.title || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-'),
        name: updates.name || updates.title || '',
        price: updates.price || 0,
        ...updates,
        primaryImage: primaryImg || (updates as any).primaryImage || '',
        thumbnail: primaryImg || (updates as any).thumbnail || '',
        images: newImages,
        updatedAt: new Date().toISOString(),
      } as Product;
      catalogProductsStore.unshift(newProd);
      persistCatalogToFile();
      return newProd;
    }
    return null;
  }

  const existing = catalogProductsStore[idx];
  const finalPrimaryImg =
    updates.primaryImage !== undefined
      ? updates.primaryImage
      : (primaryImg ||
        existing.primaryImage ||
        existing.thumbnail ||
        (existing as any).image ||
        (existing.images && existing.images[0]) ||
        '');

  const finalImages =
    updates.images !== undefined && Array.isArray(updates.images)
      ? updates.images
      : (existing.images && existing.images.length > 0
        ? existing.images
        : (finalPrimaryImg ? [finalPrimaryImg] : []));

  const updated: Product = {
    ...existing,
    ...updates,
    title: updates.title || updates.name || existing.title || existing.name || '',
    name: updates.name || updates.title || existing.name || existing.title || '',
    primaryImage: finalPrimaryImg,
    thumbnail: finalPrimaryImg,
    image: finalPrimaryImg,
    images: finalImages,
    updatedAt: new Date().toISOString(),
  };

  catalogProductsStore[idx] = updated;
  persistCatalogToFile();

  return updated;
}

export interface CatalogFilterOptions {
  category?: string;
  subCategory?: string;
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

  let filtered = getSortedCatalog().filter(p => {
    if (featuredOnly && !p.isFeatured) return false;
    if (inStockOnly && (p.stock || 0) <= 0) return false;
    if (onSaleOnly) {
      const hasDiscount = (p.salePrice && p.salePrice < p.price) || (p.compareAtPrice && p.compareAtPrice > p.price);
      if (!hasDiscount) return false;
    }
    if (sellerTypeFilter && (p.sellerType || 'ADMIN').toUpperCase() !== sellerTypeFilter) return false;

    // Sub-Category / Use-Case precision filtering
    if (options.subCategory) {
      const sub = options.subCategory.toLowerCase().trim();
      const name = (p.name || p.title || '').toLowerCase();
      const cat = (p.categoryName || '').toLowerCase();

      let matchesSub = false;
      if (sub === 'gaming') {
        matchesSub =
          cat.includes('gaming') ||
          name.includes('alienware') ||
          name.includes('omen') ||
          name.includes('rog') ||
          name.includes('legion') ||
          name.includes('katana') ||
          name.includes('nitro') ||
          name.includes('predator') ||
          name.includes('vector') ||
          name.includes('tuf') ||
          name.includes('cyborg') ||
          name.includes('loq');
      } else if (sub === 'work' || sub === 'professional') {
        matchesSub =
          name.includes('thinkpad') ||
          name.includes('latitude') ||
          name.includes('expertbook') ||
          name.includes('probook') ||
          name.includes('elitebook') ||
          name.includes('macbook') ||
          name.includes('precision') ||
          name.includes('zbook') ||
          name.includes('xps') ||
          name.includes('commercial');
      } else if (sub === 'basics' || sub === 'everyday') {
        matchesSub =
          name.includes('vivobook') ||
          name.includes('zenbook') ||
          name.includes('aspire') ||
          name.includes('inspiron') ||
          name.includes('ideapad') ||
          name.includes('yoga') ||
          name.includes('swift') ||
          name.includes('pavilion') ||
          name.includes('essential') ||
          name.includes('touchscreen') ||
          name.includes('chromebook');
      } else if (sub === 'nvme' || sub === 'ssd') {
        matchesSub =
          name.includes('nvme') ||
          name.includes('m.2') ||
          name.includes('ssd') ||
          name.includes('firecuda') ||
          name.includes('crucial');
      } else if (sub === 'hdd') {
        matchesSub =
          name.includes('hdd') ||
          name.includes('wd blue') ||
          name.includes('3.5') ||
          name.includes('2.5') ||
          name.includes('hard drive');
      } else if (sub === 'flash') {
        matchesSub =
          name.includes('adata') ||
          name.includes('docking') ||
          name.includes('flash') ||
          name.includes('bracket') ||
          name.includes('enclosure');
      } else if (sub === 'aio') {
        matchesSub =
          cat.includes('all-in-one') ||
          name.includes('all in one') ||
          name.includes('aio') ||
          name.includes('ideacentre');
      } else if (sub === 'desktop' || sub === 'tower') {
        matchesSub =
          cat.includes('desktop') ||
          name.includes('desktop') ||
          name.includes('tower') ||
          name.includes('axc');
      } else if (sub === 'cpu') {
        matchesSub =
          name.includes('cpu') ||
          name.includes('processor') ||
          name.includes('intel core') ||
          name.includes('i9-') ||
          name.includes('ryzen');
      } else if (sub === 'ram') {
        matchesSub =
          name.includes('ram') ||
          name.includes('ddr5') ||
          name.includes('ddr4') ||
          name.includes('ddr3') ||
          name.includes('ddr2') ||
          name.includes('sodimm');
      } else if (sub === 'network' || sub === 'switch') {
        matchesSub =
          name.includes('switch') ||
          name.includes('poe') ||
          cat.includes('network') ||
          name.includes('cisco') ||
          name.includes('aruba') ||
          name.includes('fortinet') ||
          name.includes('ubiquiti');
      } else if (sub === 'gaming_monitor' || sub === 'gaming-display') {
        matchesSub =
          cat.includes('monitor') &&
          (name.includes('gaming') || name.includes('144hz') || name.includes('165hz') || name.includes('240hz') || name.includes('curved') || name.includes('predator') || name.includes('nitro'));
      } else if (sub === 'pro_monitor' || sub === 'work-display') {
        matchesSub =
          cat.includes('monitor') &&
          !name.includes('gaming') && !name.includes('144hz') && !name.includes('165hz');
      }

      if (!matchesSub) return false;
    }

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
        p.categoryName?.toLowerCase().includes(categoryFilter) ||
        (categoryFilter.includes('laptop') && ((p.categoryName || '').toLowerCase().includes('laptop') || (p.categoryId || '').toLowerCase().includes('laptop'))) ||
        (categoryFilter.includes('storage') && ((p.categoryName || '').toLowerCase().includes('storage') || (p.categoryId || '').toLowerCase().includes('storage'))) ||
        ((categoryFilter.includes('all-in-one') || categoryFilter.includes('all_in_one') || categoryFilter.includes('desktop')) &&
          ((p.categoryName || '').toLowerCase().includes('desktop') || (p.categoryName || '').toLowerCase().includes('all-in-one') || (p.categoryId || '').toLowerCase().includes('desktop') || (p.categoryId || '').toLowerCase().includes('all_in_one')));
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

  for (const p of catalogProductsStore) {
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
