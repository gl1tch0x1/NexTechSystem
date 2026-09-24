import { BaseRepository } from './base.repository.js';
import { PurchaseOrder } from '../types/index.js';

export class PurchaseOrderRepository extends BaseRepository<PurchaseOrder> {
  constructor() {
    super('purchase_orders');
  }

  async findByPoNumber(poNumber: string): Promise<PurchaseOrder | null> {
    return this.findOne([{ field: 'poNumber', operator: '==', value: poNumber }]);
  }

  async findRecent(limit = 50): Promise<PurchaseOrder[]> {
    return this.find({
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit,
    });
  }
}

export const purchaseOrderRepository = new PurchaseOrderRepository();
