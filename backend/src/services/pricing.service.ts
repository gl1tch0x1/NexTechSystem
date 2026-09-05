import { CartItem, Coupon } from '../types/index.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';

export interface PricingCalculationResult {
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  appliedCoupon?: Coupon | null;
  couponDiscount: number;
  taxRate: number;
  tax: number;
  shippingFee: number;
  walletAmountUsed: number;
  total: number;
  currency: string;
}

export class PricingService {
  async calculateOrderTotals(params: {
    items: Array<{ productId: string; quantity: number }>;
    productsMap: Map<string, any>;
    couponCode?: string;
    requestedWalletDeduction?: number;
    userWalletBalance?: number;
  }): Promise<PricingCalculationResult> {
    const settings = await settingsRepository.getSettings();
    const verifiedItems: CartItem[] = [];
    let subtotal = 0;

    for (const reqItem of params.items) {
      const product = params.productsMap.get(reqItem.productId);
      if (!product) {
        throw new Error(`Product not found: ${reqItem.productId}`);
      }

      const unitPrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
      const itemSubtotal = unitPrice * reqItem.quantity;
      subtotal += itemSubtotal;

      verifiedItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        slug: product.slug,
        image: product.thumbnail || product.images?.[0] || '',
        quantity: reqItem.quantity,
        price: product.price,
        salePrice: product.salePrice,
        sellerType: product.sellerType,
        resellerId: product.resellerId,
        resellerCode: product.resellerCode,
        subtotal: itemSubtotal,
        stockAvailable: product.stock,
      });
    }

    let couponDiscount = 0;
    let appliedCoupon: Coupon | null = null;

    if (params.couponCode) {
      const coupon = await couponRepository.findByCode(params.couponCode);
      if (coupon && coupon.isActive) {
        const now = new Date().toISOString();
        if (coupon.startDate <= now && coupon.endDate >= now) {
          if (subtotal >= coupon.minOrderAmount) {
            if (coupon.discountType === 'PERCENTAGE') {
              couponDiscount = (subtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
                couponDiscount = coupon.maxDiscountAmount;
              }
            } else {
              couponDiscount = Math.min(coupon.discountValue, subtotal);
            }
            appliedCoupon = coupon;
          }
        }
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

    // Shipping calculation
    const shippingFee = discountedSubtotal >= settings.freeShippingThreshold ? 0 : settings.standardShippingFee;

    // Tax calculation (e.g. 5% VAT)
    const taxRate = settings.taxRate || 5;
    const tax = Math.round((discountedSubtotal * (taxRate / 100)) * 100) / 100;

    const preWalletTotal = Math.round((discountedSubtotal + tax + shippingFee) * 100) / 100;

    // Wallet deduction verification
    let walletAmountUsed = 0;
    if (params.requestedWalletDeduction && params.requestedWalletDeduction > 0) {
      const availableWallet = Math.min(params.requestedWalletDeduction, params.userWalletBalance || 0);
      walletAmountUsed = Math.min(availableWallet, preWalletTotal);
    }

    const total = Math.max(0, Math.round((preWalletTotal - walletAmountUsed) * 100) / 100);

    return {
      items: verifiedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(couponDiscount * 100) / 100,
      couponCode: appliedCoupon?.code,
      appliedCoupon,
      couponDiscount: Math.round(couponDiscount * 100) / 100,
      taxRate,
      tax,
      shippingFee,
      walletAmountUsed: Math.round(walletAmountUsed * 100) / 100,
      total,
      currency: settings.defaultCurrency || 'AED',
    };
  }
}

export const pricingService = new PricingService();
