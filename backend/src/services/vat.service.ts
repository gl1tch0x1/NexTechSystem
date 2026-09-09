import { orderRepository } from '../repositories/order.repository.js';
import { Order } from '../types/index.js';

export interface VatFilingBoxSummary {
  boxNumber: string;
  boxTitle: string;
  taxableAmountAED: number;
  vatAmountAED: number;
  rateDescription: string;
}

export interface UaeVatReturnSummary {
  taxRegistrationNumber: string;
  legalEntityName: string;
  taxPeriod: string;
  filingDueDate: string;
  standardRatedSupplies: VatFilingBoxSummary;
  touristRefundsPlanet: VatFilingBoxSummary;
  zeroRatedSupplies: VatFilingBoxSummary;
  totalTaxableSuppliesAED: number;
  totalOutputVatAED: number;
  totalOrdersProcessed: number;
  generatedAt: string;
}

export class VatService {
  private static readonly UAE_TRN = '100492810300003';
  private static readonly LEGAL_NAME = 'NexTech Systems FZ-LLC / ComNet Solutions';

  public static async getVatReturnSummary(periodStart?: string, periodEnd?: string): Promise<UaeVatReturnSummary> {
    const orders = await orderRepository.find();
    
    // Filter by period if provided, or default to all completed/confirmed orders
    const relevantOrders = orders.filter((order: Order) => {
      if (order.paymentStatus === 'FAILED' || order.orderStatus === 'CANCELLED') return false;
      if (!periodStart && !periodEnd) return true;
      const orderDate = order.createdAt.slice(0, 10);
      if (periodStart && orderDate < periodStart) return false;
      if (periodEnd && orderDate > periodEnd) return false;
      return true;
    });

    let standardNetTaxable = 0;
    let standardOutputVat = 0;

    for (const order of relevantOrders) {
      // Subtotal before tax
      const netTaxable = order.subtotal - (order.discount || 0);
      standardNetTaxable += Math.max(0, netTaxable);
      standardOutputVat += order.tax || Number((netTaxable * (order.taxRate || 0.05)).toFixed(2));
    }

    const now = new Date();
    const currentQuarter = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
    const dueDate = new Date(now.getFullYear(), (Math.floor(now.getMonth() / 3) + 1) * 3, 28)
      .toISOString()
      .slice(0, 10);

    return {
      taxRegistrationNumber: this.UAE_TRN,
      legalEntityName: this.LEGAL_NAME,
      taxPeriod: currentQuarter,
      filingDueDate: dueDate,
      standardRatedSupplies: {
        boxNumber: 'Box 1a',
        boxTitle: 'Standard Rated Supplies in Dubai & Emirates',
        taxableAmountAED: Number(standardNetTaxable.toFixed(2)),
        vatAmountAED: Number(standardOutputVat.toFixed(2)),
        rateDescription: '5% Standard GCC VAT',
      },
      touristRefundsPlanet: {
        boxNumber: 'Box 1c',
        boxTitle: 'Supplies subject to the Tax Invoices Scheme for Tourists (Planet)',
        taxableAmountAED: 0,
        vatAmountAED: 0,
        rateDescription: 'Electronic Tourist Validation',
      },
      zeroRatedSupplies: {
        boxNumber: 'Box 4',
        boxTitle: 'Zero-rated supplies (Direct Exports & Free Zone Commercial)',
        taxableAmountAED: 0,
        vatAmountAED: 0,
        rateDescription: '0% Export Relief',
      },
      totalTaxableSuppliesAED: Number(standardNetTaxable.toFixed(2)),
      totalOutputVatAED: Number(standardOutputVat.toFixed(2)),
      totalOrdersProcessed: relevantOrders.length,
      generatedAt: new Date().toISOString(),
    };
  }
}
