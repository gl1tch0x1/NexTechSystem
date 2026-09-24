import { BaseRepository } from './base.repository.js';
import { Coupon, Review, EBill } from '../types/index.js';

export class CouponRepository extends BaseRepository<Coupon> {
  constructor() {
    super('coupons');
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.findOne([{ field: 'code', operator: '==', value: code.toUpperCase() }]);
  }
}

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

export const couponRepository = new CouponRepository();
export const reviewRepository = new ReviewRepository();
export const ebillRepository = new EBillRepository();
