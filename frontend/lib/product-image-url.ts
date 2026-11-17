import { Product } from '@/types';

/**
 * Validates, normalizes, and sanitizes product image URLs.
 * Automatically upgrades http to https and supports site-relative (/images/...) assets.
 */
export function productImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let input = value.trim();
  if (!input || /[\u0000-\u001f\u007f\\<>"']/.test(input)) return null;

  // Automatically upgrade insecure http to https
  if (/^http:\/\//i.test(input)) {
    input = input.replace(/^http:\/\//i, 'https://');
  }

  const relative = input.startsWith('/') && !input.startsWith('//');
  if (!relative && !/^https:\/\//i.test(input)) return null;

  try {
    const url = new URL(input, 'https://nextechsystem.com');
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return relative ? url.pathname + url.search + url.hash : url.href;
  } catch {
    return null;
  }
}

/**
 * Detects whether an image URL is an unconfigured generic placeholder.
 */
export function isPlaceholderImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const clean = url.trim().toLowerCase();
  if (clean === '') return true;

  // Known stock placeholders from initial automated Excel inventory imports
  const placeholders = [
    'photo-1517336714731-489689fd1ca8', // Generic laptop top
    'photo-1603302576837-37561b2e2302', // Generic gaming laptop purple neon keyboard
    'photo-1541807084-5c52b6b3adef', // Generic laptop angle
    'photo-1591799264318-7e6ef8ddb7ea', // Generic CPU stock
    'photo-1587831990711-23ca6441447b', // Generic AIO
    'photo-1588872657578-7efd1f1555ed', // Generic Dell
    'photo-1496181133206-80ce9b88a853', // Generic Asus
    'photo-1525547719571-a2d4ac8945e2', // Generic HP
    'photo-1593640408182-31c70c8268f5', // Generic desktop
    'photo-1562976540-1502c2145186', // Generic RAM
    'photo-1597872200969-2b65d56bd16b', // Generic SSD
    'photo-1531492746076-161ca9bcad58', // Generic HDD
    'photo-1618384887929-16ec33fab9ef', // Generic mouse
    'photo-1553062407-98eeb64c6a62', // Generic bag
    'photo-1550751827-4bd374c3f58b', // Generic network
    'photo-1587202372775-e229f172b9d7', // Generic processor
    'photo-1591488320449-011701bb6704', // Generic GPU
  ];

  return placeholders.some(p => clean.includes(p));
}

/**
 * Intelligently retrieves the authentic visual asset of a product.
 * Prioritizes user-added images from Multi-Asset Gallery Studio / Cover Asset over any placeholder or hardcoded default.
 */
export function getAuthenticProductImage(product?: Partial<Product> | null): string {
  if (!product) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80';
  }

  // 1. Gather all potential asset candidates in strict priority order
  const candidates: string[] = [];
  if (product.primaryImage && typeof product.primaryImage === 'string') {
    candidates.push(product.primaryImage.trim());
  }
  if (product.thumbnail && typeof product.thumbnail === 'string') {
    candidates.push(product.thumbnail.trim());
  }
  if ((product as any)?.image && typeof (product as any).image === 'string') {
    candidates.push((product as any).image.trim());
  }
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (typeof img === 'string' && img.trim()) {
        candidates.push(img.trim());
      }
    }
  }

  // 2. Return the first authentic user-uploaded / custom image that is NOT a placeholder
  const authentic = candidates.find(c => Boolean(c) && !isPlaceholderImageUrl(c));
  if (authentic) {
    return authentic;
  }

  // 3. Hardware-specific verified photography for well-known models if available
  const name = (product.name || product.title || '').toLowerCase();
  const slug = (product.slug || '').toLowerCase();

  // Flagship components
  if (slug.includes('14900k') || name.includes('14900k')) return '/images/intel_i9_14900k.jpg';
  if (slug.includes('7950x') || name.includes('7950x')) return '/images/amd_ryzen_7950x.jpg';
  if (slug.includes('990') || name.includes('990 pro')) return '/images/samsung_990_pro.jpg';
  if (slug.includes('4090') || name.includes('4090')) return '/images/hero_rtx4090.jpg';

  // Distinct hardware photography for top computing models
  if (name.includes('vector 16') || slug.includes('vector-16')) {
    return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('katana') || slug.includes('katana')) {
    return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('transcend') || (name.includes('omen') && name.includes('14'))) {
    return 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('hyperx') || (name.includes('omen') && name.includes('15'))) {
    return 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('legion') || slug.includes('legion')) {
    return 'https://m.media-amazon.com/images/I/7112Sa3EAIL._AC_SL1500_.jpg';
  }
  if (name.includes('aspire 14') || slug.includes('aspire-14')) {
    return 'https://m.media-amazon.com/images/I/614KWi3tv2L.jpg';
  }

  // 4. If only placeholder candidates exist, return the first one available
  const anyCandidate = candidates.find(c => Boolean(c));
  if (anyCandidate) {
    return anyCandidate;
  }

  // 5. Category-level fallback
  const isComputingSystem =
    product.categoryName?.toLowerCase().includes('laptop') ||
    product.categoryId === 'cat_laptops' ||
    product.categoryId === 'cat_gaming_laptops' ||
    product.categoryId === 'cat_all_in_one' ||
    product.categoryId === 'cat_desktops';

  if (isComputingSystem) {
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80';
  }

  return '/images/intel_i9_14900k.jpg';
}
