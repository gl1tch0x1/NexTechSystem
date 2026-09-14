import { BaseRepository } from './base.repository.js';
import { Quote } from '../types/index.js';

export class QuoteRepository extends BaseRepository<Quote> {
  constructor() {
    super('quotes');
  }

  async findByQuoteNumber(quoteNumber: string): Promise<Quote | null> {
    return this.findOne([{ field: 'quoteNumber', operator: '==', value: quoteNumber }]);
  }

  async findRecent(limit = 50): Promise<Quote[]> {
    return this.find({
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit,
    });
  }
}

export const quoteRepository = new QuoteRepository();
