import { Quote, Order } from '@/types';

export const INITIAL_QUOTES: Quote[] = [];

declare global {
  var __nextechQuotesStore: Quote[] | undefined;
  var __nextechConvertedOrders: Order[] | undefined;
}

export function getQuotesStore(): Quote[] {
  if (!globalThis.__nextechQuotesStore) {
    globalThis.__nextechQuotesStore = [];
  }
  return globalThis.__nextechQuotesStore as Quote[];
}

export function updateQuoteInStore(updated: Partial<Quote> & { id?: string; quoteNumber?: string }): Quote | null {
  const store = getQuotesStore();
  const index = store.findIndex(
    q => (updated.id && q.id === updated.id) || (updated.quoteNumber && q.quoteNumber === updated.quoteNumber)
  );
  if (index >= 0) {
    store[index] = { ...store[index], ...updated, updatedAt: new Date().toISOString() };
    return store[index];
  }
  return null;
}

export function addQuoteToStore(quote: Quote): Quote {
  const store = getQuotesStore();
  store.unshift(quote);
  return quote;
}

export function getConvertedOrdersStore(): Order[] {
  if (!globalThis.__nextechConvertedOrders) {
    globalThis.__nextechConvertedOrders = [];
  }
  return globalThis.__nextechConvertedOrders as Order[];
}

export function addOrderToStore(order: Order): Order {
  const orders = getConvertedOrdersStore();
  const exists = orders.find(o => o.id === order.id || o.orderNumber === order.orderNumber);
  if (!exists) {
    orders.unshift(order);
  }
  return order;
}
