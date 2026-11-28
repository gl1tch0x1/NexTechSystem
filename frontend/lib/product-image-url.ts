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

  // Support content-addressable SHA-256 image hashes stored in the database
  if (/^hash:[a-f0-9]{32,64}(\.webp)?$/i.test(input)) {
    const raw = input.replace(/^hash:/i, '');
    return `/api/upload/${raw.endsWith('.webp') ? raw : `${raw}.webp`}`;
  }
  if (/^[a-f0-9]{32,64}\.(webp|png|jpg|jpeg|gif)$/i.test(input)) {
    return `/api/upload/${input}`;
  }
  if (/^[a-f0-9]{64}$/i.test(input)) {
    return `/api/upload/${input}.webp`;
  }
  if (/^\/api\/upload\/[a-f0-9]{24}$/i.test(input)) {
    return input;
  }

  // Migrate legacy Firebase emulator/production URLs to the content-addressed backend route.
  // This provides a compatibility bridge until each record is migrated to a GridFS ObjectId.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/v0\/b\/[^/]+\/o\/|^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\//i.test(input)) {
    try {
      const parsed = new URL(input);
      const match = parsed.pathname.match(/\/o\/([^/?]+)(?:$|\?)/);
      if (match) {
        const objectPath = decodeURIComponent(match[1]);
        const filename = objectPath.split('/').pop() || '';
        const hash = filename.match(/^([a-f0-9]{64})(?:\.[a-z0-9]+)?$/i)?.[1];
        if (hash) return `/api/upload/${hash}.webp`;
      }
    } catch {}
  }

  // Support protocol-relative URLs
  if (input.startsWith('//')) {
    input = `https:${input}`;
  }

  // Allow localhost/127.0.0.1 http URLs for local dev and Firebase emulators.
  const isLocalHttp = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(input);
  if (/^http:\/\//i.test(input) && !isLocalHttp) {
    input = input.replace(/^http:\/\//i, 'https://');
  }

  // If input is a bare domain URL without protocol
  if (!input.startsWith('/') && !/^https?:\/\//i.test(input) && /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(input)) {
    input = `https://${input}`;
  }

  const relative = input.startsWith('/') && !input.startsWith('//');
  if (!relative && !/^https:\/\//i.test(input) && !isLocalHttp) return null;

  try {
    const url = new URL(input, 'https://nextechsystem.com');
    const allowedProtocol = url.protocol === 'https:' || (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1'));
    if (!allowedProtocol || url.username || url.password) return null;
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
