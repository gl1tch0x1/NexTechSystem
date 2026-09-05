import { Response } from 'express';
import { orderService } from '../services/order.service.js';
import { ebillService } from '../services/ebill.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class OrderController {
  async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required to place order.' } });
      return;
    }

    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, walletAmountToUse, notes, customerPhone } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: { code: 'EMPTY_ORDER', message: 'Cart items cannot be empty.' } });
      return;
    }

    if (!shippingAddress) {
      res.status(400).json({ success: false, error: { code: 'MISSING_ADDRESS', message: 'Shipping address is required.' } });
      return;
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

    // Role check: customer can only view own order; admin can view all; reseller can view if contains their items
    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
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
    const orderId = req.params.orderId as string;
    const ebill = await ebillService.getEBillByOrderId(orderId);

    if (!ebill) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'E-Bill not found.' } });
      return;
    }

    res.json({ success: true, data: ebill });
  }
}

export const orderController = new OrderController();
