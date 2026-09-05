import { Product } from '@/types';
import { formatPrice } from './utils';
import { getApiUrl } from './api-client';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  links?: { label: string; url: string }[];
}

let liveCatalogCache: Product[] = [];

export async function fetchLiveCatalog(): Promise<Product[]> {
  try {
    const res = await fetch(getApiUrl('/products?limit=100'), { cache: 'no-store' });
    const data = await res.json();
    if (data && Array.isArray(data.data)) {
      liveCatalogCache = data.data;
      return liveCatalogCache;
    }
  } catch (err) {
    // Client-side fallback if fetch fails
  }
  return liveCatalogCache;
}

export function setLiveCatalog(products: Product[]) {
  liveCatalogCache = products;
}

// Guardrail check: Is query related to NexTech Systems store domain?
export function isQueryAllowed(query: string): boolean {
  const q = query.toLowerCase().trim();

  // Explicitly banned off-topic patterns (trivia, non-tech cooking, world politics, celebrities, outside essays, etc.)
  const offTopicKeywords = [
    'recipe', 'cook', 'bake', 'food recipe', 'president of', 'weather in',
    'who won the match', 'football score', 'movie review', 'actor', 'actress',
    'write python code to scrape', 'write a poem about love', 'crypto trading bot',
    'horoscope', 'joke about politics', 'who is elon musk', 'capital of'
  ];

  for (const banned of offTopicKeywords) {
    if (q.includes(banned)) return false;
  }

  // Allowed store-domain keywords
  const storeKeywords = [
    'product', 'price', 'gpu', 'cpu', 'processor', 'rtx', '4090', 'intel', 'amd', '14900k',
    '7950x', 'motherboard', 'ram', 'ddr5', 'ddr4', 'ssd', 'nvme', 'samsung', 'corsair',
    'asus', 'rog', 'dell', 'poweredge', 'server', 'cisco', 'switch', 'poe', 'pc builder',
    'compatibility', 'socket', 'lga1700', 'am5', 'wattage', 'psu', 'cart', 'checkout',
    'order', 'shipping', 'delivery', 'gcc', 'uae', 'dubai', 'vat', 'tax', 'coupon', 'discount',
    'tech10', 'summer50', 'reseller', 'vendor', 'admin', 'wallet', 'refund', 'invoice',
    'e-bill', 'warranty', 'support', 'stock', 'store', 'nextech', 'nextech systems', 'return',
    'how to buy', 'compare', 'difference between', 'spec', 'specs', 'recommend', 'help'
  ];

  return storeKeywords.some(keyword => q.includes(keyword)) || q.length < 50;
}

