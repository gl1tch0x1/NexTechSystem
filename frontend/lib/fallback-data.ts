// Clean production fallback data structures (no mock, dummy, or seed items)
import {
  Product,
  Coupon,
  StoreSettings,
  HomePageContent,
  User,
  Order,
  Reseller
} from '@/types';

export const FALLBACK_PRODUCTS: Product[] = [];
export const FALLBACK_USERS: User[] = [];
export const FALLBACK_ORDERS: Order[] = [];
export const FALLBACK_RESELLERS: Reseller[] = [];
export const FALLBACK_COUPONS: Coupon[] = [];

export const FALLBACK_STORE_SETTINGS: StoreSettings = {
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

export const FALLBACK_HOMEPAGE_CONTENT: HomePageContent = {
  heroHighlights: [],
  solutions: [],
  benchmarks: [],
  testimonials: [],
  features: [],
  builderPresets: [],
  stats: {
    totalProducts: 0,
    totalCategories: 0,
    totalBrands: 0,
    authorizedPartnersCount: 0,
  },
};
