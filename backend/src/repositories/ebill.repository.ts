import { BaseRepository } from './base.repository.js';
import { EBill } from '../types/index.js';

export class EBillRepository extends BaseRepository<EBill> {
  constructor() {
    super('ebills');
  }

  async findByOrderId(orderId: string): Promise<EBill | null> {
    return this.findOne([{ field: 'orderId', operator: '==', value: orderId }]);
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<EBill | null> {
    return this.findOne([{ field: 'invoiceNumber', operator: '==', value: invoiceNumber }]);
  }
}

export const ebillRepository = new EBillRepository();
