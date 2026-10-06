import { ENV } from '../config/env.js';
import { Order } from '../types/index.js';

export interface TamaraCheckoutSessionResult {
  checkoutUrl: string;
  orderId: string;
  status: string;
  isSimulated?: boolean;
  raw?: any;
}

export class TamaraService {
  private baseUrl = (ENV.TAMARA_API_URL || 'https://api-sandbox.tamara.co').replace(/\/$/, '');
  private apiToken = ENV.TAMARA_API_TOKEN;
  private notificationToken = ENV.TAMARA_NOTIFICATION_TOKEN;

  /**
   * Initializes a Tamara split-in-4 installment checkout session
   */
  async createCheckoutSession(
    order: Order,
    returnUrls: { success: string; failure: string; cancel: string; notification: string }
  ): Promise<TamaraCheckoutSessionResult> {
    const clientUrl = ENV.CLIENT_URL.replace(/\/$/, '');

    // Fallback in local development or if merchant token is unconfigured
    if (!this.apiToken) {
      console.log(
        `[TamaraService: Simulated Sandbox] TAMARA_API_TOKEN not configured. Generating local simulated checkout session for Order #${order.orderNumber}.`
      );
      const simulatedRedirect = `${clientUrl}/checkout/payment-status?orderId=${order.id}&status=success&provider=TAMARA&simulated=true`;
      return {
        checkoutUrl: simulatedRedirect,
        orderId: `tamara_sim_${order.id}`,
        status: 'NEW',
        isSimulated: true,
      };
    }

    const payload = {
      order_reference_id: order.id,
      order_number: order.orderNumber,
      total_amount: {
        amount: Number(order.total.toFixed(2)),
        currency: order.currency || 'AED',
      },
      shipping_amount: {
        amount: Number((order.shippingFee || 0).toFixed(2)),
        currency: order.currency || 'AED',
      },
      tax_amount: {
        amount: Number((order.tax || 0).toFixed(2)),
        currency: order.currency || 'AED',
      },
      discount: order.discount > 0
        ? {
            name: order.couponCode || 'Promo Discount',
            amount: {
              amount: Number(order.discount.toFixed(2)),
              currency: order.currency || 'AED',
            },
          }
        : undefined,
      description: `NexTech Enterprise Hardware Order #${order.orderNumber}`,
      country_code: 'AE',
      payment_type: 'PAY_BY_INSTALMENTS',
      instalments: 4,
      items: order.items.map(item => ({
        reference_id: item.productId,
        type: 'Physical',
        name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: {
          amount: Number(item.unitPrice.toFixed(2)),
          currency: order.currency || 'AED',
        },
        total_amount: {
          amount: Number(item.subtotal.toFixed(2)),
          currency: order.currency || 'AED',
        },
      })),
      consumer: {
        first_name: order.customerName.split(' ')[0] || 'Customer',
        last_name: order.customerName.split(' ').slice(1).join(' ') || 'Partner',
        phone_number: order.customerPhone || order.shippingAddress.phone || '+971500000000',
        email: order.customerEmail,
      },
      shipping_address: {
        first_name: order.shippingAddress.fullName || order.customerName,
        last_name: '',
        line1: order.shippingAddress.addressLine1,
        city: order.shippingAddress.city || 'Dubai',
        country_code: 'AE',
        phone_number: order.shippingAddress.phone || order.customerPhone || '+971500000000',
      },
      merchant_url: {
        success: returnUrls.success,
        failure: returnUrls.failure,
        cancel: returnUrls.cancel,
        notification: returnUrls.notification,
      },
    };

    const response = await fetch(`${this.baseUrl}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = (data as any)?.message || `Tamara API checkout failed with status ${response.status}`;
      throw new Error(errMsg);
    }

    return {
      checkoutUrl: (data as any).checkout_url,
      orderId: (data as any).order_id,
      status: (data as any).status,
      raw: data,
    };
  }

  /**
   * Authorizes an approved Tamara order
   */
  async authoriseOrder(tamaraOrderId: string): Promise<any> {
    if (!this.apiToken || tamaraOrderId.startsWith('tamara_sim_')) {
      return { order_id: tamaraOrderId, status: 'AUTHORISED', isSimulated: true };
    }

    const response = await fetch(`${this.baseUrl}/orders/${tamaraOrderId}/authorise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
    });

    return response.json().catch(() => ({}));
  }

  /**
   * Captures payment for an authorized order
   */
  async capturePayment(tamaraOrderId: string, amount: number, currency = 'AED'): Promise<any> {
    if (!this.apiToken || tamaraOrderId.startsWith('tamara_sim_')) {
      return { capture_id: `cap_sim_${Date.now()}`, status: 'CAPTURED', isSimulated: true };
    }

    const response = await fetch(`${this.baseUrl}/payments/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        order_id: tamaraOrderId,
        total_amount: {
          amount: Number(amount.toFixed(2)),
          currency,
        },
      }),
    });

    return response.json().catch(() => ({}));
  }

  /**
   * Issues a partial or full refund for a captured order
   */
  async refundPayment(tamaraOrderId: string, amount: number, comment?: string): Promise<any> {
    if (!this.apiToken || tamaraOrderId.startsWith('tamara_sim_')) {
      return { refund_id: `ref_sim_${Date.now()}`, status: 'REFUNDED', isSimulated: true };
    }

    const response = await fetch(`${this.baseUrl}/payments/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        order_id: tamaraOrderId,
        total_amount: {
          amount: Number(amount.toFixed(2)),
          currency: 'AED',
        },
        comment: comment || 'Customer Refund',
      }),
    });

    return response.json().catch(() => ({}));
  }

  /**
   * Validates webhook notification token if configured
   */
  verifyNotificationToken(tokenHeader?: string): boolean {
    if (!this.notificationToken) return true; // If not configured in test, pass through
    return tokenHeader === `Bearer ${this.notificationToken}` || tokenHeader === this.notificationToken;
  }
}

export const tamaraService = new TamaraService();
