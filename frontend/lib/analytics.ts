/**
 * NexTech Systems - Google Analytics 4 (GA4) Client Telemetry
 * Provides type-safe event tracking, pageviews, and e-commerce transactions.
 */

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Log page view in Google Analytics
 */
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
      page_title: title || document.title,
    });
  }
};

/**
 * Log custom interaction event in Google Analytics
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number,
  params: Record<string, any> = {}
) => {
  if (typeof window !== 'undefined' && window.gtag && GA_TRACKING_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...params,
    });
  }
};

/**
 * E-Commerce: Track Product View
 */
export const trackViewItem = (product: { id: string; name: string; price: number; categoryName?: string; brandName?: string }) => {
  trackEvent('view_item', 'E-Commerce', product.name, product.price, {
    currency: 'AED',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.categoryName || 'Hardware',
        item_brand: product.brandName || 'NexTech',
        price: product.price,
        quantity: 1,
      },
    ],
  });
};

/**
 * E-Commerce: Track Add to Cart
 */
export const trackAddToCart = (product: { id: string; name: string; price: number; quantity: number }) => {
  trackEvent('add_to_cart', 'E-Commerce', product.name, product.price * product.quantity, {
    currency: 'AED',
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
      },
    ],
  });
};

/**
 * E-Commerce: Track Purchase Order Completion
 */
export const trackPurchase = (order: {
  id: string;
  orderNumber: string;
  total: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: Array<{ productId: string; productName: string; unitPrice: number; quantity: number }>;
}) => {
  trackEvent('purchase', 'E-Commerce', order.orderNumber, order.total, {
    transaction_id: order.orderNumber || order.id,
    value: order.total,
    currency: 'AED',
    tax: order.tax || Math.round(order.total * 0.05),
    shipping: order.shipping || 0,
    coupon: order.coupon,
    items: order.items.map(item => ({
      item_id: item.productId,
      item_name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity,
    })),
  });
};

/**
 * Custom: Track PC Builder Configuration Saved / Validated
 */
export const trackPCBuilderComplete = (totalPrice: number, componentCount: number, socket: string) => {
  trackEvent('pc_builder_configured', 'Tools', `Socket ${socket}`, totalPrice, {
    currency: 'AED',
    component_count: componentCount,
    socket_architecture: socket,
  });
};
