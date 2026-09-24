import { Quote, Order } from '@/types';

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'qte_alfuttaim_89412',
    quoteNumber: 'QTE-2026-89412',
    companyName: 'Al-Futtaim Cloud Infrastructure LLC',
    contactName: 'Tariq Mansoor',
    contactEmail: 'tariq.mansoor@alfuttaim.ae',
    contactPhone: '+971 4 290 5500',
    taxRegistrationNumber: '100293847100003',
    items: [
      {
        productId: 'prod_rtx4090',
        productName: 'ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB GDDR6X',
        sku: 'ROG-STRIX-RTX4090-O24G-GAMING',
        unitPrice: 7699,
        quantity: 8,
        discount: 1592,
        subtotal: 60000,
        specifications: { memory: '24GB GDDR6X', interface: 'PCIe 4.0' },
      },
      {
        productId: 'prod_i9_14900k',
        productName: 'Intel Core i9-14900K 24-Core Desktop Processor',
        sku: 'BX8071514900K',
        unitPrice: 2299,
        quantity: 8,
        discount: 792,
        subtotal: 17600,
        specifications: { socket: 'LGA1700', cores: '24 Cores / 32 Threads' },
      },
    ],
    subtotal: 77600,
    discount: 2384,
    tax: 3880,
    shipping: 0,
    total: 81480,
    currency: 'AED',
    status: 'PENDING_REVIEW',
    validUntil: '2026-10-15T18:00:00.000Z',
    notes: 'Urgent enterprise deployment for High-Performance Deep Learning cluster in DIFC data center.',
    createdAt: '2026-09-14T09:30:00.000Z',
    updatedAt: '2026-09-14T09:30:00.000Z',
  },
  {
    id: 'qte_dubaifuture_92105',
    quoteNumber: 'QTE-2026-92105',
    companyName: 'Dubai Future Foundation Labs',
    contactName: 'Dr. Sarah Al-Hashimi',
    contactEmail: 'sarah.hashimi@dubaifuture.gov.ae',
    contactPhone: '+971 4 516 6666',
    taxRegistrationNumber: '100492817200003',
    items: [
      {
        productId: 'prod_corsair_ddr5',
        productName: 'Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5 6000MHz',
        sku: 'CMP64GX5M2B6000C30',
        unitPrice: 1249,
        quantity: 16,
        discount: 984,
        subtotal: 19000,
        specifications: { speed: '6000MHz CL30' },
      },
    ],
    subtotal: 19000,
    discount: 984,
    tax: 950,
    shipping: 0,
    total: 19950,
    currency: 'AED',
    status: 'APPROVED',
    validUntil: '2026-10-10T18:00:00.000Z',
    notes: 'Government purchase tender. Standard Net-30 invoicing terms approved.',
    createdAt: '2026-09-13T14:15:00.000Z',
    updatedAt: '2026-09-14T11:00:00.000Z',
  },
];

declare global {
  var __nextechQuotesStore: Quote[] | undefined;
  var __nextechConvertedOrders: Order[] | undefined;
}

export function getQuotesStore(): Quote[] {
  if (!globalThis.__nextechQuotesStore) {
    globalThis.__nextechQuotesStore = JSON.parse(JSON.stringify(INITIAL_QUOTES));
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
