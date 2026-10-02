import { Request, Response } from 'express';
import { orderService } from '../services/order.service.js';
import { ebillService } from '../services/ebill.service.js';
import { notificationService } from '../services/notification.service.js';
import { ENV } from '../config/env.js';
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
      const hasResellerItem = order.items.some(i => i.resellerId === req.user?.resellerId);
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

  private renderRemoteHtml(
    res: Response,
    statusCode: number,
    title: string,
    badgeText: string,
    badgeBg: string,
    message: string,
    details?: string
  ): void {
    const clientUrl = ENV.CLIENT_URL.replace(/\/$/, '');
    const escapeHtml = (str: string) =>
      String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | NexTech Systems</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #0b1120; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #131d35; border: 1px solid #1e293b; border-radius: 16px; max-width: 520px; width: 100%; padding: 36px 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); text-align: center; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 9999px; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 20px; ${badgeBg} }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 12px; color: #ffffff; }
    p { font-size: 0.95rem; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
    .details-box { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px; margin: 20px 0; text-align: left; font-size: 0.88rem; color: #cbd5e1; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 10px; transition: background 0.2s; margin-top: 10px; }
    .btn:hover { background: #1d4ed8; }
    .footer { margin-top: 24px; font-size: 0.75rem; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${escapeHtml(badgeText)}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${message}</p>
    ${details ? `<div class="details-box">${details}</div>` : ''}
    <div>
      <a class="btn" href="${clientUrl}/admin/orders">Go to Admin Orders Dashboard</a>
    </div>
    <div class="footer">NexTech Systems Enterprise HITL Gateway • Cryptographically Signed Action</div>
  </div>
</body>
</html>`;
    res.status(statusCode).setHeader('Content-Type', 'text/html').send(html);
  }

  async handleRemoteApprove(req: Request, res: Response): Promise<void> {
    const isJson = Boolean(req.headers.accept?.includes('application/json'));
    const orderId = String(req.query.orderId || '').trim();
    const token = String(req.query.token || '').trim();

    // Strict input pattern validation
    if (!orderId || !/^[a-zA-Z0-9_-]+$/.test(orderId) || !token || !/^[a-fA-F0-9]{64}$/.test(token)) {
      if (isJson) {
        res.status(400).json({ success: false, error: { message: 'Invalid or missing remote approval parameters.' } });
        return;
      }
      return this.renderRemoteHtml(res, 400, 'Invalid Request', 'Bad Request', 'background: #ef4444; color: #ffffff;', 'The approval link parameters are malformed or missing.');
    }

    // Verify cryptographic HMAC token specifically bound to APPROVE
    const isValid = notificationService.verifyApprovalToken(orderId, 'APPROVE', token);
    if (!isValid) {
      if (isJson) {
        res.status(403).json({ success: false, error: { message: 'Cryptographic signature verification failed.' } });
        return;
      }
      return this.renderRemoteHtml(res, 403, 'Unauthorized Action', 'Signature Failed', 'background: #ef4444; color: #ffffff;', 'This 1-click action link is invalid, corrupted, or has expired.');
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
      if (isJson) {
        res.status(404).json({ success: false, error: { message: 'Order not found.' } });
        return;
      }
      return this.renderRemoteHtml(res, 404, 'Order Not Found', 'Not Found', 'background: #f59e0b; color: #000000;', 'The requested order does not exist in the database.');
    }

    if (order.orderStatus !== 'PENDING_APPROVAL') {
      if (order.orderStatus === 'CONFIRMED') {
        if (isJson) {
          res.json({ success: true, data: order, message: `Order #${order.orderNumber} is already confirmed.` });
          return;
        }
        return this.renderRemoteHtml(
          res,
          200,
          `Order #${order.orderNumber} Already Approved`,
          'CONFIRMED',
          'background: #10b981; color: #ffffff;',
          'This order was already approved and is in <strong>CONFIRMED</strong> state.'
        );
      }
      if (isJson) {
        res.status(400).json({ success: false, error: { message: `Order #${order.orderNumber} is already in status '${order.orderStatus}'.` } });
        return;
      }
      return this.renderRemoteHtml(
        res,
        200,
        `Order #${order.orderNumber} Already Handled`,
        order.orderStatus,
        'background: #3b82f6; color: #ffffff;',
        `This order is in <strong>${order.orderStatus}</strong> state and cannot be modified again via this link.`
      );
    }

    try {
      const updated = await orderService.approveOrder(orderId, 'CHATOPS', undefined, 'Approved via ChatOps 1-click verified link');
      if (isJson) {
        res.json({ success: true, data: updated, message: `Order #${order.orderNumber} approved.` });
        return;
      }
      return this.renderRemoteHtml(
        res,
        200,
        `Order #${order.orderNumber} Approved!`,
        'APPROVED & CONFIRMED',
        'background: #10b981; color: #ffffff;',
        'Order status transitioned to <strong>CONFIRMED</strong>. Hardware inventory allocation has been finalized, and customer fulfillment has been initiated.',
        `<strong>Customer:</strong> ${order.customerName} (${order.customerEmail})<br/>
         <strong>Total Value:</strong> ${order.currency} ${(order.total || 0).toLocaleString()}<br/>
         <strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})`
      );
    } catch (err: any) {
      console.error('[OrderController] Remote approve failed for order:', orderId, err);
      if (isJson) {
        res.status(500).json({ success: false, error: { message: err?.message || 'Remote approval failed.' } });
        return;
      }
      return this.renderRemoteHtml(res, 500, 'Processing Error', 'Server Error', 'background: #ef4444; color: #ffffff;', err?.message || 'Failed to process order approval.');
    }
  }

  async handleRemoteReject(req: Request, res: Response): Promise<void> {
    const isJson = Boolean(req.headers.accept?.includes('application/json'));
    const orderId = String(req.query.orderId || '').trim();
    const token = String(req.query.token || '').trim();

    // Strict input pattern validation
    if (!orderId || !/^[a-zA-Z0-9_-]+$/.test(orderId) || !token || !/^[a-fA-F0-9]{64}$/.test(token)) {
      if (isJson) {
        res.status(400).json({ success: false, error: { message: 'Invalid or missing remote reject parameters.' } });
        return;
      }
      return this.renderRemoteHtml(res, 400, 'Invalid Request', 'Bad Request', 'background: #ef4444; color: #ffffff;', 'The rejection link parameters are malformed or missing.');
    }

    // Verify cryptographic HMAC token specifically bound to REJECT
    const isValid = notificationService.verifyApprovalToken(orderId, 'REJECT', token);
    if (!isValid) {
      if (isJson) {
        res.status(403).json({ success: false, error: { message: 'Cryptographic signature verification failed.' } });
        return;
      }
      return this.renderRemoteHtml(res, 403, 'Unauthorized Action', 'Signature Failed', 'background: #ef4444; color: #ffffff;', 'This 1-click action link is invalid, corrupted, or has expired.');
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
      if (isJson) {
        res.status(404).json({ success: false, error: { message: 'Order not found.' } });
        return;
      }
      return this.renderRemoteHtml(res, 404, 'Order Not Found', 'Not Found', 'background: #f59e0b; color: #000000;', 'The requested order does not exist in the database.');
    }

    if (order.orderStatus !== 'PENDING_APPROVAL') {
      if (order.orderStatus === 'CANCELLED') {
        if (isJson) {
          res.json({ success: true, data: order, message: `Order #${order.orderNumber} is already cancelled.` });
          return;
        }
        return this.renderRemoteHtml(
          res,
          200,
          `Order #${order.orderNumber} Already Rejected`,
          'CANCELLED',
          'background: #ef4444; color: #ffffff;',
          'This order was already rejected and is in <strong>CANCELLED</strong> state.'
        );
      }
      if (isJson) {
        res.status(400).json({ success: false, error: { message: `Order #${order.orderNumber} is already in status '${order.orderStatus}'.` } });
        return;
      }
      return this.renderRemoteHtml(
        res,
        200,
        `Order #${order.orderNumber} Already Handled`,
        order.orderStatus,
        'background: #3b82f6; color: #ffffff;',
        `This order is in <strong>${order.orderStatus}</strong> state and cannot be modified again via this link.`
      );
    }

    try {
      const updated = await orderService.rejectOrder(orderId, 'CHATOPS', undefined, 'Rejected via ChatOps 1-click verified link');
      if (isJson) {
        res.json({ success: true, data: updated, message: `Order #${order.orderNumber} rejected.` });
        return;
      }
      return this.renderRemoteHtml(
        res,
        200,
        `Order #${order.orderNumber} Rejected`,
        'ORDER REJECTED & CANCELLED',
        'background: #ef4444; color: #ffffff;',
        'Order status has been updated to <strong>CANCELLED</strong>. Any reserved inventory stock and customer wallet balances have been automatically restored.',
        `<strong>Customer:</strong> ${order.customerName}<br/>
         <strong>Reason:</strong> Rejected via ChatOps remote link`
      );
    } catch (err: any) {
      console.error('[OrderController] Remote reject failed for order:', orderId, err);
      if (isJson) {
        res.status(500).json({ success: false, error: { message: err?.message || 'Remote rejection failed.' } });
        return;
      }
      return this.renderRemoteHtml(res, 500, 'Processing Error', 'Server Error', 'background: #ef4444; color: #ffffff;', err?.message || 'Failed to process order rejection.');
    }
  }
}

export const orderController = new OrderController();
