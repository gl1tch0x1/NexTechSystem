import { Product, ProductVariant } from '@/types';

export interface ProductAvailabilityResult {
  isOutOfStock: boolean;
  isLowStock: boolean;
  isInStock: boolean;
  label: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Sold Out';
  badgeClass: string;
  stock: number;
}

export interface ProductConfigurations {
  hasRam: boolean;
  hasStorage: boolean;
  availableRam: string[];
  availableStorage: string[];
  ramToStorageMap: Record<string, string[]>;
  defaultRam?: string;
  defaultStorage?: string;
}

/**
 * Checks if a product or specific variant is out of stock / sold out.
 * Strictly adheres to safe fallbacks: missing or invalid inventory data is NOT assumed to be in stock.
 */
export function isProductOutOfStock(
  product?: Partial<Product> | null,
  selectedVariant?: ProductVariant | null
): boolean {
  if (!product) return true;

  // Explicit status overrides
  if (product.stockStatus === 'OUT_OF_STOCK') return true;
  if (product.approvalStatus === 'OUT_OF_STOCK') return true;
  if (product.status === 'ARCHIVED' || product.status === 'DRAFT' || product.isActive === false) return true;

  // If a specific variant is selected
  if (selectedVariant) {
    if (typeof selectedVariant.stock === 'number') {
      return selectedVariant.stock <= 0 && !product.allowBackorder;
    }
  }

  // If product has variants and no variant is explicitly selected:
  if (product.hasVariants && Array.isArray(product.variants) && product.variants.length > 0) {
    const allVariantsOutOfStock = product.variants.every(
      v => typeof v.stock === 'number' && v.stock <= 0
    );
    if (allVariantsOutOfStock && !product.allowBackorder) {
      return true;
    }
  }

  // Check product stock number
  if (typeof product.stock === 'number') {
    return product.stock <= 0 && !product.allowBackorder;
  }

  // Ambiguous or missing inventory data
  if (product.stock === undefined || product.stock === null || isNaN(product.stock)) {
    // If explicit stockStatus is IN_STOCK, trust it; otherwise fallback safely to out of stock
    if (product.stockStatus === 'IN_STOCK') return false;
    if (product.allowBackorder) return false;
    return true;
  }

  return false;
}

/**
 * Retrieves the full availability details and UI badges for a product or variant.
 */
export function getProductAvailability(
  product?: Partial<Product> | null,
  selectedVariant?: ProductVariant | null
): ProductAvailabilityResult {
  if (!product) {
    return {
      isOutOfStock: true,
      isLowStock: false,
      isInStock: false,
      label: 'Out of Stock',
      badgeClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60',
      stock: 0,
    };
  }

  const outOfStock = isProductOutOfStock(product, selectedVariant);
  const currentStock = typeof selectedVariant?.stock === 'number'
    ? selectedVariant.stock
    : typeof product.stock === 'number'
    ? product.stock
    : 0;

  if (outOfStock) {
    return {
      isOutOfStock: true,
      isLowStock: false,
      isInStock: false,
      label: 'Out of Stock',
      badgeClass: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60',
      stock: currentStock,
    };
  }

  const threshold = (product as any)?.lowStockThreshold || 5;
  const isLow = currentStock > 0 && currentStock <= threshold;

  if (isLow) {
    return {
      isOutOfStock: false,
      isLowStock: true,
      isInStock: true,
      label: 'Low Stock',
      badgeClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
      stock: currentStock,
    };
  }

  return {
    isOutOfStock: false,
    isLowStock: false,
    isInStock: true,
    label: 'In Stock',
    badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
    stock: currentStock,
  };
}

/**
 * Dynamically retrieves available RAM and Storage configurations for a product,
 * including variant dependencies (e.g. 16GB RAM restricts to 512GB, 32GB RAM restricts to 1TB).
 * Returns empty arrays and false flags when RAM or Storage is not applicable (e.g. switches, GPUs, peripherals).
 */
