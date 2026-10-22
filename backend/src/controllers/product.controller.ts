import { Request, Response } from 'express';
import { productService } from '../services/product.service.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { bannerRepository } from '../repositories/banner.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { reviewRepository } from '../repositories/review.repository.js';

export function sanitizePublicProduct(prod: any): any {
  if (!prod) return prod;
  const { costPrice, resellerId, resellerCode, hsCode, rejectionReason, ...safeProd } = prod;
  if (Array.isArray(safeProd.variants)) {
    safeProd.variants = safeProd.variants.map((v: any) => {
      const { costPrice: _c, ...safeVariant } = v;
      return safeVariant;
    });
  }
  if (Array.isArray(safeProd.locations)) {
    safeProd.locations = safeProd.locations.map((loc: any) => ({
      locationName: loc.locationName,
      city: loc.city,
      available: loc.available ?? loc.quantity,
    }));
  }
  return safeProd;
}

export class ProductController {
  async getProducts(req: Request, res: Response): Promise<void> {
    const {
      category,
      categorySlug,
      brand,
      brandSlug,
      search,
      collection,
      tag,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      sellerType,
      minRating,
      onSale,
      location,
      sort,
      page,
      limit,
      ...otherParams
    } = req.query;

    // Collect and sanitize custom specs safely via Map to prevent prototype pollution / remote property injection
    const FORBIDDEN_PROPERTIES = new Set(['__proto__', 'constructor', 'prototype', 'resellerId', 'status', 'sellerType', 'minRating', 'onSale', 'location']);
    const SPEC_KEY_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

    const specMap = new Map<string, string>();
    for (const [k, v] of Object.entries(otherParams)) {
      if (
        typeof v === 'string' &&
        !FORBIDDEN_PROPERTIES.has(k) &&
        SPEC_KEY_REGEX.test(k)
      ) {
        specMap.set(k, v);
      }
    }
    const specifications: Record<string, string> = Object.fromEntries(specMap);

    const result = await productService.getProducts({
      categoryId: category as string,
      categorySlug: categorySlug as string,
      brandId: brand as string,
      brandSlug: brandSlug as string,
      search: search as string,
      collection: collection as string,
      tag: tag as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      inStock: inStock === 'true',
      isFeatured: isFeatured === 'true',
      sellerType: sellerType as any,
      minRating: minRating ? parseFloat(minRating as string) : undefined,
      onSale: onSale === 'true',
      location: location as string,
      sortBy: sort as any,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
    });

    const sanitizedProducts = result.products.map(sanitizePublicProduct);

    res.json({
      success: true,
      data: sanitizedProducts,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        facets: result.facets,
      },
    });
  }

  async getProductBySlug(req: Request, res: Response): Promise<void> {
    const slug = req.params.slug as string;
    const product = await productService.getProductBySlug(slug);

    if (!product) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });
      return;
    }

    const reviews = await reviewRepository.findByProduct(product.id);
    const relatedProducts = await productService.getProducts({
      categoryId: product.categoryId,
      limit: 4,
    });

    res.json({
      success: true,
      data: {
        product: sanitizePublicProduct(product),
        reviews,
        relatedProducts: relatedProducts.products
          .filter(p => p.id !== product.id)
          .map(sanitizePublicProduct),
      },
    });
  }

  async getCategories(_req: Request, res: Response): Promise<void> {
    const categories = await categoryRepository.findActive();
    res.json({ success: true, data: categories });
  }

  async getBrands(_req: Request, res: Response): Promise<void> {
    const brands = await brandRepository.findActive();
    res.json({ success: true, data: brands });
  }

  async getStoreConfig(_req: Request, res: Response): Promise<void> {
    const settings = await settingsRepository.getSettings();
    const banners = await bannerRepository.findActive();
    res.json({
      success: true,
      data: {
        settings,
        banners,
      },
    });
  }
}

export const productController = new ProductController();
