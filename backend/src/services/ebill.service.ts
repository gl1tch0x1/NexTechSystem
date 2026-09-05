import { v4 as uuidv4 } from 'uuid';
import { ebillRepository } from '../repositories/ebill.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { EBill, Order } from '../types/index.js';

export class EBillService {
  async generateEBill(order: Order): Promise<EBill> {
    const settings = await settingsRepository.getSettings();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const eBill: EBill = {
      id: `ebill_${uuidv4()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceNumber,
      issuedDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      sellerInfo: {
        name: settings.storeName,
        taxNumber: settings.taxRegistrationNumber,
        address: settings.address,
        phone: settings.supportPhone,
        email: settings.supportEmail,
      },
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.shippingAddress,
      },
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      couponCode: order.couponCode,
      tax: order.tax,
      shipping: order.shippingFee,
      walletDeduction: order.walletAmountUsed,
      total: order.total,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: new Date().toISOString(),
    };

    return ebillRepository.create(eBill);
  }

  async getEBillByOrderId(orderId: string): Promise<EBill | null> {
    return ebillRepository.findByOrderId(orderId);
  }

  async getEBillByInvoiceNumber(invoiceNumber: string): Promise<EBill | null> {
    return ebillRepository.findByInvoiceNumber(invoiceNumber);
  }
}

export const ebillService = new EBillService();
