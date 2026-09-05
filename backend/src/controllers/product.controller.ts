import { Request, Response } from 'express';
import { productService } from '../services/product.service.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { bannerRepository } from '../repositories/banner.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { reviewRepository } from '../repositories/review.repository.js';

export class ProductController {
  async getProducts(req: Request, res: Response): Promise<void> {
    const {
      category,
      categorySlug,
      brand,
      brandSlug,
      search,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      sort,
      page,
      limit,
      ...otherParams
    } = req.query;

    // Collect custom specs
    const specifications: Record<string, string> = {};
    for (const [k, v] of Object.entries(otherParams)) {
      if (typeof v === 'string' && !['resellerId', 'status'].includes(k)) {
        specifications[k] = v;
      }
    }

    const result = await productService.getProducts({
      categoryId: category as string,
      categorySlug: categorySlug as string,
      brandId: brand as string,
      brandSlug: brandSlug as string,
      search: search as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      inStock: inStock === 'true',
      isFeatured: isFeatured === 'true',
      sortBy: sort as any,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
    });

    res.json({
      success: true,
      data: result.products,
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
        product,
        reviews,
        relatedProducts: relatedProducts.products.filter(p => p.id !== product.id),
      },
    });
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    const categories = await categoryRepository.findActive();
    res.json({ success: true, data: categories });
  }

  async getBrands(req: Request, res: Response): Promise<void> {
    const brands = await brandRepository.findActive();
    res.json({ success: true, data: brands });
  }

  async getStoreConfig(req: Request, res: Response): Promise<void> {
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
