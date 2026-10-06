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
        stampUrl: settings.invoiceStampUrl,
        signatureUrl: settings.invoiceSignatureUrl,
        signatoryName: settings.signatoryName,
        signatoryTitle: settings.signatoryTitle,
        showStamp: settings.showStampOnEBill ?? true,
        showSignature: settings.showSignatureOnEBill ?? true,
      },
      stampUrl: settings.invoiceStampUrl,
      signatureUrl: settings.invoiceSignatureUrl,
      signatoryName: settings.signatoryName,
      signatoryTitle: settings.signatoryTitle,
      showStamp: settings.showStampOnEBill ?? true,
      showSignature: settings.showSignatureOnEBill ?? true,
      customerInfo: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        address: order.shippingAddress,
        customerType: order.customerType,
        companyName: order.companyName,
        tradeLicense: order.tradeLicense,
        trn: order.trn,
        contactPerson: order.contactPerson,
        contactRole: order.contactRole,
        poNumber: order.poNumber,
        paymentTerms: order.paymentTerms,
        taxTreatment: order.taxTreatment,
        partnerTier: order.partnerTier,
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
    const bill = await ebillRepository.findByOrderId(orderId);
    if (!bill) return null;

    // Enrich with latest store stamp and signature settings
    const settings = await settingsRepository.getSettings();
    return {
      ...bill,
      stampUrl: settings.invoiceStampUrl || bill.stampUrl,
      signatureUrl: settings.invoiceSignatureUrl || bill.signatureUrl,
      signatoryName: settings.signatoryName || bill.signatoryName,
      signatoryTitle: settings.signatoryTitle || bill.signatoryTitle,
      showStamp: settings.showStampOnEBill ?? bill.showStamp ?? true,
      showSignature: settings.showSignatureOnEBill ?? bill.showSignature ?? true,
      sellerInfo: {
        ...bill.sellerInfo,
        stampUrl: settings.invoiceStampUrl || bill.sellerInfo?.stampUrl,
        signatureUrl: settings.invoiceSignatureUrl || bill.sellerInfo?.signatureUrl,
        signatoryName: settings.signatoryName || bill.sellerInfo?.signatoryName,
        signatoryTitle: settings.signatoryTitle || bill.sellerInfo?.signatoryTitle,
        showStamp: settings.showStampOnEBill ?? bill.sellerInfo?.showStamp ?? true,
        showSignature: settings.showSignatureOnEBill ?? bill.sellerInfo?.showSignature ?? true,
      },
    };
  }

  async getEBillByInvoiceNumber(invoiceNumber: string): Promise<EBill | null> {
    const bill = await ebillRepository.findByInvoiceNumber(invoiceNumber);
    if (!bill) return null;

    const settings = await settingsRepository.getSettings();
    return {
      ...bill,
      stampUrl: settings.invoiceStampUrl || bill.stampUrl,
      signatureUrl: settings.invoiceSignatureUrl || bill.signatureUrl,
      signatoryName: settings.signatoryName || bill.signatoryName,
      signatoryTitle: settings.signatoryTitle || bill.signatoryTitle,
      showStamp: settings.showStampOnEBill ?? bill.showStamp ?? true,
      showSignature: settings.showSignatureOnEBill ?? bill.showSignature ?? true,
    };
  }
}

export const ebillService = new EBillService();
