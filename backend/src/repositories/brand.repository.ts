import { BaseRepository } from './base.repository.js';
import { Brand } from '../types/index.js';

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

export const brandRepository = new BrandRepository();
