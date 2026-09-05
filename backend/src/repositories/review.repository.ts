import { BaseRepository } from './base.repository.js';
import { Review } from '../types/index.js';

export class ReviewRepository extends BaseRepository<Review> {
  constructor() {
    super('reviews');
  }

  async findByProduct(productId: string): Promise<Review[]> {
    return this.find({
      where: [
        { field: 'productId', operator: '==', value: productId },
        { field: 'isApproved', operator: '==', value: true }
      ],
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
  }
}

export const reviewRepository = new ReviewRepository();