export function extractProductConfigurations(product?: Partial<Product> | null): ProductConfigurations {
  if (!product) {
    return {
      hasRam: false,
      hasStorage: false,
      availableRam: [],
      availableStorage: [],
      ramToStorageMap: {},
    };
  }

  const rawRamSet = new Set<string>();
  const rawStorageSet = new Set<string>();
  const ramToStorageMap: Record<string, Set<string>> = {};

  const catStr = (typeof product.category === 'string'
    ? product.category
    : product.category?.slug || product.categoryId || '').toLowerCase();
  const nameStr = `${product.name || ''} ${product.title || ''}`.toLowerCase();

  const recordPair = (ram?: string | null, storage?: string | null) => {
    const cleanRam = ram?.trim() || null;
    const cleanStorage = storage?.trim() || null;

    if (cleanRam) rawRamSet.add(cleanRam);
    if (cleanStorage) rawStorageSet.add(cleanStorage);

    if (cleanRam && cleanStorage) {
      if (!ramToStorageMap[cleanRam]) {
        ramToStorageMap[cleanRam] = new Set<string>();
      }
      ramToStorageMap[cleanRam].add(cleanStorage);
    }
  };

  // 1. Check Product Variants (Real Multi-SKU Variant combinations)
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    for (const v of product.variants) {
      let vRam: string | null = null;
      let vStorage: string | null = null;

      // Extract from v.options
      if (v.options && typeof v.options === 'object') {
        for (const [key, val] of Object.entries(v.options)) {
          if (typeof val === 'string' && val.trim()) {
            if (/^(ram|memory|system memory)$/i.test(key)) {
              vRam = val.trim();
            } else if (/^(storage|capacity|ssd|rom|internal storage|drive|hard drive)$/i.test(key)) {
              vStorage = val.trim();
            }
          }
        }
      }

      // If options didn't explicitly specify, inspect variant title (e.g. "16GB RAM / 512GB SSD / Silver")
      if ((!vRam || !vStorage) && v.title) {
        if (!vRam) {
          const ramMatch = v.title.match(/\b(4|6|8|12|16|24|32|48|64|96|128)\s*GB\s*(?:RAM|Memory|DDR[45])?\b/i);
          if (ramMatch) vRam = ramMatch[0].trim();
        }
        if (!vStorage) {
          const storageMatch = v.title.match(/\b(64|128|256|512)\s*GB(?:\s*(?:SSD|NVMe|PCIe|Storage|ROM))?\b|\b(1|2|4|8)\s*TB(?:\s*(?:SSD|NVMe|PCIe|Storage))?\b/i);
          if (storageMatch) vStorage = storageMatch[0].trim();
        }
      }

      if (vRam || vStorage) {
        recordPair(vRam, vStorage);
      }
    }
  }

  // 2. Check Variant Option Definitions (if variants array didn't contain explicit option keys)
  if (rawRamSet.size === 0 && Array.isArray(product.variantOptions)) {
    for (const optDef of product.variantOptions) {
      if (/^(ram|memory|system memory)$/i.test(optDef.name) && Array.isArray(optDef.values)) {
        optDef.values.forEach(val => {
          if (val && typeof val === 'string' && val.trim()) rawRamSet.add(val.trim());
        });
      }
    }
  }

  if (rawStorageSet.size === 0 && Array.isArray(product.variantOptions)) {
    for (const optDef of product.variantOptions) {
      if (/^(storage|capacity|ssd|rom|internal storage)$/i.test(optDef.name) && Array.isArray(optDef.values)) {
        optDef.values.forEach(val => {
          if (val && typeof val === 'string' && val.trim()) rawStorageSet.add(val.trim());
        });
      }
    }
  }

  // 3. Fallback for non-variant single-spec products based on domain category
  if (rawRamSet.size === 0 && rawStorageSet.size === 0) {
    const isMemoryProduct =
      catStr.includes('memory') ||
      /ddr[45]|desktop memory|ram kit|so-dimm/i.test(nameStr) ||
      (!!product.specifications?.ramType && !nameStr.includes('motherboard'));

    const isStorageProduct =
      catStr.includes('storage') ||
      /ssd|nvme|hard drive|m\.2/i.test(nameStr);

    const isSystemProduct =
      catStr.includes('laptop') ||
      catStr.includes('server') ||
      catStr.includes('desktop') ||
      /laptop|macbook|notebook|thinkpad|probook|server|poweredge|workstation|smartphone|iphone|galaxy|tablet|ipad/i.test(nameStr);

    if (isMemoryProduct && !isSystemProduct) {
      // Standalone RAM module
      const cap =
        product.specifications?.capacity ||
        (product as any)?.specs?.capacity;
      if (cap && typeof cap === 'string' && cap.trim()) {
        rawRamSet.add(cap.trim());
      } else {
        const match = nameStr.match(/\b(4|6|8|12|16|24|32|48|64|96|128)\s*GB(?:\s*\([^)]+\))?\b/i);
        if (match) rawRamSet.add(match[0].toUpperCase().trim());
      }
    } else if (isStorageProduct && !isSystemProduct) {
      // Standalone Storage / SSD
      const cap =
        product.specifications?.capacity ||
        product.specifications?.storage ||
        (product as any)?.specs?.capacity ||
        (product as any)?.specs?.storage;
      if (cap && typeof cap === 'string' && cap.trim()) {
        rawStorageSet.add(cap.trim());
      } else {
        const match = nameStr.match(/\b(64|128|256|512)\s*GB\b|\b(1|2|4|8)\s*TB\b/i);
        if (match) rawStorageSet.add(match[0].toUpperCase().trim());
      }
    } else if (isSystemProduct) {
      // Laptop, Server, Desktop, Smartphone, etc.
      const specRam =
        product.specifications?.['LAPTOP | RAM'] ||
        product.specifications?.['SERVER | RAM'] ||
        product.specifications?.ram ||
        product.specifications?.memory ||
        (product as any)?.specs?.ram;
      if (specRam && typeof specRam === 'string' && specRam.trim()) {
        rawRamSet.add(specRam.trim());
      }

      const specStorage =
        product.specifications?.['LAPTOP | Storage'] ||
        product.specifications?.['SERVER | Storage'] ||
        product.specifications?.storage ||
        product.specifications?.capacity ||
        (product as any)?.specs?.storage;
      if (specStorage && typeof specStorage === 'string' && specStorage.trim()) {
        rawStorageSet.add(specStorage.trim());
      }
    }
  }

  const availableRam = Array.from(rawRamSet);
  const availableStorage = Array.from(rawStorageSet);

  // Build finalized ramToStorageMap with variant dependency guarantees
  const finalizedMap: Record<string, string[]> = {};
  if (availableRam.length > 0 && availableStorage.length > 0) {
    for (const ram of availableRam) {
      if (ramToStorageMap[ram] && ramToStorageMap[ram].size > 0) {
        finalizedMap[ram] = Array.from(ramToStorageMap[ram]);
      } else {
        // Independent combinations fallback
        finalizedMap[ram] = availableStorage;
      }
    }
  }

  const defaultRam = availableRam.length > 0 ? availableRam[0] : undefined;
  let defaultStorage: string | undefined = undefined;

  if (availableStorage.length > 0) {
    if (defaultRam && finalizedMap[defaultRam] && finalizedMap[defaultRam].length > 0) {
      defaultStorage = finalizedMap[defaultRam][0];
    } else {
      defaultStorage = availableStorage[0];
    }
  }

  return {
    hasRam: availableRam.length > 0,
    hasStorage: availableStorage.length > 0,
    availableRam,
    availableStorage,
    ramToStorageMap: finalizedMap,
    defaultRam,
    defaultStorage,
  };
}

/**
 * Backward compatible storage extractor.
 */
export function extractStorageConfigurations(product?: Partial<Product> | null): string[] {
  return extractProductConfigurations(product).availableStorage;
}
