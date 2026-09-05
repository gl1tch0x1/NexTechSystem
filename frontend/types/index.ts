export type UserRole = 'ADMIN' | 'CUSTOMER' | 'RESELLER';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  username: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  resellerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type ResellerStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'INACTIVE';

export interface Reseller {
  id: string;
  userId: string;
  resellerCode: string;
  username: string;
  email: string;
  businessName: string;
  displayName: string;
  phone: string;
  logo?: string;
  subdomain: string;
  address: Address;
  businessInformation: {
    taxNumber?: string;
    tradeLicense?: string;
    description?: string;
    website?: string;
  };
  status: ResellerStatus;
  productCount: number;
  salesStats: {
    totalRevenue: number;
    totalOrders: number;
    unitsSold: number;
  };
  commissionRate?: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type SellerType = 'ADMIN' | 'RESELLER';
export type ProductApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';

export interface Product {
  id: string;
  name: string;
  title?: string;
  slug: string;
  sku: string;
  barcode?: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  sellerType: SellerType;
  resellerId?: string;
  resellerCode?: string;
  resellerName?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  compareAtPrice?: number;
  originalPrice?: number;
  discountPercentage?: number;
  costPrice?: number;
  currency: string;
  stock: number;
  reservedStock?: number;
  lowStockThreshold: number;
  images: string[];
  thumbnail: string;
  primaryImage?: string;
  specifications?: Record<string, string>;
  specs?: {
    socket?: string;
    tdp?: number;
    formFactor?: string;
    warrantyYears?: number;
    [key: string]: any;
  };
  features?: string[];
  tags?: string[];
  warranty?: string;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isActive: boolean;
  approvalStatus: ProductApprovalStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  order?: number;
  isActive: boolean;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  tier?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  productCount?: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  slug: string;
  image: string;
  quantity: number;
  price: number;
  salePrice?: number;
  sellerType: SellerType;
  resellerId?: string;
  resellerCode?: string;
  subtotal: number;
  stockAvailable: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number;
  taxRate: number;
  shippingFee: number;
  walletAmountUsed: number;
  total: number;
  currency: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CREDIT_CARD' | 'WALLET' | 'COD' | 'BANK_TRANSFER';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  slug: string;
  thumbnail?: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  sellerType: SellerType;
  resellerId?: string;
  resellerCode?: string;
  specifications?: Record<string, string>;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  walletAmountUsed: number;
  tax: number;
  taxRate: number;
  shippingFee: number;
  total: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  status?: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  statusHistory?: Array<{ status: OrderStatus; note?: string; timestamp: string }>;
  notes?: string;
  eBillId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'ADMIN_ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  link?: string;
  buttonText?: string;
  image: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface EBill {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  sellerInfo: {
    name: string;
    taxNumber: string;
    address: string;
    phone: string;
    email: string;
  };
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
    address: Address;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number;
  shipping: number;
  walletDeduction: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export interface CompatibilityIssue {
  type: 'ERROR' | 'WARNING';
  category: string;
  message: string;
  affectedComponents: string[];
}

export interface PCBuilderCompatibilityResult {
  isCompatible: boolean;
  totalEstimatedWattage: number;
  recommendedPsuWattage: number;
  issues: CompatibilityIssue[];
  totalPrice: number;
}

export interface ProductImportRow {
  rowNumber: number;
  data: Record<string, string>;
  normalizedProduct?: Partial<Product>;
  missingRequiredFields: string[];
  invalidFields: { field: string; message: string }[];
  isDuplicateSku: boolean;
  isValid: boolean;
}

export interface ProductImportPreviewResponse {
  reportId: string;
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  duplicateRowsCount: number;
  detectedHeaders: string[];
  columnMappings: Record<string, string>;
  rows: ProductImportRow[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  resellerId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface HeroHighlight {
  id: string;
  tabLabel: string;
  name: string;
  brand: string;
  category: string;
  badge: string;
  iconName: string;
  specs: { label: string; value: string }[];
  matchQueries: string[];
  defaultImage: string;
  defaultPrice: number;
  tagline: string;
  powerRating: string;
  order: number;
  isActive: boolean;
}

export interface EnterpriseSolution {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  glowColor: string;
  borderColor: string;
  iconName: string;
  benchmarkScore: string;
  description: string;
  specs: string[];
  popularSku: string;
  skuPrice: string;
  link: string;
  order: number;
  isActive: boolean;
}

export interface BenchmarkItem {
  name: string;
  score: number;
  maxScore: number;
  isTop?: boolean;
  badge?: string;
}

export interface HardwareBenchmarkCategory {
  id: string;
  label: string;
  iconName: string;
  title: string;
  metric: string;
  benchmarks: BenchmarkItem[];
  note: string;
  order: number;
  isActive: boolean;
}

export interface ClientTestimonial {
  id: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  rating: number;
  workload: string;
  text: string;
  badge: string;
  avatarColor: string;
  order: number;
  isActive: boolean;
}

export interface BentoFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tag: string;
  iconName: string;
  gridSpan: number;
  stats?: { label: string; value: string }[];
  ctaText?: string;
  ctaLink?: string;
  statusBadge?: string;
  order: number;
  isActive: boolean;
}

export interface BuilderPreset {
  id: string;
  name: string;
  socket: string;
  cpu: string;
  gpu: string;
  ram: string;
  psuWatts: number;
  estTotalWatts: number;
  headroomPercent: number;
  order: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  currencySymbol: string;
  taxRate: number; // e.g. 5 for 5% VAT
  standardShippingFee: number;
  freeShippingThreshold: number;
  address: string;
  taxRegistrationNumber: string;
  announcementText?: string;
  isAnnouncementActive: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export interface HomePageContent {
  heroHighlights: HeroHighlight[];
  solutions: EnterpriseSolution[];
  benchmarks: HardwareBenchmarkCategory[];
  testimonials: ClientTestimonial[];
  features: BentoFeature[];
  builderPresets: BuilderPreset[];
  activeCoupon?: Coupon;
  storeSettings?: StoreSettings;
  stats: {
    totalProducts: number;
    totalCategories: number;
    totalBrands: number;
    authorizedPartnersCount: number;
  };
}


