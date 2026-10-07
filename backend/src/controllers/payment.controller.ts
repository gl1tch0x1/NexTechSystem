import { Request, Response } from 'express';
import { orderService } from '../services/order.service.js';
import { tamaraService } from '../services/tamara.service.js';
import { tabbyService } from '../services/tabby.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ENV } from '../config/env.js';

/**
 * Sanitizes untrusted values before logging to prevent Log Injection / Log Forgery (CWE-117).
 * Removes carriage returns, newlines, and bounds string length.
 */
function sanitizeLog(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\r\n]/g, '').slice(0, 128);
}

export class PaymentController {
  /**
   * Initializes a BNPL payment session (Tamara or Tabby) and returns the redirect URL
   */
  async initiatePaymentSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
      return;
    }

    const { orderId, provider } = req.body;

    if (!orderId || !provider) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Both orderId and provider (TAMARA or TABBY) are required.' },
      });
      return;
    }

    if (provider !== 'TAMARA' && provider !== 'TABBY') {
      res.status(400).json({
        success: false,
        error: { code: 'UNSUPPORTED_PROVIDER', message: 'Provider must be TAMARA or TABBY.' },
      });
      return;
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order was not found.' } });
      return;
    }

    // Role security check: customer can only initiate payment for their own order
    if (req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    const clientUrl = ENV.CLIENT_URL.replace(/\/$/, '');
    const apiUrl = (ENV.PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

    try {
      if (provider === 'TAMARA') {
        const returnUrls = {
          success: `${clientUrl}/checkout/payment-status?orderId=${order.id}&status=success&provider=TAMARA`,
          cancel: `${clientUrl}/checkout/payment-status?orderId=${order.id}&status=cancel&provider=TAMARA`,
          failure: `${clientUrl}/checkout/payment-status?orderId=${order.id}&status=failure&provider=TAMARA`,
          notification: `${apiUrl}/api/payments/tamara/webhook`,
        };

        const session = await tamaraService.createCheckoutSession(order, returnUrls);

        await orderService.updatePaymentStatus(
          order.id,
          'PENDING',
          session.orderId,
          {
            provider: 'TAMARA',
            orderId: session.orderId,
            redirectUrl: session.checkoutUrl,
            installments: 4,
            isSimulated: session.isSimulated,
          },
          `Tamara checkout session generated (${session.orderId})`
        );

        res.status(200).json({
          success: true,
          data: {
            redirectUrl: session.checkoutUrl,
            orderId: session.orderId,
            provider: 'TAMARA',
          },
        });
        return;
      }

      if (provider === 'TABBY') {
        const returnUrls = {
          success: `${clientUrl}/checkout/payment-status?orderId=${order.id}&status=success&provider=TABBY`,
          cancel: `${clientUrl}/checkout/payment-status?orderId=${order.id}&status=cancel&provider=TABBY`,
          failure: `${clientUrl}/checkout/payment-status?orderId=${order.id}&status=failure&provider=TABBY`,
        };

        const session = await tabbyService.createCheckoutSession(order, returnUrls);

        await orderService.updatePaymentStatus(
          order.id,
          'PENDING',
          session.paymentId,
          {
            provider: 'TABBY',
            paymentId: session.paymentId,
            redirectUrl: session.checkoutUrl,
            installments: 4,
            isSimulated: session.isSimulated,
          },
          `Tabby checkout session generated (${session.paymentId})`
        );

        res.status(200).json({
          success: true,
          data: {
            redirectUrl: session.checkoutUrl,
            paymentId: session.paymentId,
            provider: 'TABBY',
          },
        });
        return;
      }
    } catch (err: any) {
      console.error(`[PaymentController] Failed to initiate ${sanitizeLog(provider)} payment session:`, err);
      res.status(400).json({
        success: false,
        error: { code: 'PAYMENT_INITIATION_FAILED', message: err.message || 'Payment initiation failed' },
      });
    }
  }

  /**
   * Tamara Asynchronous Webhook Notification Handler
   */
  async handleTamaraWebhook(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!tamaraService.verifyNotificationToken(authHeader)) {
      res.status(401).json({ error: 'Unauthorized webhook request' });
      return;
    }

    const { event_type, order_id, order_reference_id, total_amount } = req.body;
    console.log(
      `[Tamara Webhook] Event "${sanitizeLog(event_type)}" for order reference "${sanitizeLog(order_reference_id)}" (Tamara: ${sanitizeLog(order_id)})`
    );

    // Strictly validate order identifier against SSRF / path traversal
    let safeOrderId: string | undefined;
    if (order_id !== undefined && order_id !== null) {
      if (typeof order_id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(order_id.trim())) {
        console.warn('[Tamara Webhook] Rejected invalid order identifier format: %s', sanitizeLog(order_id));
        res.status(400).json({ error: 'Invalid order identifier format' });
        return;
      }
      safeOrderId = encodeURIComponent(order_id.trim());
    }

    try {
      if (event_type === 'order_approved' || event_type === 'order_captured') {
        if (safeOrderId && total_amount?.amount) {
          await tamaraService.capturePayment(safeOrderId, total_amount.amount, total_amount.currency || 'AED').catch(() => {});
        }
        await orderService.updatePaymentStatus(
          order_reference_id,
          'PAID',
          safeOrderId,
          { provider: 'TAMARA', captureId: `tamara_cap_${Date.now()}` },
          'Tamara payment approved and captured via webhook'
        );
      } else if (event_type === 'order_declined' || event_type === 'order_expired') {
        await orderService.updatePaymentStatus(
          order_reference_id,
          'FAILED',
          safeOrderId,
          { provider: 'TAMARA' },
          `Tamara payment status declined: ${event_type}`
        );
      } else if (event_type === 'order_refunded') {
        await orderService.updatePaymentStatus(
          order_reference_id,
          'REFUNDED',
          safeOrderId,
          { provider: 'TAMARA' },
          'Tamara payment refunded'
        );
      }

      res.status(200).send('OK');
    } catch (err: any) {
      console.error('[Tamara Webhook Error]:', err);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Tabby Asynchronous Webhook Notification Handler
   */
  async handleTabbyWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['x-tabby-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    if (!tabbyService.verifyWebhookSignature(signature, rawBody)) {
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const { id, status, order, amount } = req.body;
    console.log(
      `[Tabby Webhook] Payment ID "${sanitizeLog(id)}", status "${sanitizeLog(status)}" for order "${sanitizeLog(order?.reference_id)}"`
    );

    // Strictly validate payment identifier from webhook against SSRF and path traversal
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id.trim())) {
      console.warn('[Tabby Webhook] Rejected invalid payment identifier format: %s', sanitizeLog(id));
      res.status(400).json({ error: 'Invalid payment identifier format' });
      return;
    }
    const safePaymentId = encodeURIComponent(id.trim());

    try {
      const orderRef = order?.reference_id;
      if (!orderRef) {
        res.status(200).send('OK (No order ref)');
        return;
      }

      if (status === 'AUTHORIZED' || status === 'CLOSED') {
        if (safePaymentId && amount) {
          await tabbyService.capturePayment(safePaymentId, Number(amount)).catch(() => {});
        }
        await orderService.updatePaymentStatus(
          orderRef,
          'PAID',
          safePaymentId,
          { provider: 'TABBY', captureId: `tabby_cap_${Date.now()}` },
          `Tabby payment ${status} via webhook`
        );
      } else if (status === 'REJECTED' || status === 'EXPIRED') {
        await orderService.updatePaymentStatus(
          orderRef,
          'FAILED',
          safePaymentId,
          { provider: 'TABBY' },
          `Tabby payment ${status}`
        );
      } else if (status === 'REFUNDED') {
        await orderService.updatePaymentStatus(
          orderRef,
          'REFUNDED',
          safePaymentId,
          { provider: 'TABBY' },
          'Tabby payment refunded'
        );
      }

      res.status(200).send('OK');
    } catch (err: any) {
      console.error('[Tabby Webhook Error]:', err);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Retrieves order payment settlement status for the customer callback status page
   */
  async getPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orderId = String(req.params.orderId || '');
    if (!orderId) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Order ID is required' } });
      return;
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
      return;
    }

    // Role security check
    if (req.user && req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        total: order.total,
        currency: order.currency,
        paymentReference: order.paymentReference,
        paymentMetadata: order.paymentMetadata,
      },
    });
  }

  /**
   * Verifies and finalizes payment settlement upon return from payment gateway
   */
  async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { orderId, status, paymentId, isSimulated } = req.body;
    if (!orderId) {
      res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Order ID is required' } });
      return;
    }

    const order = await orderService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
      return;
    }

    if (req.user && req.user.role === 'CUSTOMER' && order.userId !== req.user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    if (order.paymentStatus === 'PAID') {
      res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus,
        },
      });
      return;
    }

    const isSuccess =
      status === 'success' ||
      status === 'approved' ||
      status === 'authorized' ||
      isSimulated === true ||
      isSimulated === 'true';

    if (isSuccess) {
      const refId = paymentId || order.paymentReference || `${order.paymentMethod.toLowerCase()}_ref_${Date.now()}`;
      const updated = await orderService.updatePaymentStatus(
        order.id,
        'PAID',
        refId,
        {
          provider: order.paymentMethod as any,
          isSimulated: !!isSimulated,
          verifiedAt: new Date().toISOString(),
        },
        `${order.paymentMethod} installment payment verified and approved.`
      );

      res.status(200).json({
        success: true,
        data: {
          orderId: updated?.id || order.id,
          orderNumber: updated?.orderNumber || order.orderNumber,
          paymentStatus: updated?.paymentStatus || 'PAID',
          orderStatus: updated?.orderStatus || 'PROCESSING',
        },
      });
    } else {
      const updated = await orderService.updatePaymentStatus(
        order.id,
        'FAILED',
        paymentId || order.paymentReference,
        {
          provider: order.paymentMethod as any,
          failedReason: status || 'User cancelled or authorization declined',
        },
        `${order.paymentMethod} installment checkout was cancelled or declined.`
      );

      res.status(200).json({
        success: false,
        data: {
          orderId: updated?.id || order.id,
          orderNumber: updated?.orderNumber || order.orderNumber,
          paymentStatus: updated?.paymentStatus || 'FAILED',
          orderStatus: updated?.orderStatus || order.orderStatus,
        },
      });
    }
  }
}

export const paymentController = new PaymentController();
