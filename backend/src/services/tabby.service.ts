import crypto from 'crypto';
import { ENV } from '../config/env.js';
import { Order } from '../types/index.js';

export interface TabbyCheckoutSessionResult {
  checkoutUrl: string;
  paymentId: string;
  status: string;
  isSimulated?: boolean;
  raw?: any;
}

/**
 * Strictly validates and sanitizes transaction/payment identifiers to prevent
 * Server-Side Request Forgery (SSRF) and Path Traversal vulnerabilities (CWE-918).
 * Ensures only alphanumeric, hyphen, and underscore characters are present.
 */
function sanitizeIdentifier(id: unknown): string {
  if (typeof id !== 'string') {
    throw new Error('Invalid payment identifier: Expected string');
  }
  const trimmed = id.trim();
  if (!trimmed || !/^[a-zA-Z0-9_-]{1,128}$/.test(trimmed)) {
    throw new Error('Invalid payment identifier format: must contain only alphanumeric characters, dashes, and underscores');
  }
  return encodeURIComponent(trimmed);
}

export class TabbyService {
  private baseUrl = (ENV.TABBY_API_URL || 'https://api.tabby.ai').replace(/\/$/, '');
  private secretKey = ENV.TABBY_SECRET_KEY;
  private merchantCode = ENV.TABBY_MERCHANT_CODE || 'nextech_ae';

  /**
   * Resolves and validates the target API URL against an allowlisted origin
   */
  private buildEndpointUrl(pathname: string): string {
    const defaultHost = 'https://api.tabby.ai';
    let base: URL;
    try {
      base = new URL(this.baseUrl || defaultHost);
      if (!['https:', 'http:'].includes(base.protocol)) {
        base = new URL(defaultHost);
      }
    } catch {
      base = new URL(defaultHost);
    }

    const resolved = new URL(pathname, base.origin);
    if (resolved.origin !== base.origin) {
      throw new Error('Security Error: Target URL origin mismatch');
    }
    return resolved.toString();
  }

  /**
   * Initializes a Tabby 4-interest-free installments checkout session
   */
  async createCheckoutSession(
    order: Order,
    returnUrls: { success: string; cancel: string; failure: string }
  ): Promise<TabbyCheckoutSessionResult> {
    const clientUrl = ENV.CLIENT_URL.replace(/\/$/, '');

    // Fallback in local development or if secret key is unconfigured
    if (!this.secretKey) {
      console.log(
        `[TabbyService: Simulated Sandbox] TABBY_SECRET_KEY not configured. Generating local simulated checkout session for Order #${order.orderNumber}.`
      );
      const simulatedRedirect = `${clientUrl}/checkout/payment-status?orderId=${order.id}&status=success&provider=TABBY&simulated=true`;
      return {
        checkoutUrl: simulatedRedirect,
        paymentId: `tabby_sim_${order.id}`,
        status: 'created',
        isSimulated: true,
      };
    }

    const payload = {
      payment: {
        amount: order.total.toFixed(2),
        currency: order.currency || 'AED',
        description: `NexTech Enterprise Hardware Order #${order.orderNumber}`,
        buyer: {
          phone: order.customerPhone || order.shippingAddress.phone || '+971500000000',
          email: order.customerEmail,
          name: order.customerName,
        },
        shipping_address: {
          city: order.shippingAddress.city || 'Dubai',
          address: order.shippingAddress.addressLine1,
          zip: order.shippingAddress.postalCode || '00000',
        },
        order: {
          tax_amount: (order.tax || 0).toFixed(2),
          shipping_amount: (order.shippingFee || 0).toFixed(2),
          discount_amount: (order.discount || 0).toFixed(2),
          reference_id: order.id,
          items: order.items.map(it => ({
            title: it.productName,
            description: it.sku,
            quantity: it.quantity,
            unit_price: it.unitPrice.toFixed(2),
            reference_id: it.productId,
          })),
        },
        buyer_history: {
          registered_since: order.createdAt || new Date().toISOString(),
          loyalty_level: 0,
        },
      },
      lang: 'en',
      merchant_code: this.merchantCode,
      merchant_urls: returnUrls,
    };

    const endpoint = this.buildEndpointUrl('/api/v2/checkout');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = (data as any)?.error || (data as any)?.message || `Tabby checkout failed with status ${response.status}`;
      throw new Error(errMsg);
    }

    const installmentProduct = (data as any).configuration?.available_products?.installments?.[0];
    const checkoutUrl = installmentProduct?.web_url || (data as any).payment?.web_url;
    const paymentId = (data as any).payment?.id;

    if (!checkoutUrl) {
      throw new Error('Tabby did not return an available installment checkout URL for this purchase.');
    }

    return {
      checkoutUrl,
      paymentId,
      status: (data as any).status || 'created',
      raw: data,
    };
  }

  /**
   * Captures an authorized Tabby payment
   */
  async capturePayment(paymentId: string, amount: number): Promise<any> {
    const cleanId = sanitizeIdentifier(paymentId);
    if (!this.secretKey || cleanId.startsWith('tabby_sim_')) {
      return { id: `cap_sim_${Date.now()}`, amount: amount.toFixed(2), status: 'CLOSED', isSimulated: true };
    }

    const endpoint = this.buildEndpointUrl(`/api/v1/payments/${cleanId}/captures`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify({ amount: amount.toFixed(2) }),
    });

    return response.json().catch(() => ({}));
  }

  /**
   * Refunds a captured Tabby payment
   */
  async refundPayment(paymentId: string, amount: number, reason?: string): Promise<any> {
    const cleanId = sanitizeIdentifier(paymentId);
    if (!this.secretKey || cleanId.startsWith('tabby_sim_')) {
      return { id: `ref_sim_${Date.now()}`, amount: amount.toFixed(2), status: 'REFUNDED', isSimulated: true };
    }

    const endpoint = this.buildEndpointUrl(`/api/v1/payments/${cleanId}/refunds`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.secretKey}`,
      },
      body: JSON.stringify({
        amount: amount.toFixed(2),
        reason: reason || 'Customer Refund',
      }),
    });

    return response.json().catch(() => ({}));
  }

  /**
   * Verifies Tabby webhook signature header
   */
  verifyWebhookSignature(headerSignature?: string, rawPayload?: string): boolean {
    if (!this.secretKey || !headerSignature || !rawPayload) return true;
    try {
      const computed = crypto.createHmac('sha256', this.secretKey).update(rawPayload).digest('hex');
      return computed === headerSignature;
    } catch {
      return false;
    }
  }
}

export const tabbyService = new TabbyService();
