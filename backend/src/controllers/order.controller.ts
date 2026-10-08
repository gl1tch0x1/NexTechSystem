import { Response } from 'express';
import { orderService } from '../services/order.service.js';
import { ebillService } from '../services/ebill.service.js';
import { emailOtpService } from '../services/email-otp.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ENV } from '../config/env.js';

export class OrderController {
  async requestOrderOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const { total, itemsCount, currency } = req.body;

    try {
      const result = await emailOtpService.generateAndSendOtp({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name,
        cartSummary: {
          total: total ? Number(total) : undefined,
          itemsCount: itemsCount ? Number(itemsCount) : undefined,
          currency: currency || 'AED',
        },
      });

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'OTP_REQUEST_FAILED', message: err.message },
      });
    }
  }

  async verifyOrderOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'A 6-digit verification code is required.' } });
      return;
    }

    const result = await emailOtpService.verifyOtp({
      userId: req.user.id,
      userEmail: req.user.email,
      code: code.trim(),
      consumeOnSuccess: false,
    });

    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: result.error || 'Invalid verification code.',
          remainingAttempts: result.remainingAttempts,
        },
      });
      return;
    }

    res.status(200).json({ success: true, message: 'Verification code validated successfully.' });
  }

  async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required to place order.' } });
      return;
    }

    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, walletAmountToUse, notes, customerPhone, otpCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: { code: 'EMPTY_ORDER', message: 'Cart items cannot be empty.' } });
      return;
    }

    if (!shippingAddress) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ADDRESS', message: 'Shipping address is required.' } });
      return;
    }

    // Email OTP Verification enforcement for customer and reseller storefront checkout
    if (ENV.REQUIRE_ORDER_EMAIL_OTP && req.user.role !== 'ADMIN') {
      if (!otpCode || typeof otpCode !== 'string' || otpCode.trim().length !== 6) {
        res.status(400).json({
          success: false,
          error: {
            code: 'OTP_REQUIRED',
            message: 'Email verification code is required to authorize order confirmation. Please enter the 6-digit code sent to your registered email address.',
          },
        });
        return;
      }

      const otpResult = await emailOtpService.verifyOtp({
        userId: req.user.id,
        userEmail: req.user.email,
        code: otpCode.trim(),
        consumeOnSuccess: true,
      });

      if (!otpResult.valid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OTP',
            message: otpResult.error || 'Invalid or expired verification code.',
            remainingAttempts: otpResult.remainingAttempts,
          },
        });
        return;
      }
    }

    try {
      const order = await orderService.createOrder({
        userId: req.user.id,
        customerName: req.user.name,
        customerEmail: req.user.email,
        customerPhone: customerPhone || '',
        items,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress,
        paymentMethod: paymentMethod || 'CREDIT_CARD',
        couponCode,
        walletAmountToUse: walletAmountToUse ? parseFloat(walletAmountToUse) : undefined,
        notes,
      });

      res.status(201).json({ success: true, data: order });
    } catch (err: any) {
      // Revert OTP consumption so user is not locked out when addressing validation/stock issues
      if (ENV.REQUIRE_ORDER_EMAIL_OTP && req.user.role !== 'ADMIN') {
        await emailOtpService.unconsumeOtp(req.user.id).catch(() => {});
      }
      res.status(400).json({ success: false, error: { code: 'ORDER_CREATION_FAILED', message: err.message } });
    }
  }

  async getMyOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const orders = await orderService.getOrdersByUser(req.user.id);
    res.json({ success: true, data: orders });
  }

  async getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const id = req.params.id as string;
    const order = await orderService.getOrderById(id);

    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } });
      return;
    }

    // Role check: customer can only view own order; reseller can view if contains their items; admin can view all
    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    if (req.user.role === 'RESELLER') {
      const hasResellerItem = Array.isArray(order?.items) && order.items.some(i => i?.resellerId === req.user?.resellerId);
      if (!hasResellerItem) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
        return;
      }
    }

    const ebill = await ebillService.getEBillByOrderId(order.id);

    res.json({
      success: true,
      data: {
        order,
        ebill,
      },
    });
  }

  async getEBill(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const orderId = req.params.orderId as string;
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } });
      return;
    }

    // Role check: customer can only view own e-bill; reseller can view if contains their items; admin can view all
    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    if (req.user.role === 'RESELLER') {
      const hasResellerItem = Array.isArray(order?.items) && order.items.some(i => i?.resellerId === req.user?.resellerId);
      if (!hasResellerItem) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
        return;
      }
    }

    const ebill = await ebillService.getEBillByOrderId(orderId);

    if (!ebill) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'E-Bill not found.' } });
      return;
    }

    res.json({ success: true, data: ebill });
  }
}

export const orderController = new OrderController();
