import { CartItem, Coupon, PaymentMethod, Address } from '../types/index.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';

/**
 * Detects if a shipping destination address is within the Bur Dubai district of Dubai.
 * Bur Dubai encompasses historic and commercial localities including Al Mankhool,
 * Al Karama, Al Fahidi, Meena Bazaar, Al Raffa, Oud Metha, and Al Souq Al Kabeer.
 */
export function isBurDubaiAddress(address?: { addressLine1?: string; city?: string; state?: string; postalCode?: string } | null): boolean {
  if (!address) return false;
  const combined = `${address.addressLine1 || ''} ${address.city || ''} ${address.state || ''} ${address.postalCode || ''}`.toLowerCase();
  
  const burDubaiPatterns = [
    /\bbur\s*dubai\b/i,
    /\bal\s*mankhool\b/i,
    /\bal\s*karama\b/i,
    /\bal\s*fahidi\b/i,
    /\bmeena\s*bazaar\b/i,
    /\bal\s*raffa\b/i,
    /\boud\s*metha\b/i,
    /\bal\s*souq\s*al\s*kabeer\b/i,
    /\bal\s*hudaiba\b/i,
    /\bal\s*jafiliya\b/i,
    /\bza'abeel\b/i,
    /\bzaabeel\b/i,
  ];

  return burDubaiPatterns.some(pattern => pattern.test(combined));
}

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
  paymentSurcharge: number;
  paymentSurchargeRate: number;
  codFee: number;
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
    taxTreatment?: string;
    paymentMethod?: PaymentMethod;
    shippingAddress?: Address;
  }): Promise<PricingCalculationResult> {
    const settings = await settingsRepository.getSettings();
    const verifiedItems: CartItem[] = [];
    let subtotal = 0;
    let taxableItemsSubtotal = 0;

    for (const reqItem of params.items as Array<{ productId: string; quantity: number; variantId?: string }>) {
      if (!reqItem || typeof reqItem.productId !== 'string' || !reqItem.productId.trim()) {
        throw new Error('Invalid cart item: productId is required');
      }

      const qty = Number(reqItem.quantity);
      if (!Number.isInteger(qty) || qty <= 0 || qty > 999) {
        throw new Error(`Invalid item quantity for product ${reqItem.productId}. Must be a positive integer between 1 and 999.`);
      }
      reqItem.quantity = qty;

      const product = params.productsMap.get(reqItem.productId);
      if (!product) {
        throw new Error(`Product not found: ${reqItem.productId}`);
      }

      // Check variant if variantId provided
      let effectivePrice = product.price;
      let effectiveSalePrice = product.salePrice;
      let effectiveSku = product.sku;
      let effectiveTitle = product.name;
      let effectiveImage = product.thumbnail || product.images?.[0] || '';
      let effectiveStock = product.stock;
      let isItemTaxable = product.chargeTax !== false;
      let variantOptions: Record<string, string> | undefined;

      if (reqItem.variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.find((v: any) => v.id === reqItem.variantId);
        if (variant) {
          effectivePrice = variant.price;
          effectiveSalePrice = variant.salePrice || (variant.compareAtPrice ? variant.price : product.salePrice);
          effectiveSku = variant.sku;
          effectiveTitle = `${product.name} - ${variant.title}`;
          if (variant.image) effectiveImage = variant.image;
          effectiveStock = variant.stock;
          variantOptions = variant.options;
          if (variant.chargeTax !== undefined) {
            isItemTaxable = variant.chargeTax;
          }
        }
      }

      const unitPrice = effectiveSalePrice && effectiveSalePrice > 0 ? effectiveSalePrice : effectivePrice;
      const itemSubtotal = unitPrice * reqItem.quantity;
      subtotal += itemSubtotal;

      if (isItemTaxable) {
        taxableItemsSubtotal += itemSubtotal;
      }

      verifiedItems.push({
        productId: product.id,
        productName: effectiveTitle,
        variantId: reqItem.variantId,
        variantTitle: reqItem.variantId && product.variants ? product.variants.find((v: any) => v.id === reqItem.variantId)?.title : undefined,
        options: variantOptions,
        sku: effectiveSku,
        slug: product.slug,
        image: effectiveImage,
        quantity: reqItem.quantity,
        price: effectivePrice,
        salePrice: effectiveSalePrice,
        chargeTax: isItemTaxable,
        sellerType: product.sellerType,
        resellerId: product.resellerId,
        resellerCode: product.resellerCode,
        subtotal: itemSubtotal,
        unitPrice: unitPrice,
        totalPrice: itemSubtotal,
        stockAvailable: effectiveStock,
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

    // Tax calculation (e.g. 5% UAE VAT) respecting chargeTax toggle and tax treatment
    const isZeroRated =
      params.taxTreatment === 'FREE_ZONE' ||
      params.taxTreatment === 'EXPORT' ||
      params.taxTreatment === 'EXEMPT' ||
      params.taxTreatment === 'ZERO_RATED';
    const taxRate = isZeroRated ? 0 : (settings.taxRate || 5);
    const taxableRatio = subtotal > 0 ? (taxableItemsSubtotal / subtotal) : 1;
    const discountedTaxableSubtotal = Math.max(0, taxableItemsSubtotal - (couponDiscount * taxableRatio));
    const tax = isZeroRated ? 0 : Math.round((discountedTaxableSubtotal * (taxRate / 100)) * 100) / 100;

    // Payment Surcharge calculation:
    // Tabby: 8% extra from the product amount (subtotal)
    // Cards (Debit/Credit): 3% extra from the product amount (subtotal)
    // Cash / COD / others: 0% extra
    let paymentSurchargeRate = 0;
    if (params.paymentMethod === 'TABBY') {
      paymentSurchargeRate = 8;
    } else if (params.paymentMethod === 'CREDIT_CARD') {
      paymentSurchargeRate = 3;
    }

    const paymentSurcharge = paymentSurchargeRate > 0
      ? Math.round((subtotal * (paymentSurchargeRate / 100)) * 100) / 100
      : 0;

    // COD handling fee:
    // If COD is inside Bur Dubai -> Free (0 AED), else COD charges included accordingly (default 25 AED)
    let codFee = 0;
    if (params.paymentMethod === 'COD') {
      const isInsideBurDubai = isBurDubaiAddress(params.shippingAddress);
      if (!isInsideBurDubai) {
        codFee = (settings as any).codFee !== undefined ? Number((settings as any).codFee) : 25;
      }
    }

    const preWalletTotal = Math.round((discountedSubtotal + tax + shippingFee + paymentSurcharge + codFee) * 100) / 100;

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
      paymentSurcharge,
      paymentSurchargeRate,
      codFee,
      walletAmountUsed: Math.round(walletAmountUsed * 100) / 100,
      total,
      currency: settings.defaultCurrency || 'AED',
    };
  }
}

export const pricingService = new PricingService();
