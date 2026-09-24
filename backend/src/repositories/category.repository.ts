import { BaseRepository } from './base.repository.js';
import { Category, Brand } from '../types/index.js';

export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super('categories');
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.findOne([{ field: 'slug', operator: '==', value: slug }]);
  }

  async findActive(): Promise<Category[]> {
    return this.find({
      where: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: { field: 'order', direction: 'asc' }
    });
  }
}

export class BrandRepository extends BaseRepository<Brand> {
  constructor() {
    super('brands');
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    return this.findOne([{ field: 'slug', operator: '==', value: slug }]);
  }

  async findActive(): Promise<Brand[]> {
    return this.find({
      where: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: { field: 'name', direction: 'asc' }
    });
  }
}

export const categoryRepository = new CategoryRepository();
export const brandRepository = new BrandRepository();
