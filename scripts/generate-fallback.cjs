const fs = require('fs');
const path = require('path');

const prods = JSON.parse(fs.readFileSync('backend/data_store/products.json', 'utf8'));
const hero = JSON.parse(fs.readFileSync('backend/data_store/hero_highlights.json', 'utf8'));
const solutions = JSON.parse(fs.readFileSync('backend/data_store/enterprise_solutions.json', 'utf8'));
const benchmarks = JSON.parse(fs.readFileSync('backend/data_store/hardware_benchmarks.json', 'utf8'));
const testimonials = JSON.parse(fs.readFileSync('backend/data_store/testimonials.json', 'utf8'));
const bento = JSON.parse(fs.readFileSync('backend/data_store/bento_features.json', 'utf8'));
const builderPresets = JSON.parse(fs.readFileSync('backend/data_store/builder_presets.json', 'utf8'));
const coupons = JSON.parse(fs.readFileSync('backend/data_store/coupons.json', 'utf8'));
const users = JSON.parse(fs.readFileSync('backend/data_store/users.json', 'utf8'));
const orders = JSON.parse(fs.readFileSync('backend/data_store/orders.json', 'utf8'));
const resellers = JSON.parse(fs.readFileSync('backend/data_store/resellers.json', 'utf8'));
const rawSettings = JSON.parse(fs.readFileSync('backend/data_store/settings.json', 'utf8'));
const rawObj = Array.isArray(rawSettings) ? rawSettings[0] : (rawSettings.global_settings || rawSettings);
const { id, updatedAt, createdAt, ...cleanSettings } = rawObj || {};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80';

const sanitizedProducts = prods.map(p => {
  const images = (Array.isArray(p.images) && p.images.length > 0) ? p.images : [p.thumbnail || DEFAULT_IMAGE];
  const thumbnail = p.thumbnail || images[0] || DEFAULT_IMAGE;
  return {
    ...p,
    brandId: p.brandId || `brand_${(p.brandName || 'generic').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    currency: p.currency || 'AED',
    images,
    thumbnail,
  };
});

const cleanAddress = (addr, idx = 0) => {
  if (!addr) return addr;
  const { company, street, zipCode, ...rest } = addr;
  return {
    id: rest.id || `addr_${idx + 1}`,
    ...rest,
    addressLine1: rest.addressLine1 || street || 'Address Line 1',
    postalCode: rest.postalCode || zipCode || '00000',
  };
};

const sanitizedOrders = orders.map(o => ({
  ...o,
  shippingAddress: cleanAddress(o.shippingAddress),
  billingAddress: cleanAddress(o.billingAddress),
  statusHistory: (o.statusHistory || []).map(sh => {
    const { updatedBy, ...restSh } = sh;
    return restSh;
  }),
}));

const outLines = [
  '// Resilient fallback data for standalone Next.js deployment (Vercel serverless runtime)',
  "import {",
  "  Product,",
  "  Category,",
  "  Brand,",
  "  HeroHighlight,",
  "  EnterpriseSolution,",
  "  HardwareBenchmarkCategory,",
  "  ClientTestimonial,",
  "  BentoFeature,",
  "  BuilderPreset,",
  "  Coupon,",
  "  StoreSettings,",
  "  HomePageContent,",
  "  User,",
  "  Order,",
  "  Reseller,",
  "} from '@/types';",
  "import { DEFAULT_CATEGORIES, DEFAULT_BRANDS } from './default-taxonomy';",
  '',
  `export const FALLBACK_PRODUCTS: Product[] = ${JSON.stringify(sanitizedProducts, null, 2)};`,
  '',
  `export const FALLBACK_HERO_HIGHLIGHTS: HeroHighlight[] = ${JSON.stringify(hero, null, 2)};`,
  '',
  `export const FALLBACK_ENTERPRISE_SOLUTIONS: EnterpriseSolution[] = ${JSON.stringify(solutions, null, 2)};`,
  '',
  `export const FALLBACK_BENCHMARKS: HardwareBenchmarkCategory[] = ${JSON.stringify(benchmarks, null, 2)};`,
  '',
  `export const FALLBACK_TESTIMONIALS: ClientTestimonial[] = ${JSON.stringify(testimonials, null, 2)};`,
  '',
  `export const FALLBACK_BENTO_FEATURES: BentoFeature[] = ${JSON.stringify(bento, null, 2)};`,
  '',
  `export const FALLBACK_BUILDER_PRESETS: BuilderPreset[] = ${JSON.stringify(builderPresets, null, 2)};`,
  '',
  `export const FALLBACK_COUPON: Coupon = ${JSON.stringify(coupons[0] || null, null, 2)};`,
  '',
  `export const FALLBACK_STORE_SETTINGS: StoreSettings = ${JSON.stringify(cleanSettings || {}, null, 2)};`,
  '',
  `export const FALLBACK_USERS: (User & { passwordHash?: string })[] = ${JSON.stringify(users, null, 2)};`,
  '',
  `export const FALLBACK_ORDERS: Order[] = ${JSON.stringify(sanitizedOrders, null, 2)};`,
  '',
  `export const FALLBACK_RESELLERS: Reseller[] = ${JSON.stringify(resellers, null, 2)};`,
  '',
  'export const FALLBACK_HOMEPAGE_CONTENT: HomePageContent = {',
  '  heroHighlights: FALLBACK_HERO_HIGHLIGHTS,',
  '  solutions: FALLBACK_ENTERPRISE_SOLUTIONS,',
  '  benchmarks: FALLBACK_BENCHMARKS,',
  '  testimonials: FALLBACK_TESTIMONIALS,',
  '  features: FALLBACK_BENTO_FEATURES,',
  '  builderPresets: FALLBACK_BUILDER_PRESETS,',
  '  activeCoupon: FALLBACK_COUPON,',
  '  storeSettings: FALLBACK_STORE_SETTINGS,',
  '  stats: {',
  `    totalProducts: ${sanitizedProducts.length},`,
  '    totalCategories: DEFAULT_CATEGORIES.length,',
  '    totalBrands: DEFAULT_BRANDS.length,',
  '    authorizedPartnersCount: 3,',
  '  },',
  '};',
  '',
];

fs.writeFileSync('frontend/lib/fallback-data.ts', outLines.join('\n'), 'utf8');
console.log('Successfully generated frontend/lib/fallback-data.ts with sanitized orders and users');
