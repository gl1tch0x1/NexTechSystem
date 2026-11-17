import { Product } from '@/types';

/**
 * Standard neutral SVG placeholder when a product record has no visual assets stored in the database.
 */
export const DEFAULT_PRODUCT_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>';

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
 * Detects whether an image URL is an empty or unconfigured placeholder.
 */
export function isPlaceholderImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const clean = url.trim();
  return clean === '' || clean === DEFAULT_PRODUCT_PLACEHOLDER;
}

/**
 * Retrieves the authentic visual asset directly from the product record in the database.
 * Purely data-driven: no hardcoded product names, URLs, or image paths in code.
 * Inspects product.primaryImage, product.thumbnail, (product as any).image, and product.images[].
 */
export function getAuthenticProductImage(product?: Partial<Product> | null): string {
  if (!product) {
    return DEFAULT_PRODUCT_PLACEHOLDER;
  }

  // Purely retrieve database-stored image fields in order of precedence
  if (product.primaryImage && typeof product.primaryImage === 'string' && product.primaryImage.trim()) {
    return product.primaryImage.trim();
  }
  if (product.thumbnail && typeof product.thumbnail === 'string' && product.thumbnail.trim()) {
    return product.thumbnail.trim();
  }
  if ((product as any)?.image && typeof (product as any).image === 'string' && (product as any).image.trim()) {
    return (product as any).image.trim();
  }
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstValid = product.images.find(img => typeof img === 'string' && img.trim().length > 0);
    if (firstValid) {
      return firstValid.trim();
    }
  }

  return DEFAULT_PRODUCT_PLACEHOLDER;
}
