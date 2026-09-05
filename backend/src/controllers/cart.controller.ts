import { Request, Response } from 'express';
import { pricingService } from '../services/pricing.service.js';
import { productRepository } from '../repositories/product.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { walletService } from '../services/wallet.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class CartController {
  async calculateCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { items, couponCode, requestedWalletDeduction } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.json({
        success: true,
        data: {
          items: [],
          subtotal: 0,
          discount: 0,
          couponDiscount: 0,
          tax: 0,
          taxRate: 5,
          shippingFee: 0,
          walletAmountUsed: 0,
          total: 0,
          currency: 'AED',
        },
      });
      return;
    }

    const productIds = items.map((it: any) => it.productId);
    const productsMap = new Map<string, any>();

    for (const pid of productIds) {
      const p = await productRepository.findById(pid);
      if (p) {
        productsMap.set(pid, p);
      }
    }

    let userWalletBalance = 0;
    if (req.user?.id) {
      userWalletBalance = await walletService.getBalance(req.user.id);
    }

    try {
      const result = await pricingService.calculateOrderTotals({
        items,
        productsMap,
        couponCode,
        requestedWalletDeduction: requestedWalletDeduction ? parseFloat(requestedWalletDeduction) : undefined,
        userWalletBalance,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'CART_CALCULATION_ERROR', message: err.message } });
    }
  }

  async validateCoupon(req: Request, res: Response): Promise<void> {
    const { code } = req.body;
    const subtotal = req.body.subtotal ?? req.body.cartSubtotal;
    if (!code) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Coupon code is required.' } });
      return;
    }

    const coupon = await couponRepository.findByCode(code);
    if (!coupon || !coupon.isActive) {
      res.status(404).json({ success: false, error: { code: 'COUPON_INVALID', message: 'Coupon is invalid or has expired.' } });
      return;
    }

    const now = new Date().toISOString();
    if (coupon.startDate > now || coupon.endDate < now) {
      res.status(400).json({ success: false, error: { code: 'COUPON_EXPIRED', message: 'This coupon has expired.' } });
      return;
    }

    let discountAmount = 0;
    if (subtotal && subtotal > 0) {
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = Math.min(coupon.discountValue, subtotal);
      }
    }

    res.json({
      success: true,
      data: {
        valid: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        minOrderAmount: coupon.minOrderAmount,
      },
    });
  }
}

export const cartController = new CartController();
