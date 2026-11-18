import { Product } from '@/types';

/**
 * Standard neutral SVG placeholder when a product record has no visual assets stored in the database.
 * Base64-encoded to guarantee zero metacharacter issues (<, >, ', ") across DOM sanitizer pipelines.
 */
export const DEFAULT_PRODUCT_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjIwIiBoZWlnaHQ9IjgiIHJ4PSIyIi8+PHJlY3QgeD0iMiIgeT0iMTQiIHdpZHRoPSIyMCIgaGVpZ2h0PSI4IiByeD0iMiIvPjxsaW5lIHgxPSI2IiB5MT0iNiIgeDI9IjYuMDEiIHkyPSI2Ii8+PGxpbmUgeDE9IjYiIHkxPSIxOCIgeDI9IjYuMDEiIHkyPSIxOCIvPjwvc3ZnPg==';

/**
 * Validates, normalizes, and sanitizes product image URLs.
 * Automatically upgrades http to https and supports site-relative (/images/...) assets.
 */
export function productImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let input = value.trim();
  if (!input || /[\u0000-\u001f\u007f\\<>"']/.test(input)) return null;

  // Support safe data:image URIs (e.g. SVG placeholders or uploaded base64 images)
  if (
    /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(input) ||
    /^data:image\/svg\+xml;utf8,/i.test(input)
  ) {
    return input;
  }

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
  return (
    clean === '' ||
    clean === DEFAULT_PRODUCT_PLACEHOLDER ||
    clean.includes('data:image/svg+xml')
  );
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

  // 1. If images array is provided with a valid non-placeholder image, index 0 is authoritative
  if (Array.isArray(product.images) && product.images.length > 0) {
    const firstImg = product.images[0];
    if (typeof firstImg === 'string' && firstImg.trim() && !isPlaceholderImageUrl(firstImg)) {
      return firstImg.trim();
    }
    const anyValid = product.images.find(img => typeof img === 'string' && img.trim() && !isPlaceholderImageUrl(img));
    if (anyValid) {
      return anyValid.trim();
    }
  }

  // 2. Purely retrieve database-stored image fields in order of precedence
  if (product.primaryImage && typeof product.primaryImage === 'string' && product.primaryImage.trim() && !isPlaceholderImageUrl(product.primaryImage)) {
    return product.primaryImage.trim();
  }
  if (product.thumbnail && typeof product.thumbnail === 'string' && product.thumbnail.trim() && !isPlaceholderImageUrl(product.thumbnail)) {
    return product.thumbnail.trim();
  }
  if ((product as any)?.image && typeof (product as any).image === 'string' && (product as any).image.trim() && !isPlaceholderImageUrl((product as any).image)) {
    return (product as any).image.trim();
  }

  // 3. Fallback to any string in images if present
  if (Array.isArray(product.images) && product.images.length > 0) {
    const anyStr = product.images.find(img => typeof img === 'string' && img.trim().length > 0);
    if (anyStr) {
      return anyStr.trim();
    }
  }

  return DEFAULT_PRODUCT_PLACEHOLDER;
}
