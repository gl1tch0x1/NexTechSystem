import {
  Category,
  Brand,
  Product,
  User,
  Reseller,
  Coupon,
  StoreSettings,
  HeroHighlight,
  EnterpriseSolution,
  HardwareBenchmarkCategory,
  ClientTestimonial,
  BentoFeature,
  BuilderPreset,
  PurchaseOrder,
  Order,
  Quote
} from '../types/index.js';

export const SEED_CATEGORIES: Category[] = [];
export const SEED_BRANDS: Brand[] = [];
export const SEED_USERS: User[] = [];
export const SEED_PRODUCTS: Product[] = [];
export const SEED_RESELLERS: Reseller[] = [];
export const SEED_COUPONS: Coupon[] = [];
export const SEED_ORDERS: Order[] = [];
export const SEED_QUOTES: Quote[] = [];
export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const SEED_HERO_HIGHLIGHTS: HeroHighlight[] = [];
export const SEED_ENTERPRISE_SOLUTIONS: EnterpriseSolution[] = [];
export const SEED_HARDWARE_BENCHMARKS: HardwareBenchmarkCategory[] = [];
export const SEED_TESTIMONIALS: ClientTestimonial[] = [];
export const SEED_BENTO_FEATURES: BentoFeature[] = [];
export const SEED_BUILDER_PRESETS: BuilderPreset[] = [];

export const SEED_STORE_SETTINGS: StoreSettings = {
  storeName: 'NexTech Systems',
  supportEmail: 'support@nextech.com',
  supportPhone: '+971 4 000 0000',
  defaultCurrency: 'AED',
  currencySymbol: 'AED',
  taxRate: 5,
  standardShippingFee: 0,
  freeShippingThreshold: 500,
  address: 'Dubai, United Arab Emirates',
  taxRegistrationNumber: '',
  isAnnouncementActive: false,
};
