import { BaseRepository } from './base.repository.js';
import { Product } from '../types/index.js';

export class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super('products');
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return this.findOne([{ field: 'slug', operator: '==', value: slug }]);
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.findOne([{ field: 'sku', operator: '==', value: sku }]);
  }

  async findByResellerId(resellerId: string): Promise<Product[]> {
    return this.find({
      where: [{ field: 'resellerId', operator: '==', value: resellerId }],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }

  async findFeatured(limit = 8): Promise<Product[]> {
    return this.find({
      where: [
        { field: 'isFeatured', operator: '==', value: true },
        { field: 'isActive', operator: '==', value: true }
      ],
      limit
    });
  }

  async findByCategory(categoryId: string, limit = 50): Promise<Product[]> {
    return this.find({
      where: [
        { field: 'categoryId', operator: '==', value: categoryId },
        { field: 'isActive', operator: '==', value: true }
      ],
      limit
    });
  }

  async findByBrand(brandId: string, limit = 50): Promise<Product[]> {
    return this.find({
      where: [
        { field: 'brandId', operator: '==', value: brandId },
        { field: 'isActive', operator: '==', value: true }
      ],
      limit
    });
  }
}

export const productRepository = new ProductRepository();