export function generateStoreAIResponse(
  userMessage: string,
  dynamicProducts: Product[] = liveCatalogCache
): { text: string; links?: { label: string; url: string }[] } {
  const q = userMessage.toLowerCase().trim();

  // 1. Guardrail rejection
  if (!isQueryAllowed(q)) {
    return {
      text: "🔒 **NexTech Policy Guardrail**: I am the **NexTech Systems AI Assistant**, specialized exclusively in our computer hardware catalog, PC Builder compatibility matrix, enterprise servers, orders, warranty, and GCC store policies.\n\nI cannot assist with queries outside the NexTech Systems store domain. Please feel free to ask about our components, compatibility verification, discount coupons, or shipping terms!",
      links: [
        { label: 'Browse Hardware Catalog', url: '/products' },
        { label: 'Launch PC Builder Matrix', url: '/pc-builder' }
      ]
    };
  }

  // 2. Coupon & Discount queries
  if (q.includes('coupon') || q.includes('discount') || q.includes('promo') || q.includes('voucher') || q.includes('code') || q.includes('tech10') || q.includes('summer50') || q.includes('save')) {
    return {
      text: `🎁 **Active NexTech Promotional Coupons**:\n\n1. **\`TECH10\`** — **10% OFF** entire cart subtotal on all hardware components, CPUs, RTX 4090s, and workstations.\n2. **\`SUMMER50\`** — **AED 50 Flat Discount** on orders with subtotal above AED 300.\n\n*To apply a code, add any components to your cart and enter the coupon code in the Promotional Discount field.*`,
      links: [
        { label: 'Open Shopping Cart', url: '/cart' },
        { label: 'Browse Hardware Deals', url: '/products?featured=true' }
      ]
    };
  }

  // 3. PC Builder & Socket / PSU Compatibility
  if (q.includes('pc builder') || q.includes('build') || q.includes('socket') || q.includes('compatibility') || q.includes('lga1700') || q.includes('am5') || q.includes('wattage') || q.includes('psu') || q.includes('ddr5')) {
    return {
      text: `🧩 **NexTech PC Compatibility Engine Rules**:\n\n- **CPU & Socket Pairing**: Intel Core 14th/13th Gen requires **LGA1700** motherboards (such as the ASUS ROG Maximus Z790). AMD Ryzen 7000/9000 requires **AM5** motherboards (such as the ASUS ROG Crosshair X670E). Cross-brand socket mismatch is strictly prevented.\n- **Memory Matching**: DDR5 motherboards require DDR5 RAM kits (e.g. Corsair Vengeance 6000MHz). DDR4 and DDR5 cannot be mixed.\n- **PSU Headroom Calculation**: The system tallies total component draw (e.g., RTX 4090 450W + i9-14900K 253W) and enforces an additional **+30% safety headroom buffer**.\n- **1-Click Cart**: You can bundle your full custom build directly to checkout with automated VAT calculation.`,
      links: [
        { label: 'Launch PC Compatibility Matrix', url: '/pc-builder' },
        { label: 'Compare Hardware Specs', url: '/compare' }
      ]
    };
  }

  // 4. Shipping, Delivery & VAT inquiries
  if (q.includes('shipping') || q.includes('delivery') || q.includes('gcc') || q.includes('dubai') || q.includes('uae') || q.includes('saudi') || q.includes('tax') || q.includes('vat') || q.includes('trn') || q.includes('free shipping')) {
    return {
      text: `🚚 **Shipping & Electronic Tax Policy**:\n\n- **Free GCC Express Insured Shipping**: Available on all orders and custom workstations over **AED 500** across the UAE, KSA, Oman, Qatar, Bahrain, and Kuwait.\n- **Delivery Time**: Next-day courier dispatch in Dubai/UAE; 2-4 business days for other GCC destinations.\n- **UAE 5% VAT**: All catalog prices include standard 5% UAE VAT.\n- **Tax Invoices**: Downloadable and printable electronic tax invoices (E-Bills) with registered TRN (**TRN-10029384910003**) are generated instantly upon order confirmation.`,
      links: [
        { label: 'View Customer Dashboard & Invoices', url: '/account/orders' },
        { label: 'Customer Wallet Ledger', url: '/account/wallet' }
      ]
    };
  }

  // 5. Dynamic Product Matches from Database
  if (dynamicProducts && dynamicProducts.length > 0) {
    const matchedProducts = dynamicProducts.filter(p => {
      const name = p.name.toLowerCase();
      const brand = (p.brandName || '').toLowerCase();
      const sku = (p.sku || '').toLowerCase();
      const tags = (p.tags || []).map(t => t.toLowerCase());
      return q.split(/\s+/).some(token => token.length > 2 && (name.includes(token) || brand.includes(token) || sku.includes(token) || tags.includes(token)));
    });

    if (matchedProducts.length > 0) {
      const topProduct = matchedProducts[0];
      const specSummary = Object.entries(topProduct.specifications || {})
        .slice(0, 4)
        .map(([k, v]) => `• **${k}**: ${v}`)
        .join('\n');

      return {
        text: `🔥 **${topProduct.name}**\n\n- **Price**: ${formatPrice(topProduct.salePrice || topProduct.price, topProduct.currency)}${topProduct.salePrice ? ` *(Reg: ${formatPrice(topProduct.price, topProduct.currency)})*` : ''}\n- **Availability**: ${topProduct.stock > 0 ? `✅ In Stock (${topProduct.stock} units)` : '⚠️ Backorder / Contact Sales'}\n- **Brand / Origin**: ${topProduct.brandName} (Official Warranty)\n${specSummary ? `\n**Technical Specs**:\n${specSummary}` : ''}`,
        links: [
          { label: `View ${topProduct.name.slice(0, 24)}...`, url: `/products/${topProduct.slug}` },
          { label: 'PC Builder Matrix', url: '/pc-builder' }
        ]
      };
    }
  }

  // 6. Enterprise Server / Dell PowerEdge / Cisco Switches
  if (q.includes('server') || q.includes('dell') || q.includes('poweredge') || q.includes('r760') || q.includes('cisco') || q.includes('catalyst') || q.includes('switch') || q.includes('poe') || q.includes('datacenter') || q.includes('b2b')) {
    return {
      text: `🏢 **Enterprise Datacenter & Infrastructure**:\n\n1. **Dell PowerEdge R760 2U Server** (**AED 32,500**): Dual Intel Xeon Gold 6430 (64 Cores), 128GB ECC DDR5, 8x 3.84TB NVMe Enterprise SSDs with Dell ProSupport Plus.\n2. **Cisco Catalyst 9300 48-Port PoE+ Switch** (**AED 18,499**): 256 Gbps switching capacity, 437W PoE budget, MACsec 256-bit encryption, StackWise-480.\n\n*Custom enterprise procurement and VAT invoices available on request.*`,
      links: [
        { label: 'View Dell PowerEdge R760 Server', url: '/products/dell-poweredge-r760-2u-enterprise-rack-server' },
        { label: 'View Cisco Catalyst 9300 Switch', url: '/products/cisco-catalyst-9300-48-port-poe-managed-switch' }
      ]
    };
  }

  // 7. Wallet & Payment options
  if (q.includes('wallet') || q.includes('payment') || q.includes('credit card') || q.includes('cod') || q.includes('cash on delivery') || q.includes('refund')) {
    return {
      text: `💳 **Supported Payment & Settlement Options**:\n\n- **Direct Customer Wallet**: Instant 1-click checkout with prepaid balance & refunds.\n- **Credit / Debit Cards**: Visa, Mastercard, AMEX with 256-Bit SSL encryption.\n- **Cash on Delivery (COD)**: Available for UAE deliveries.\n- **Partial Wallet Deductions**: You can redeem available wallet balance and pay the remainder via Credit Card or COD during checkout.`,
      links: [
        { label: 'Manage Customer Wallet', url: '/account/wallet' },
        { label: 'Proceed to Checkout', url: '/checkout' }
      ]
    };
  }

  // 8. Reseller & Partner Inquiries
  if (q.includes('reseller') || q.includes('vendor') || q.includes('merchant') || q.includes('comnet') || q.includes('admin') || q.includes('excel') || q.includes('portal')) {
    return {
      text: `🏪 **NexTech Multi-Tenant Reseller & Admin Ecosystem**:\n\n- **Reseller Portal** (\`/reseller/comnet101/dashboard\`): Bulk Excel catalog import, commission tracking, inventory management, and sub-store branding.\n- **Admin Command Center** (\`/admin\`): Master analytics, product approvals, order state management (\`PROCESSING\`, \`SHIPPED\`), coupon creation, and compliance audit logs.`,
      links: [
        { label: 'Reseller Portal (ComNet Store)', url: '/reseller/comnet101/dashboard' },
        { label: 'Admin Command Center', url: '/admin' }
      ]
    };
  }

  // 9. General Hardware Catalog overview / fallback
  return {
    text: `👋 **Welcome to NexTech Systems AI Hardware Assistant**!\n\nI can help you with:\n- **Hardware Specs & Availability**: Inquire about CPUs, RTX 4090 GPUs, DDR5 RAM, and NVMe SSDs.\n- **PC Compatibility Matrix**: Verify socket compatibility (LGA1700 / AM5) and PSU wattage requirements.\n- **Discounts & Coupons**: Apply promo codes like \`TECH10\` (10% off) or \`SUMMER50\` (AED 50 off).\n- **Enterprise Infrastructure**: Explore Dell PowerEdge Xeon servers & Cisco enterprise networking.\n- **Orders, Shipping & VAT**: Inquire about GCC free insured shipping over AED 500 and 5% UAE VAT.\n\n*How can I assist your setup today?*`,
    links: [
      { label: 'Browse Hardware Catalog', url: '/products' },
      { label: 'Launch PC Builder Matrix', url: '/pc-builder' },
      { label: 'Compare Hardware Specs', url: '/compare' }
    ]
  };
}
