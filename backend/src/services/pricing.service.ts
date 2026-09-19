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
    taxTreatment?: string;
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
