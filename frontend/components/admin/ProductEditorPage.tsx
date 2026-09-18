'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import {
  Product,
  ProductVariant,
  Category,
  Brand,
  SellerType,
  Reseller,
} from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_BRANDS } from '@/lib/default-taxonomy';
import {
  SPECIFICATION_FIELDS,
  SPECIFICATION_PRESETS,
  SPECIFICATION_GROUPS,
} from '@/lib/specification-presets';
import {
  Package,
  Layers,
  Tag,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  Truck,
  Cpu,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Percent,
  Store,
  HardDrive,
  Monitor,
  Zap,
  CheckSquare,
  Globe,
  FileText,
  ArrowLeft,
  Save,
  Barcode,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle2,
  Sliders,
  Eye,
  LayoutGrid,
  ListOrdered,
  HelpCircle,
  Copy,
  Star,
  Warehouse,
  Flame,
  Wand2,
  TrendingUp,
  MapPin,
  MoveLeft,
  MoveRight,
} from 'lucide-react';


const WAREHOUSE_LOCATIONS = [
  { id: 'loc_dxb_main', name: 'Dubai Logistics Hub (JAFZA)', city: 'Dubai', code: 'DXB-01' },
  { id: 'loc_deira_tech', name: 'Deira Showroom & Technical Center', city: 'Dubai', code: 'DXB-02' },
  { id: 'loc_auh_hub', name: 'Abu Dhabi Regional Distribution Hub', city: 'Abu Dhabi', code: 'AUH-01' },
  { id: 'loc_shj_depot', name: 'Sharjah Industrial Logistics Depot', city: 'Sharjah', code: 'SHJ-01' },
];

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80';

/**
 * Validates and sanitizes image URLs to prevent DOM-based XSS (CWE-79 / js/xss-through-dom).
 * Strictly complies with CodeQL's MetacharEscapeSanitizer and UriEncodingSanitizer by escaping
 * meta-characters with global regexp replacement and calling encodeURI.
 */
function getSafeImageUrl(url: unknown, fallback: string = DEFAULT_FALLBACK_IMAGE): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Explicitly block dangerous pseudo-protocols
  if (/^(javascript|vbscript|data:(?!image\/))/i.test(trimmed)) {
    return fallback;
  }

  // Strictly validate HTTP, HTTPS, or safe relative paths
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  ) {
    try {
      const parsed = new URL(trimmed, 'https://nextech.local');
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        // Global meta-character escape (satisfies MetacharEscapeSanitizer) and URI encoding (satisfies UriEncodingSanitizer)
        const escaped = trimmed.replace(/[<>'"]/g, '');
        return encodeURI(escaped);
      }
    } catch {
      if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        const escaped = trimmed.replace(/[<>'"]/g, '');
        return encodeURI(escaped);
      }
    }
  }

  return fallback;
}

export interface HardwarePreset {
  label: string;
  category: string;
  catId: string;
  brand: string;
  url: string;
  fullTitle: string;
  skuPrefix: string;
  price: number;
  costPrice: number;
  originalPrice: number;
  weight: number;
  dimensions: { length: number; width: number; height: number; unit: 'cm' };
  hsCode: string;
  warranty: string;
  shortDesc: string;
  specs: Record<string, string>;
  collections: string[];
  tags: string[];
}

const HARDWARE_IMAGE_PRESETS: HardwarePreset[] = [
  {
    label: 'HP ProBook 460 G11',
    category: 'Laptops',
    catId: 'cat_laptops',
    brand: 'HP',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    fullTitle: 'HP ProBook 460 G11 Intel Core Ultra 5 125U 16.0" WUXGA Business Laptop',
    skuPrefix: 'LPT',
    price: 3499,
    costPrice: 2899,
    originalPrice: 3899,
    weight: 1.74,
    dimensions: { length: 35.9, width: 25.1, height: 1.9, unit: 'cm' },
    hsCode: '8471.30.01',
    warranty: '3 Years Official Manufacturer Warranty',
    shortDesc: 'Commercial 16-inch laptop powered by Intel Meteor Lake with AI Boost NPU and 16GB DDR5.',
    specs: {
      Condition: 'Brand New (Factory Sealed)',
      'Product Category': 'Laptops',
      'Processor Brand': 'Intel',
      'Processor Model': 'Core Ultra 5 125U',
      'Processor Cores': 'Dodeca-Core (12 Cores)',
      'RAM Capacity': '16GB',
      'RAM Type': 'DDR5 5600MHz',
      'Storage Capacity': '512GB SSD',
      'Storage Type': 'NVMe PCIe 4.0 SSD',
      'Screen Size': '16.0" WUXGA',
      'Display Technology': 'IPS Antiglare LED',
      'Operating System': 'FreeDOS',
      'Keyboard Language': 'English / Arabic',
      'Backlit Keyboard': 'Yes',
      'Fingerprint Reader': 'Yes',
      Color: 'Pike Silver',
      Warranty: '3 Years Official Manufacturer Warranty',
    },
    collections: ['Laptops', 'Home & Business Laptops'],
    tags: ['Work Laptop', 'UAE', 'ProBook 460 G11'],
  },
  {
    label: 'ASUS ROG Astral RTX 5090',
    category: 'GPUs',
    catId: 'cat_gpus',
    brand: 'ASUS',
    url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
    fullTitle: 'ASUS ROG Astral GeForce RTX 5090 OC Edition 32GB GDDR7 Flagship Gaming GPU',
    skuPrefix: 'GPU',
    price: 8999,
    costPrice: 7499,
    originalPrice: 9999,
    weight: 2.45,
    dimensions: { length: 35.8, width: 14.9, height: 7.1, unit: 'cm' },
    hsCode: '8473.30.10',
    warranty: '3 Years Official Manufacturer Warranty',
    shortDesc: 'Next-gen flagship Blackwell architecture with 32GB GDDR7, axial-tech cooling, and PCIe 5.0.',
    specs: {
      Condition: 'Brand New (Factory Sealed)',
      'Product Category': 'Graphics Cards',
      'Graphics Card': 'NVIDIA GeForce RTX 5090 32GB',
      'Graphics Memory': '32GB GDDR7',
      'Form Factor': 'Quad-Slot (3.8-Slot)',
      'Power Supply Wattage': '600W TDP (1000W PSU Recommended)',
      Warranty: '3 Years Official Manufacturer Warranty',
      'Country of Origin': 'Taiwan',
    },
    collections: ['Graphics Cards', 'Gaming Hardware'],
    tags: ['RTX 5090', 'Blackwell', 'GDDR7', 'ASUS ROG'],
  },
  {
    label: 'Intel Core Ultra 9 285K',
    category: 'CPUs',
    catId: 'cat_processors',
    brand: 'Intel',
    url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    fullTitle: 'Intel Core Ultra 9 285K Arrow Lake 24-Core 5.7GHz LGA1851 Desktop Processor',
    skuPrefix: 'CPU',
    price: 2599,
    costPrice: 2099,
    originalPrice: 2899,
    weight: 0.35,
    dimensions: { length: 12.0, width: 11.5, height: 4.5, unit: 'cm' },
    hsCode: '8542.31.00',
    warranty: '3 Years Official Manufacturer Warranty',
    shortDesc: 'Arrow Lake-S flagship 24-core unlocked desktop processor with dedicated NPU for local AI.',
    specs: {
      Condition: 'Brand New (Factory Sealed)',
      'Product Category': 'Processors (CPUs)',
      'Processor Brand': 'Intel',
      'Processor Model': 'Core Ultra 9 285K',
      'Processor Generation': 'Core Ultra Series 2 (Arrow Lake)',
      'Processor Cores': '24 Cores (8P + 16E)',
      'Socket Type': 'LGA1851',
      'Power Supply Wattage': '125W Base / 250W Boost',
      Warranty: '3 Years Official Manufacturer Warranty',
    },
    collections: ['Processors', 'CPUs'],
    tags: ['Ultra 9', 'Arrow Lake', 'LGA1851', 'Intel'],
  },
  {
    label: 'Samsung 990 PRO NVMe 4TB',
    category: 'Storage',
    catId: 'cat_storage',
    brand: 'Samsung',
    url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    fullTitle: 'Samsung 990 PRO 4TB NVMe M.2 2280 PCIe 4.0 Internal Solid State Drive with Heatsink',
    skuPrefix: 'SSD',
    price: 1499,
    costPrice: 1149,
    originalPrice: 1799,
    weight: 0.15,
    dimensions: { length: 8.0, width: 2.4, height: 0.9, unit: 'cm' },
    hsCode: '8471.70.30',
    warranty: '5 Years Enterprise Gold Warranty',
    shortDesc: 'Top-tier PCIe 4.0 NVMe read speeds up to 7,450 MB/s with smart thermal control heatsink.',
    specs: {
      Condition: 'Brand New (Factory Sealed)',
      'Product Category': 'Storage (NVMe/SSD/HDD)',
      'Storage Capacity': '4TB',
      'Storage Type': 'NVMe PCIe 4.0 SSD',
      'Form Factor': 'M.2 2280',
      Warranty: '5 Years Enterprise Gold Warranty',
    },
    collections: ['Enterprise Storage', 'NVMe SSDs'],
    tags: ['990 PRO', 'PCIe 4.0', '4TB', 'Samsung'],
  },
  {
    label: 'Corsair Dominator Titanium DDR5',
    category: 'RAM',
    catId: 'cat_ram',
    brand: 'Corsair',
    url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80',
    fullTitle: 'Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5 7200MHz CL34 High-Performance Memory',
    skuPrefix: 'RAM',
    price: 1299,
    costPrice: 999,
    originalPrice: 1499,
    weight: 0.28,
    dimensions: { length: 15.0, width: 12.0, height: 2.5, unit: 'cm' },
    hsCode: '8473.30.90',
    warranty: 'Lifetime Limited Warranty',
    shortDesc: 'Ultra-low latency DDR5 dual-channel kit with forged aluminum and customizable lighting top bars.',
    specs: {
      Condition: 'Brand New (Factory Sealed)',
      'Product Category': 'Memory (RAM)',
      'RAM Capacity': '64GB (2x32GB)',
      'RAM Type': 'DDR5 7200MHz CL34',
      Warranty: 'Lifetime Limited Warranty',
    },
    collections: ['Memory', 'DDR5 RAM'],
    tags: ['Dominator Titanium', 'DDR5', '64GB', 'Corsair'],
  },
  {
    label: 'Dell PowerEdge R760 2U Server',
    category: 'Servers',
    catId: 'cat_servers',
    brand: 'Dell Technologies',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    fullTitle: 'Dell PowerEdge R760 2U Rack Server Dual Intel Xeon Gold 6430 128GB DDR5 ECC',
    skuPrefix: 'SRV',
    price: 24999,
    costPrice: 20499,
    originalPrice: 28999,
    weight: 28.5,
    dimensions: { length: 71.0, width: 48.2, height: 8.6, unit: 'cm' },
    hsCode: '8471.50.01',
    warranty: '5 Years Enterprise Gold Warranty',
    shortDesc: '2-socket 2U rack server engineered for intense compute workloads, virtualization, and AI inference.',
    specs: {
      Condition: 'Brand New (Factory Sealed)',
      'Product Category': 'Enterprise Rackmount Servers',
      'Processor Brand': 'Intel',
      'Processor Model': 'Dual Intel Xeon Gold 6430 (64 Cores Total)',
      'Socket Type': 'LGA4677',
      'RAM Capacity': '128GB DDR5 ECC Registered',
      'RAM Type': 'DDR5 4800MHz ECC RDIMM',
      'Storage Capacity': '8x 2.5" Hot-Plug NVMe/SAS Bays',
      'Form Factor': '2U Rackmount',
      'Power Supply Wattage': 'Dual 1400W Titanium Hot-Plug Redundant',
      Warranty: '5 Years Enterprise Gold Warranty',
    },
    collections: ['Servers', 'Enterprise Rackmount Servers'],
    tags: ['PowerEdge', 'R760', 'Xeon Gold', 'Dell'],
  },
];

const POPULAR_TAGS = [
  'Work Laptop',
  'UAE',
  'Silver',
  'ProBook 460 G11',
  'Intel Core Ultra 5',
  'DOS',
  'FHD',
  'Enterprise',
  'DDR5',
  'NVMe SSD',
  'Factory Sealed',
  'Server Grade',
];

const COMMON_COLLECTIONS = [
  'Laptops',
  'HP',
  'Home & Business Laptops',
  'Enterprise Storage',
  'Processors',
  'Graphics Cards',
  'Networking',
  'Servers',
];

const CONDITION_OPTIONS = [
  'Brand New (Factory Sealed)',
  'Enterprise Refurbished (Grade A)',
  'Open Box (Certified Tested)',
];

const WARRANTY_OPTIONS = [
  '1 Year Standard Warranty',
  '2 Years Commercial Warranty',
  '3 Years Official Manufacturer Warranty',
  '5 Years Enterprise Gold Warranty',
  'Lifetime Limited Warranty',
];

export interface TieredPrice {
  minQty: number;
  discountPercent: number;
  unitPrice: number;
}

const FX_RATES: Record<'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'QAR' | 'KWD' | 'INR', { rate: number; symbol: string; label: string }> = {
  AED: { rate: 1.0,     symbol: 'AED', label: 'AED (Base)'  },
  USD: { rate: 0.272,   symbol: '$',   label: 'USD ($)'     },
  EUR: { rate: 0.251,   symbol: '€',   label: 'EUR (€)'     },
  GBP: { rate: 0.214,   symbol: '£',   label: 'GBP (£)'     },
  SAR: { rate: 1.020,   symbol: 'SAR', label: 'SAR (ر.س)'  },
  QAR: { rate: 0.991,   symbol: 'QAR', label: 'QAR (ر.ق)'  },
  KWD: { rate: 0.084,   symbol: 'KWD', label: 'KWD (د.ك)'  },
  INR: { rate: 22.78,   symbol: '₹',   label: 'INR (₹)'    },
};

const formatFxPrice = (amount: number, cur: keyof typeof FX_RATES): string => {
  const rateInfo = FX_RATES[cur] || FX_RATES.AED;
  const converted = Math.round((amount || 0) * rateInfo.rate).toLocaleString();
  const isPrefix = ['$', '€', '£', '₹'].includes(rateInfo.symbol);
  return isPrefix ? `${rateInfo.symbol}${converted}` : `${rateInfo.symbol} ${converted}`;
};

export interface ProductFormData {
  title: string;
  slug: string;
  sku: string;
  barcode: string;
  shortDescription: string;
  description: string;
  condition: string;
  warrantyYears: number;
  warranty: string;
  price: number;
  originalPrice: number;
  costPrice: number;
  discountPercentage: number;
  chargeTax: boolean;
  unitPrice?: number;
  unitMeasure?: string;
  stock: number;
  lowStockThreshold: number;
  inventoryTracked: boolean;
  allowBackorder: boolean;
  warehouseLocation: string;
  locations: {
    locationId: string;
    locationName: string;
    city: string;
    binLocation?: string;
    safetyStock?: number;
    quantity: number;
    available: number;
    committed: number;
    unavailable: number;
    onHand: number;
  }[];
  tieredPricing?: TieredPrice[];
  targetMargin?: number;
  mapPrice?: number;
  weight?: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  hsCode?: string;
  isPhysical: boolean;
  collections: string[];
  tags: string[];
  primaryImage: string;
  images: string[];
  sellerType: SellerType;
  resellerId: string;
  resellerName: string;
  resellerCode: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  socket: string;
  tdp: number;
  formFactor: string;
  specifications: Record<string, string>;
  customSpecs: { key: string; value: string }[];
  hasVariants: boolean;
  variantOptions: { name: string; values: string[] }[];
  variants: ProductVariant[];
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}

type TabKey = 'general' | 'pricing' | 'inventory' | 'specs' | 'variants' | 'logistics';

interface ProductEditorPageProps {
  mode: 'create' | 'edit';
  productId?: string;
}

export function ProductEditorPage({ mode, productId }: ProductEditorPageProps) {
  const router = useRouter();
  const { token } = useAuth();

  const [loading, setLoading] = useState(mode === 'edit');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  
  // Layout View Mode: 'all' shows all sections in a master layout, 'tabs' shows single tab
  const [viewMode, setViewMode] = useState<'all' | 'tabs'>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [activeSpecTab, setActiveSpecTab] = useState<string>(SPECIFICATION_GROUPS[0]?.id || 'core');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Local helper inputs
  const [tagInput, setTagInput] = useState('');
  const [collectionInput, setCollectionInput] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const [previewImageError, setPreviewImageError] = useState(false);

  // Studio 2.0 State Enhancements
  const [previewCurrency, setPreviewCurrency] = useState<keyof typeof FX_RATES>('AED');
  const [targetMarginInput, setTargetMarginInput] = useState<number>(25);
  const [galleryUrlInput, setGalleryUrlInput] = useState<string>('');

  const generateRandomSku = useCallback((catId?: string) => {
    const prefixMap: Record<string, string> = {
      cat_laptops: 'LPT',
      cat_storage: 'SSD',
      cat_processors: 'CPU',
      cat_gpus: 'GPU',
      cat_motherboards: 'MBD',
      cat_ram: 'RAM',
      cat_psus: 'PSU',
      cat_servers: 'SRV',
      cat_networking: 'NET',
      cat_monitors: 'MON',
    };
    const code = prefixMap[catId || ''] || 'SKU';
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `NX-${code}-${rand}`;
  }, []);

  const generateRandomBarcode = () => {
    return `729${Math.floor(100000000 + Math.random() * 900000000)}`;
  };

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    slug: '',
    sku: 'NX-LPT-999274',
    barcode: '729160341853',
    shortDescription: '',
    description: '',
    condition: 'Brand New (Factory Sealed)',
    warrantyYears: 3,
    warranty: '3 Years Official Manufacturer Warranty',
    price: 3499,
    originalPrice: 3899,
    costPrice: 2899,
    discountPercentage: 10,
    chargeTax: true,
    unitPrice: 3499,
    unitMeasure: 'unit',
    stock: 25,
    lowStockThreshold: 5,
    inventoryTracked: true,
    allowBackorder: false,
    warehouseLocation: 'loc_dxb_main',
    locations: WAREHOUSE_LOCATIONS.map(w => ({
      locationId: w.id,
      locationName: w.name,
      city: w.city,
      binLocation: w.id === 'loc_dxb_main' ? 'DXB-A-04-18' : w.id === 'loc_deira_tech' ? 'DEI-SH-02-05' : w.id === 'loc_auh_hub' ? 'AUH-WH-01-12' : 'SHJ-RK-03-09',
      safetyStock: 5,
      quantity: w.id === 'loc_dxb_main' ? 25 : 0,
      available: w.id === 'loc_dxb_main' ? 25 : 0,
      committed: 0,
      unavailable: 0,
      onHand: w.id === 'loc_dxb_main' ? 25 : 0,
    })),
    tieredPricing: [
      { minQty: 1, discountPercent: 0, unitPrice: 3499 },
      { minQty: 5, discountPercent: 5, unitPrice: 3324 },
      { minQty: 20, discountPercent: 10, unitPrice: 3149 },
      { minQty: 50, discountPercent: 15, unitPrice: 2974 },
    ],
    targetMargin: 25,
    mapPrice: 3199,
    weight: 1.74,
    dimensions: {
      length: 35.9,
      width: 25.1,
      height: 1.9,
      unit: 'cm',
    },
    hsCode: '8471.30.01',
    isPhysical: true,
    collections: ['Laptops', 'Home & Business Laptops'],
    tags: ['Work Laptop', 'UAE', 'ProBook 460 G11'],
    primaryImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    ],
    sellerType: 'ADMIN',
    resellerId: '',
    resellerName: '',
    resellerCode: '',
    categoryId: 'cat_laptops',
    categoryName: 'Laptops',
    brandId: 'brand_hp',
    brandName: 'HP',
    socket: 'BGA-FC1851',
    tdp: 28,
    formFactor: 'Clamshell',
    specifications: {
      Condition: 'Brand New (Factory Sealed)',
      'Product Category': 'Laptops',
      'Processor Brand': 'Intel',
      'Processor Model': 'Core Ultra 5 125U',
      'Processor Cores': 'Dodeca-Core (12 Cores)',
      'RAM Capacity': '16GB',
      'RAM Type': 'DDR5 5600MHz',
      'Storage Capacity': '512GB SSD',
      'Storage Type': 'NVMe PCIe 4.0 SSD',
      'Screen Size': '16.0" WUXGA',
      'Display Technology': 'IPS Antiglare LED',
      'Operating System': 'FreeDOS',
      'Keyboard Language': 'English / Arabic',
      'Backlit Keyboard': 'Yes',
      'Fingerprint Reader': 'Yes',
      Color: 'Pike Silver',
      Warranty: '3 Years Official Manufacturer Warranty',
    },
    customSpecs: [],
    hasVariants: false,
    variantOptions: [
      { name: 'RAM', values: ['16GB', '32GB'] },
      { name: 'Storage', values: ['512GB SSD', '1TB SSD'] },
    ],
    variants: [],
    status: 'ACTIVE',
  });

  // Load taxonomies & product
  useEffect(() => {
    const fetchTaxonomies = async () => {
      try {
        const fetchOpts = token ? { token } : {};
        const [catRes, brandRes, resellerRes] = await Promise.all([
          ApiClient.get<Category[]>('/admin/categories', fetchOpts)
            .catch(() => ApiClient.get<Category[]>('/products/categories').catch(() => DEFAULT_CATEGORIES)),
          ApiClient.get<Brand[]>('/admin/brands', fetchOpts)
            .catch(() => ApiClient.get<Brand[]>('/products/brands').catch(() => DEFAULT_BRANDS)),
          token
            ? ApiClient.get<Reseller[]>('/admin/resellers', { token }).catch(() => [])
            : Promise.resolve([]),
        ]);

        if (catRes && Array.isArray(catRes) && catRes.length > 0) setCategories(catRes);
        if (brandRes && Array.isArray(brandRes) && brandRes.length > 0) setBrands(brandRes);
        if (resellerRes && Array.isArray(resellerRes)) setResellers(resellerRes);
      } catch (err) {
        console.warn('Failed to load taxonomies:', err);
      }
    };

    fetchTaxonomies();
  }, [token]);

  useEffect(() => {
    if (mode === 'edit' && productId) {
      const loadProduct = async () => {
        setLoading(true);
        try {
          const fetchOpts = token ? { token } : {};
          const product = await ApiClient.get<Product>(`/admin/products/${productId}`, fetchOpts)
            .catch(() => ApiClient.get<Product>(`/products/${productId}`).catch(() => null));

          if (product) {
            const loadedSpecs: Record<string, string> = { ...(product.specifications || {}) };
            const standardKeys = new Set<string>(SPECIFICATION_FIELDS as readonly string[]);
            const customSpecsList: { key: string; value: string }[] = [];

            Object.entries(loadedSpecs).forEach(([k, v]) => {
              if (!standardKeys.has(k)) {
                customSpecsList.push({ key: k, value: String(v) });
              }
            });

            const origP = product.originalPrice || product.compareAtPrice || product.price;
            const computedDiscount = origP > product.price ? Math.round(((origP - product.price) / origP) * 100) : 0;
            const cond = loadedSpecs['Condition'] || product.specs?.condition || 'Brand New (Factory Sealed)';
            const war = product.warranty || loadedSpecs['Warranty'] || '3 Years Official Manufacturer Warranty';

            const prodLocations = product.locations && product.locations.length > 0
              ? product.locations.map(w => ({
                  locationId: w.locationId,
                  locationName: w.locationName,
                  city: w.city || 'Dubai, UAE',
                  quantity: w.quantity || 0,
                  available: w.available ?? w.quantity ?? 0,
                  committed: w.committed ?? 0,
                  unavailable: w.unavailable ?? 0,
                  onHand: w.onHand ?? w.quantity ?? 0,
                }))
              : WAREHOUSE_LOCATIONS.map(w => ({
                  locationId: w.id,
                  locationName: w.name,
                  city: w.city,
                  quantity: w.id === 'loc_dxb_main' ? product.stock : 0,
                  available: w.id === 'loc_dxb_main' ? product.stock : 0,
                  committed: 0,
                  unavailable: 0,
                  onHand: w.id === 'loc_dxb_main' ? product.stock : 0,
                }));

            const prodImages = product.images && product.images.length > 0
              ? product.images
              : [product.primaryImage || product.thumbnail || DEFAULT_FALLBACK_IMAGE];

            setFormData({
              title: product.title || product.name || '',
              slug: product.slug || '',
              sku: product.sku || generateRandomSku(product.categoryId),
              barcode: product.barcode || generateRandomBarcode(),
              shortDescription: product.shortDescription || '',
              description: product.description || '',
              condition: cond,
              warrantyYears: product.specs?.warrantyYears || 3,
              warranty: war,
              price: product.price,
              originalPrice: origP,
              costPrice: product.costPrice || Math.round(product.price * 0.8),
              discountPercentage: product.discountPercentage || computedDiscount,
              chargeTax: product.chargeTax !== false,
              unitPrice: product.unitPrice || product.price,
              unitMeasure: product.unitMeasure || 'unit',
              stock: product.stock,
              lowStockThreshold: product.lowStockThreshold || 5,
              inventoryTracked: product.inventoryTracked !== false,
              allowBackorder: Boolean(product.allowBackorder),
              warehouseLocation: product.locations?.[0]?.locationId || 'loc_dxb_main',
              locations: prodLocations,
              weight: product.weight || 1.5,
              dimensions: product.dimensions || { length: 30, width: 20, height: 5, unit: 'cm' },
              hsCode: product.hsCode || '8471.30.01',
              isPhysical: product.isPhysical !== false,
              collections: product.collections || (product.categoryName ? [product.categoryName] : ['Laptops']),
              tags: product.tags || ['Hardware'],
              primaryImage: product.primaryImage || product.thumbnail || prodImages[0],
              images: prodImages,
              sellerType: product.sellerType || 'ADMIN',
              resellerId: product.resellerId || '',
              resellerName: product.resellerName || '',
              resellerCode: product.resellerCode || '',
              categoryId: product.categoryId || categories[0]?.id || '',
              categoryName: product.categoryName || categories[0]?.name || '',
              brandId: product.brandId || brands[0]?.id || '',
              brandName: product.brandName || brands[0]?.name || '',
              socket: product.specs?.socket || loadedSpecs['Socket Type'] || 'LGA1700',
              tdp: product.specs?.tdp || 125,
              formFactor: product.specs?.formFactor || loadedSpecs['Form Factor'] || 'ATX',
              specifications: loadedSpecs,
              customSpecs: customSpecsList,
              hasVariants: Boolean(product.hasVariants),
              variantOptions: product.variantOptions || [
                { name: 'RAM', values: ['16GB', '32GB'] },
                { name: 'Storage', values: ['512GB SSD', '1TB SSD'] },
              ],
              variants: product.variants || [],
              status: ((product as any).status as any) || (product.isActive ? 'ACTIVE' : 'DRAFT'),
            });
          }
        } catch (err: any) {
          setFormError(err.message || 'Failed to load product details.');
        } finally {
          setLoading(false);
        }
      };

      loadProduct();
    }
  }, [mode, productId, token, categories, brands, generateRandomSku]);

  // Margin & Markup calculations
  const profitMetrics = useMemo(() => {
    const cost = Number(formData.costPrice) || 0;
    const price = Number(formData.price) || 0;
    if (price <= 0) return { profit: 0, margin: 0, markup: 0 };
    const profit = price - cost;
    const margin = Math.round((profit / price) * 100);
    const markup = cost > 0 ? Math.round((profit / cost) * 100) : 100;
    return { profit, margin, markup };
  }, [formData.costPrice, formData.price]);

  // Volumetric weight calculations (cm / 5000)
  const volumetricMetrics = useMemo(() => {
    const { length, width, height, unit } = formData.dimensions;
    if (!length || !width || !height) return { volWeight: 0, billableWeight: formData.weight || 0 };
    const divisor = unit === 'in' ? 166 : 5000;
    const vol = (length * width * height) / divisor;
    const roundedVol = Math.round(vol * 100) / 100;
    const actual = formData.weight || 0;
    const billable = Math.max(roundedVol, actual);
    return { volWeight: roundedVol, billableWeight: billable };
  }, [formData.dimensions, formData.weight]);

  const configuredSpecsCount = useMemo(() => {
    return Object.keys(formData.specifications).filter(k => Boolean(formData.specifications[k])).length + formData.customSpecs.length;
  }, [formData.specifications, formData.customSpecs]);

  // Completeness score
  const completeness = useMemo(() => {
    const checks = [
      { id: 'title', label: 'Product Model Name', passed: formData.title.trim().length >= 4 },
      { id: 'sku', label: 'Unique Base SKU', passed: Boolean(formData.sku.trim()) },
      { id: 'price', label: 'Commercial Price & Cost', passed: formData.price > 0 && formData.costPrice > 0 },
      { id: 'stock', label: 'Regional Stock Allocation', passed: formData.stock > 0 || !formData.inventoryTracked },
      { id: 'image', label: 'High-Res Product Asset', passed: Boolean(formData.primaryImage) },
      { id: 'specs', label: 'Hardware Specifications', passed: configuredSpecsCount >= 4 },
      { id: 'shipping', label: 'Dimensions & HS Code', passed: Boolean(formData.hsCode) && formData.dimensions.length > 0 },
    ];
    const passedCount = checks.filter(c => c.passed).length;
    const percentage = Math.round((passedCount / checks.length) * 100);
    return { checks, passedCount, total: checks.length, percentage };
  }, [formData, configuredSpecsCount]);

  // Tag & Collection Helpers
  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (!clean) return;
    if (!formData.tags.includes(clean)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleAddCollection = (colToAdd: string) => {
    const clean = colToAdd.trim();
    if (!clean) return;
    if (!formData.collections.includes(clean)) {
      setFormData(prev => ({ ...prev, collections: [...prev.collections, clean] }));
    }
    setCollectionInput('');
  };

  const handleRemoveCollection = (colToRemove: string) => {
    setFormData(prev => ({ ...prev, collections: prev.collections.filter(c => c !== colToRemove) }));
  };

  // Spec Field Updates
  const handleSpecChange = (key: string, value: string) => {
    setFormData(prev => {
      const updatedSpecs = { ...prev.specifications, [key]: value };
      const updates: Partial<ProductFormData> = { specifications: updatedSpecs };

      if (key === 'Socket Type') updates.socket = value;
      if (key === 'Form Factor' || key === 'Computer Form Factor') updates.formFactor = value;
      if (key === 'Power Supply Wattage') {
        const match = value.match(/\d+/);
        if (match) updates.tdp = parseInt(match[0], 10);
      }
      if (key === 'Warranty') {
        const match = value.match(/(\d+)\s*Year/i);
        if (match) updates.warrantyYears = parseInt(match[1], 10);
        updates.warranty = value;
      }
      if (key === 'Condition') updates.condition = value;

      return { ...prev, ...updates };
    });
  };

  const handleAddCustomSpec = () => {
    setFormData(prev => ({
      ...prev,
      customSpecs: [...prev.customSpecs, { key: '', value: '' }],
    }));
  };

  const handleCustomSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    setFormData(prev => {
      const list = [...prev.customSpecs];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, customSpecs: list };
    });
  };

  const handleRemoveCustomSpec = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customSpecs: prev.customSpecs.filter((_, i) => i !== index),
    }));
  };

  // Variant Option Definition Helpers
  const handleAddOptionName = () => {
    if (!newOptionName.trim()) return;
    const name = newOptionName.trim();
    if (formData.variantOptions.some(o => o.name.toLowerCase() === name.toLowerCase())) {
      alert('An option with this name already exists.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      variantOptions: [...prev.variantOptions, { name, values: [] }],
    }));
    setNewOptionName('');
  };

  const handleAddOptionValue = (optionIndex: number, val: string) => {
    const clean = val.trim();
    if (!clean) return;
    setFormData(prev => {
      const options = [...prev.variantOptions];
      if (!options[optionIndex].values.includes(clean)) {
        options[optionIndex] = {
          ...options[optionIndex],
          values: [...options[optionIndex].values, clean],
        };
      }
      return { ...prev, variantOptions: options };
    });
  };

  const handleRemoveOptionValue = (optionIndex: number, valToRemove: string) => {
    setFormData(prev => {
      const options = [...prev.variantOptions];
      options[optionIndex] = {
        ...options[optionIndex],
        values: options[optionIndex].values.filter(v => v !== valToRemove),
      };
      return { ...prev, variantOptions: options };
    });
  };

  const handleRemoveOptionGroup = (optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variantOptions: prev.variantOptions.filter((_, i) => i !== optionIndex),
    }));
  };

  // Cartesian Combination Generator
  const handleGenerateVariants = () => {
    const validOptions = formData.variantOptions.filter(o => o.values.length > 0);
    if (validOptions.length === 0) {
      alert('Please define at least one variant option with values (e.g. RAM, Storage).');
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap(c => curr.map(n => [...c, n])),
        [[]]
      );
    };

    const valueArrays = validOptions.map(o => o.values);
    const combinations = cartesian(valueArrays);

    const generated: ProductVariant[] = combinations.map((combo, idx) => {
      const titleSuffix = combo.join(' / ');
      const optionMap: Record<string, string> = {};
      validOptions.forEach((opt, oIdx) => {
        optionMap[opt.name] = combo[oIdx];
      });

      const cleanBaseSku = formData.sku.trim() || 'SKU';
      const cleanComboSlug = combo
        .map(c => c.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
        .join('-');
      const variantSku = `${cleanBaseSku}-${cleanComboSlug}`;
      const barcodeRand = `729${Math.floor(100000000 + Math.random() * 900000000)}`;

      return {
        id: `var_${Date.now()}_${idx}`,
        title: `${formData.title.trim() || 'Hardware SKU'} - ${titleSuffix}`,
        sku: variantSku,
        barcode: barcodeRand,
        price: Number(formData.price) || 0,
        compareAtPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        stock: Math.max(0, Math.floor((formData.stock || 20) / combinations.length)),
        options: optionMap,
        weight: formData.weight,
        chargeTax: formData.chargeTax,
      };
    });

    setFormData(prev => ({
      ...prev,
      hasVariants: true,
      variants: generated,
    }));
  };

  const handleUpdateVariant = (index: number, fields: Partial<ProductVariant>) => {
    setFormData(prev => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], ...fields };
      const totalStock = updated.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      return { ...prev, variants: updated, stock: totalStock };
    });
  };

  const handleDeleteVariant = (index: number) => {
    setFormData(prev => {
      const updated = prev.variants.filter((_, i) => i !== index);
      const totalStock = updated.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      return {
        ...prev,
        variants: updated,
        stock: totalStock,
        hasVariants: updated.length > 0,
      };
    });
  };

  // Warehouse Multi-Location Stock & Bin Tracking
  const handleLocationStockChange = (
    locIndex: number,
    field: 'available' | 'committed' | 'unavailable',
    val: number
  ) => {
    setFormData(prev => {
      const list = [...prev.locations];
      const target = { ...list[locIndex], [field]: Math.max(0, val) };
      target.onHand = target.available + target.committed + target.unavailable;
      target.quantity = target.available;
      list[locIndex] = target;

      const totalAvailable = list.reduce((acc, l) => acc + l.available, 0);

      return {
        ...prev,
        locations: list,
        stock: totalAvailable,
      };
    });
  };

  const handleLocationBinChange = (locIndex: number, binLocation: string) => {
    setFormData(prev => {
      const list = [...prev.locations];
      list[locIndex] = { ...list[locIndex], binLocation };
      return { ...prev, locations: list };
    });
  };

  const handleLocationSafetyStockChange = (locIndex: number, safetyStock: number) => {
    setFormData(prev => {
      const list = [...prev.locations];
      list[locIndex] = { ...list[locIndex], safetyStock: Math.max(0, safetyStock) };
      return { ...prev, locations: list };
    });
  };

  const handleSmartStockDistribution = (strategy: 'consolidate_jafza' | 'even' | 'ratio_70_10' | 'clear') => {
    setFormData(prev => {
      const baseTotal = prev.stock > 0 ? prev.stock : 40;
      let list = [...prev.locations];

      if (strategy === 'consolidate_jafza') {
        list = list.map(l => ({
          ...l,
          available: l.locationId === 'loc_dxb_main' ? baseTotal : 0,
          committed: 0,
          unavailable: 0,
          onHand: l.locationId === 'loc_dxb_main' ? baseTotal : 0,
          quantity: l.locationId === 'loc_dxb_main' ? baseTotal : 0,
        }));
      } else if (strategy === 'even') {
        const perHub = Math.floor(baseTotal / list.length);
        const remainder = baseTotal % list.length;
        list = list.map((l, idx) => {
          const qty = idx === 0 ? perHub + remainder : perHub;
          return {
            ...l,
            available: qty,
            committed: 0,
            unavailable: 0,
            onHand: qty,
            quantity: qty,
          };
        });
      } else if (strategy === 'ratio_70_10') {
        const jafzaQty = Math.round(baseTotal * 0.7);
        const remaining = baseTotal - jafzaQty;
        const otherHubsCount = Math.max(1, list.length - 1);
        const perOther = Math.floor(remaining / otherHubsCount);
        list = list.map((l, idx) => {
          const qty = idx === 0 ? jafzaQty : perOther;
          return {
            ...l,
            available: qty,
            committed: 0,
            unavailable: 0,
            onHand: qty,
            quantity: qty,
          };
        });
      } else if (strategy === 'clear') {
        list = list.map(l => ({
          ...l,
          available: 0,
          committed: 0,
          unavailable: 0,
          onHand: 0,
          quantity: 0,
        }));
      }

      const totalAvailable = list.reduce((acc, l) => acc + l.available, 0);
      return {
        ...prev,
        locations: list,
        stock: totalAvailable,
      };
    });
  };

  // Quick Hardware Photo Preset Loader
  const handleApplyPreset = (preset: typeof HARDWARE_IMAGE_PRESETS[0]) => {
    setPreviewImageError(false);
    setFormData(prev => {
      const newImages = prev.images.includes(preset.url) ? prev.images : [preset.url, ...prev.images];
      const foundCat = categories.find(c => c.id === preset.catId);
      const foundBrand = brands.find(b => b.name.toLowerCase() === preset.brand.toLowerCase());

      return {
        ...prev,
        primaryImage: preset.url,
        images: newImages,
        categoryId: foundCat?.id || prev.categoryId,
        categoryName: foundCat?.name || prev.categoryName,
        brandId: foundBrand?.id || prev.brandId,
        brandName: foundBrand?.name || preset.brand,
      };
    });
  };

  // Full Enterprise Architecture Blueprint Ingestion
  const handleApplyFullPreset = (preset: HardwarePreset) => {
    setPreviewImageError(false);
    const foundCat = categories.find(c => c.id === preset.catId);
    const foundBrand = brands.find(b => b.name.toLowerCase() === preset.brand.toLowerCase());

    setFormData(prev => {
      const newSku = generateRandomSku(preset.catId);
      const newBarcode = generateRandomBarcode();
      const discount = preset.originalPrice > preset.price
        ? Math.round(((preset.originalPrice - preset.price) / preset.originalPrice) * 100)
        : 0;

      return {
        ...prev,
        title: preset.fullTitle,
        slug: preset.fullTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sku: newSku,
        barcode: newBarcode,
        shortDescription: preset.shortDesc,
        description: `${preset.shortDesc} Engineered with enterprise thermal stability, high-bandwidth interconnects, and strict OEM quality compliance.`,
        price: preset.price,
        costPrice: preset.costPrice,
        originalPrice: preset.originalPrice,
        discountPercentage: discount,
        weight: preset.weight,
        dimensions: preset.dimensions,
        hsCode: preset.hsCode,
        warranty: preset.warranty,
        primaryImage: preset.url,
        images: [preset.url],
        categoryId: foundCat?.id || preset.catId,
        categoryName: foundCat?.name || preset.category,
        brandId: foundBrand?.id || (foundBrand ? foundBrand.id : prev.brandId),
        brandName: foundBrand?.name || preset.brand,
        collections: preset.collections,
        tags: preset.tags,
        specifications: { ...preset.specs },
        tieredPricing: [
          { minQty: 1, discountPercent: 0, unitPrice: preset.price },
          { minQty: 5, discountPercent: 5, unitPrice: Math.round(preset.price * 0.95) },
          { minQty: 20, discountPercent: 10, unitPrice: Math.round(preset.price * 0.9) },
          { minQty: 50, discountPercent: 15, unitPrice: Math.round(preset.price * 0.85) },
        ],
      };
    });
    setSuccessNotice(`Ingested full architecture blueprint for "${preset.label}". All specs, logistics & pricing populated.`);
  };

  // Standardized Title Auto-Constructor
  const handleGenerateStandardTitle = () => {
    const brand = formData.brandName || '';
    const cat = formData.categoryName || '';
    const modelSpec =
      formData.specifications['Processor Model'] ||
      formData.specifications['GPU Chipset'] ||
      formData.specifications['Storage Capacity'] ||
      formData.specifications['RAM Capacity'] ||
      '';
    const series = formData.tags[0] || '';
    const built = [brand, series, modelSpec, cat].filter(Boolean).join(' ');
    if (built) {
      setFormData(prev => ({
        ...prev,
        title: built,
        slug: built.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  // Multi-Asset Gallery Handlers (Strictly Sanitized via getSafeImageUrl)
  const handleAddGalleryImage = (urlToAdd: string) => {
    const sanitized = urlToAdd.trim().replace(/[<>'"]/g, '');
    if (!sanitized) return;
    const safe = getSafeImageUrl(sanitized);
    setFormData(prev => {
      const existing = prev.images.filter(img => img !== safe);
      const newImages = [...existing, safe];
      return {
        ...prev,
        primaryImage: prev.primaryImage || safe,
        images: newImages,
      };
    });
    setGalleryUrlInput('');
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setFormData(prev => {
      const targetUrl = prev.images[indexToRemove];
      const newImages = prev.images.filter((_, i) => i !== indexToRemove);
      let newPrimary = prev.primaryImage;
      if (newPrimary === targetUrl) {
        newPrimary = newImages[0] || DEFAULT_FALLBACK_IMAGE;
      }
      return {
        ...prev,
        images: newImages,
        primaryImage: newPrimary,
      };
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    setFormData(prev => {
      const selectedUrl = prev.images[index];
      if (!selectedUrl) return prev;
      return {
        ...prev,
        primaryImage: selectedUrl,
      };
    });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    setFormData(prev => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const newImages = [...prev.images];
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  // Target Margin & B2B Tiered Volume Pricing Handlers
  const handleApplyTargetMargin = (marginPct: number) => {
    const cost = Number(formData.costPrice) || 0;
    if (cost <= 0 || marginPct >= 100) return;
    const calculatedPrice = Math.round(cost / (1 - marginPct / 100));
    setFormData(prev => ({
      ...prev,
      price: calculatedPrice,
      originalPrice: Math.max(prev.originalPrice, Math.round(calculatedPrice * 1.15)),
      unitPrice: calculatedPrice,
      tieredPricing: [
        { minQty: 1, discountPercent: 0, unitPrice: calculatedPrice },
        { minQty: 5, discountPercent: 5, unitPrice: Math.round(calculatedPrice * 0.95) },
        { minQty: 20, discountPercent: 10, unitPrice: Math.round(calculatedPrice * 0.9) },
        { minQty: 50, discountPercent: 15, unitPrice: Math.round(calculatedPrice * 0.85) },
      ],
    }));
  };

  const handleUpdateTierPrice = (tierIndex: number, discountPercent: number) => {
    setFormData(prev => {
      const baseP = Number(prev.price) || 0;
      const currentTiers = prev.tieredPricing || [];
      const updated = [...currentTiers];
      const unitP = Math.round(baseP * (1 - discountPercent / 100));
      updated[tierIndex] = { ...updated[tierIndex], discountPercent, unitPrice: unitP };
      return { ...prev, tieredPricing: updated };
    });
  };

  // Variant Engine Batch Controls
  const handleBatchVariantPrice = () => {
    const basePrice = Number(formData.price) || 0;
    const baseCost = Number(formData.costPrice) || 0;
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => ({
        ...v,
        price: basePrice,
        costPrice: baseCost,
      })),
    }));
  };

  const handleBatchVariantStock = (uniformStock: number) => {
    setFormData(prev => {
      const updated = prev.variants.map(v => ({
        ...v,
        stock: uniformStock,
      }));
      const totalStock = updated.reduce((sum, v) => sum + v.stock, 0);
      return {
        ...prev,
        variants: updated,
        stock: totalStock,
      };
    });
  };

  const handleBatchVariantMarkup = (markupPercent: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => ({
        ...v,
        price: Math.round(v.price * (1 + markupPercent / 100)),
      })),
    }));
  };

  // SVG Barcode Renderer
  const renderBarcodeSvg = (code: string) => {
    if (!code) return null;
    const clean = code.replace(/[^0-9A-Z]/gi, '') || '000000000000';
    const bars = clean.split('').map((char, idx) => {
      const digit = parseInt(char, 10) || (char.charCodeAt(0) % 10);
      const width = (digit % 3) + 1.6;
      return (
        <rect
          key={idx}
          x={idx * 11 + 6}
          y="0"
          width={width}
          height="38"
          fill="currentColor"
        />
      );
    });

    return (
      <div className="flex flex-col items-center justify-center p-3 bg-slate-50/70 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800 max-w-sm mx-auto shadow-sm">
        <svg viewBox={`0 0 ${clean.length * 11 + 16} 38`} className="h-7 text-slate-900 dark:text-slate-100">
          {bars}
        </svg>
        <span className="font-mono text-[11px] font-black tracking-widest text-slate-700 dark:text-slate-300 mt-1">
          {code}
        </span>
      </div>
    );
  };

  // Save / Publish
  const handleSaveProduct = async (statusOverride?: 'ACTIVE' | 'DRAFT') => {
    setFormError('');
    setSuccessNotice('');

    if (!formData.title.trim()) {
      setFormError('Product title is required.');
      return;
    }
    if (!formData.sku.trim()) {
      setFormError('Base SKU is required.');
      return;
    }
    if (Number(formData.price) <= 0) {
      setFormError('Please provide a valid commercial selling price greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalSpecs: Record<string, string> = { ...formData.specifications };
      formData.customSpecs.forEach(cs => {
        if (cs.key.trim() && cs.value.trim()) {
          finalSpecs[cs.key.trim()] = cs.value.trim();
        }
      });

      const selectedCategory = categories.find(c => c.id === formData.categoryId);
      const selectedBrand = brands.find(b => b.id === formData.brandId);
      const finalStatus = statusOverride || formData.status;

      const matchedPartner = resellers.find(r => r.id === formData.resellerId);
      const isPartner = formData.sellerType === 'RESELLER';
      const selectedHub = WAREHOUSE_LOCATIONS[0];
      const stockVal = Number(formData.stock) || 0;

      const payload: Partial<Product> = {
        title: formData.title.trim(),
        name: formData.title.trim(),
        slug: formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || undefined,
        shortDescription: formData.shortDescription.trim() || undefined,
        description: formData.description.trim(),
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        compareAtPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : 0,
        chargeTax: formData.chargeTax !== false,
        unitPrice: formData.unitPrice ? Number(formData.unitPrice) : undefined,
        unitMeasure: formData.unitMeasure || undefined,
        stock: stockVal,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        inventoryTracked: formData.inventoryTracked !== false,
        allowBackorder: Boolean(formData.allowBackorder),
        weight: formData.weight ? Number(formData.weight) : undefined,
        dimensions: formData.dimensions,
        hsCode: formData.hsCode?.trim() || undefined,
        isPhysical: formData.isPhysical !== false,
        collections: formData.collections,
        tags: formData.tags,
        primaryImage: formData.primaryImage || formData.images[0] || DEFAULT_FALLBACK_IMAGE,
        thumbnail: formData.primaryImage || formData.images[0] || DEFAULT_FALLBACK_IMAGE,
        images: formData.images.length > 0 ? formData.images : [formData.primaryImage || DEFAULT_FALLBACK_IMAGE],
        categoryId: formData.categoryId,
        categoryName: selectedCategory?.name || formData.categoryName || 'Hardware',
        brandId: formData.brandId,
        brandName: selectedBrand?.name || formData.brandName || 'NexTech',
        sellerType: formData.sellerType,
        resellerId: isPartner ? (formData.resellerId || undefined) : undefined,
        resellerName: isPartner ? (matchedPartner?.displayName || matchedPartner?.businessName || formData.resellerName || undefined) : undefined,
        resellerCode: isPartner ? (matchedPartner?.resellerCode || formData.resellerCode || undefined) : undefined,
        locations: formData.locations && formData.locations.length > 0 ? formData.locations : [
          {
            locationId: selectedHub.id,
            locationName: selectedHub.name,
            city: selectedHub.city,
            quantity: stockVal,
            available: stockVal,
            committed: 0,
            unavailable: 0,
            onHand: stockVal,
          },
        ],
        specifications: finalSpecs,
        specs: {
          socket: formData.socket || finalSpecs['Socket Type'] || undefined,
          tdp: formData.tdp ? Number(formData.tdp) : undefined,
          formFactor: formData.formFactor || finalSpecs['Form Factor'] || undefined,
          warrantyYears: Number(formData.warrantyYears || 3),
          condition: formData.condition,
          ...finalSpecs,
        },
        warranty: formData.warranty || finalSpecs['Warranty'] || `${formData.warrantyYears} Years Official Warranty`,
        hasVariants: Boolean(formData.hasVariants),
        variantOptions: formData.hasVariants ? formData.variantOptions : [],
        variants: formData.hasVariants ? formData.variants.map((v, i) => ({
          ...v,
          id: v.id || `var_${Date.now()}_${i}`,
          sku: v.sku.trim(),
          barcode: v.barcode?.trim() || undefined,
          title: v.title.trim(),
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
          costPrice: v.costPrice ? Number(v.costPrice) : undefined,
          stock: Number(v.stock) || 0,
          weight: v.weight ? Number(v.weight) : undefined,
          chargeTax: v.chargeTax !== false,
        })) : [],
        status: finalStatus,
        isActive: finalStatus === 'ACTIVE',
      };

      const authOpts = token ? { token } : {};
      if (mode === 'edit' && productId) {
        await ApiClient.put(`/admin/products/${productId}`, payload, authOpts);
        setSuccessNotice('Hardware SKU successfully updated and synchronized across regional catalogs.');
      } else {
        await ApiClient.post('/admin/products', payload, authOpts);
        setSuccessNotice('New Hardware SKU successfully created and activated in catalog.');
      }

      setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save hardware product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut: Ctrl+S / ⌘S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveProduct();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const TABS = [
    { id: 'general' as TabKey, label: 'Overview & Media', icon: Package },
    { id: 'pricing' as TabKey, label: 'Pricing & Financials', icon: DollarSign },
    { id: 'inventory' as TabKey, label: 'Warehousing & Stock', icon: Warehouse },
    { id: 'specs' as TabKey, label: 'Technical Specs', icon: Cpu },
    { id: 'variants' as TabKey, label: 'Multi-SKU Variants', icon: Sparkles },
    { id: 'logistics' as TabKey, label: 'Logistics & Compliance', icon: Truck },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
          Loading Hardware SKU Specifications...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 max-w-7xl xl:max-w-[1600px] mx-auto">
      {/* 1. TOP STICKY ENTERPRISE COMMAND BAR */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Breadcrumbs & Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/admin/products"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors shrink-0 cursor-pointer"
              title="Return to Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0 max-w-md xl:max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Link href="/admin/products" className="hover:underline">Hardware Catalog</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  {mode === 'edit' ? 'SKU Configuration Studio' : 'New Hardware SKU'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate mt-0.5" title={formData.title}>
                {formData.title || (mode === 'edit' ? 'Edit Hardware SKU' : 'Add New Hardware SKU')}
              </h1>
            </div>
          </div>

          {/* Controls: View Mode, Status & Actions */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end shrink-0">
            {/* View Mode Toggle: All Sections vs Tabs */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`h-7 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'all'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View complete document layout"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">All Sections</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tabs')}
                className={`h-7 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  viewMode === 'tabs'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Focused step-by-step tabs"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Tabbed</span>
              </button>
            </div>

            {/* Status Selector */}
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className={`h-9 text-xs font-bold px-3 rounded-xl border cursor-pointer focus:outline-none transition-all whitespace-nowrap shrink-0 ${
                formData.status === 'ACTIVE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : formData.status === 'DRAFT'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              <option value="ACTIVE">● ACTIVE (Catalog Live)</option>
              <option value="DRAFT">○ DRAFT (Unpublished)</option>
              <option value="ARCHIVED">⊘ ARCHIVED (Hidden)</option>
            </select>

            <Link
              href="/admin/products"
              className="h-9 px-3.5 flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              Discard
            </Link>

            <button
              type="button"
              onClick={() => handleSaveProduct('DRAFT')}
              disabled={isSubmitting}
              className="h-9 px-3.5 flex items-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSaveProduct()}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{mode === 'edit' ? 'Save Changes' : 'Publish SKU'}</span>
                  <span className="hidden xl:inline text-[10px] opacity-70 font-mono">⌘S</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live SKU Summary Ribbon */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-5 overflow-x-auto text-xs text-slate-500 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">SKU:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formData.sku}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Price:</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{formatPrice(formData.price)}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Margin:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {profitMetrics.margin}% (+{profitMetrics.profit} AED)
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Stock:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formData.stock} units</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">VAT:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{formData.chargeTax ? '5% Standard' : 'Tax Exempt'}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Billable Weight:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{volumetricMetrics.billableWeight} kg</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Specs:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{configuredSpecsCount} defined</span>
          </div>
          {formData.hasVariants && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400">Variants:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{formData.variants.length} active</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {formError && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{formError}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}

      {/* Tab Bar (when viewMode === 'tabs') */}
      {viewMode === 'tabs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer min-w-[140px] ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{idx + 1}. {tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. MASTER 2-COLUMN ENTERPRISE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ===================== LEFT / MAIN COLUMN (8 COLS) ===================== */}
        <div className="lg:col-span-8 space-y-8">
          {/* SECTION 1: GENERAL PRODUCT & MEDIA STUDIO */}
          {(viewMode === 'all' || activeTab === 'general') && (
            <div id="section-overview" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span>Product Identification & Visual Studio</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define commercial model name, SKU barcode identifiers, and high-definition photography.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  Step 1
                </span>
              </div>

              {/* ── Auto-Title Builder & 1-Click Full Blueprint Presets ── */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800/90 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80">
                      <Wand2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Rapid Blueprint Ingestion</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/80 dark:border-purple-800">1-Click SKU Preset</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateStandardTitle}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold cursor-pointer transition-all shadow-sm shadow-purple-500/20"
                  >
                    <Wand2 className="w-3 h-3" /> Auto-Construct Title
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {HARDWARE_IMAGE_PRESETS.map((preset, idx) => {
                    const isSelected = formData.title === preset.fullTitle || formData.primaryImage === preset.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyFullPreset(preset)}
                        className={`p-2.5 rounded-xl transition-all text-left group cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50/80 dark:bg-purple-950/50 border-2 border-purple-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md'
                        }`}
                      >
                        <div className="aspect-video rounded-lg overflow-hidden mb-2 bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 relative">
                          <img
                            src={getSafeImageUrl(preset.url)}
                            alt={preset.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isSelected && (
                            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-purple-600 text-[9px] font-black text-white shadow">
                              Active
                            </span>
                          )}
                        </div>
                        <div className={`text-[11px] font-black truncate transition-colors ${
                          isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                        }`}>
                          {preset.label}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-slate-500 dark:text-slate-400 font-medium truncate pr-1">
                            {preset.brand} · {preset.category}
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-mono font-black shrink-0">
                            AED {preset.price.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Slug */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Product Title / Commercial Model Name *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formData.title.length} characters
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. HP ProBook 460 G11 Intel Core Ultra 5 16.1 FHD BL ENG DOS"
                    value={formData.title}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        title: val,
                        slug: prev.slug ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-inner"
                  />
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <span>Slug:</span>
                    <span className="text-purple-600 dark:text-purple-400">/shop/product/{formData.slug || 'product-slug'}</span>
                  </div>
                </div>

                {/* SKU & Barcode with Live Barcode Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Base SKU (Stock Keeping Unit) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, sku: generateRandomSku(p.categoryId) }))}
                        className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Randomize
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Barcode (EAN-13 / GTIN / UPC)
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, barcode: generateRandomBarcode() }))}
                        className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Barcode className="w-3.5 h-3.5" /> Generate EAN
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Barcode Graphic Preview */}
                {formData.barcode && (
                  <div className="pt-2">
                    {renderBarcodeSvg(formData.barcode)}
                  </div>
                )}

                {/* Category & Brand Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Hardware Category
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={e => {
                        const cat = categories.find(c => c.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          categoryId: e.target.value,
                          categoryName: cat?.name || prev.categoryName,
                          sku: prev.sku.startsWith('NX-') ? generateRandomSku(e.target.value) : prev.sku,
                        }));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-bold cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Brand / Manufacturer
                    </label>
                    <select
                      value={formData.brandId}
                      onChange={e => {
                        const b = brands.find(brand => brand.id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          brandId: e.target.value,
                          brandName: b?.name || prev.brandName,
                        }));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-bold cursor-pointer"
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descriptions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Short Commercial Teaser
                  </label>
                  <input
                    type="text"
                    placeholder="Concise commercial summary for cards and search snippets"
                    value={formData.shortDescription}
                    onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Full Technical Overview & Architectural Highlights
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Comprehensive architectural features, enterprise workload suitability, thermal design..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* ── Multi-Asset Gallery Manager ── */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      <span>Multi-Asset Gallery Studio</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                        {formData.images.length} asset{formData.images.length !== 1 ? 's' : ''}
                      </span>
                    </h3>
                  </div>

                  {/* Primary Cover Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary Cover Asset</label>
                      <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border-2 border-purple-500/60 relative shadow-md group">
                        <img
                          src={previewImageError ? DEFAULT_FALLBACK_IMAGE : getSafeImageUrl(formData.primaryImage)}
                          alt="Primary Cover"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={() => setPreviewImageError(true)}
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-purple-600/90 text-[10px] font-bold text-white backdrop-blur-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-white" /> Cover
                        </div>
                      </div>
                    </div>

                    {/* Gallery Thumbnails + Add URL */}
                    <div className="md:col-span-2 space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Gallery Queue</label>
                      {/* Thumbnail Strip */}
                      {formData.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {formData.images.map((imgUrl, imgIdx) => {
                            const isPrimary = imgUrl === formData.primaryImage;
                            return (
                              <div
                                key={imgIdx}
                                className={`relative flex-shrink-0 w-20 rounded-xl overflow-hidden border-2 transition-all ${
                                  isPrimary ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="aspect-video">
                                  <img
                                    src={getSafeImageUrl(imgUrl)}
                                    alt={`Asset ${imgIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                {isPrimary && (
                                  <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-purple-600 flex items-center justify-center">
                                    <Check className="w-2 h-2 text-white" />
                                  </div>
                                )}
                                {/* Thumbnail Controls */}
                                <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-between px-1 py-0.5">
                                  <button
                                    type="button"
                                    disabled={imgIdx === 0}
                                    onClick={() => handleMoveImage(imgIdx, 'left')}
                                    className="p-0.5 text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                                    title="Move Left"
                                  >
                                    <MoveLeft className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryImage(imgIdx)}
                                    disabled={isPrimary}
                                    className="p-0.5 text-amber-400/70 hover:text-amber-400 disabled:opacity-30 cursor-pointer"
                                    title="Set as Cover"
                                  >
                                    <Star className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGalleryImage(imgIdx)}
                                    className="p-0.5 text-red-400/70 hover:text-red-400 cursor-pointer"
                                    title="Remove"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={imgIdx === formData.images.length - 1}
                                    onClick={() => handleMoveImage(imgIdx, 'right')}
                                    className="p-0.5 text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
                                    title="Move Right"
                                  >
                                    <MoveRight className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Add Asset URL Input */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Paste image URL to add to gallery..."
                          value={galleryUrlInput}
                          onChange={e => setGalleryUrlInput(e.target.value.replace(/[<>'"]/g, ''))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddGalleryImage(galleryUrlInput);
                            }
                          }}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddGalleryImage(galleryUrlInput)}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>

                      {/* Primary Image URL Direct Edit */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Cover Asset URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.primaryImage}
                          onChange={e => {
                            const sanitized = e.target.value.replace(/[<>'"]/g, '');
                            setFormData({ ...formData, primaryImage: sanitized });
                            setPreviewImageError(false);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PRICING, FINANCIALS & UAE VAT */}
          {(viewMode === 'all' || activeTab === 'pricing') && (
            <div id="section-pricing" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span>Commercial Pricing, Profitability & UAE VAT</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unit economics, margin analytics, compare-at MSRP, and UAE Federal Tax Authority VAT exemption.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  Step 2
                </span>
              </div>

              {/* Pricing 3-Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Commercial Selling Price (AED) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl text-base font-mono font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">AED</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Compare-At / MSRP (AED)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={e => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">AED</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Cost of Goods / COGS (AED)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-xl text-base font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">AED</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Financial Profitability Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/40 dark:from-slate-950 dark:to-purple-950/20 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/20">
                    %
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Commercial Margin Breakdown</div>
                    <div className="text-xs text-slate-500">Real-time profitability calculated against unit wholesale cost</div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Gross Profit</span>
                    <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                      +{profitMetrics.profit} AED
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Gross Margin</span>
                    <span className={`text-sm font-mono font-black ${
                      profitMetrics.margin >= 15 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {profitMetrics.margin}% {profitMetrics.margin >= 15 ? '(Healthy)' : '(Moderate)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Cost Markup</span>
                    <span className="text-sm font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {profitMetrics.markup}%
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Target Gross Margin Calculator ── */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">Target Gross Margin Calculator</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">Auto-Price from COGS</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Target Margin %</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        step="1"
                        value={targetMarginInput}
                        onChange={e => setTargetMarginInput(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-sm font-mono font-black border border-emerald-200 dark:border-emerald-800 focus:outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Target Price (computed)</label>
                    <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-sm font-mono font-black text-emerald-700 dark:text-emerald-300">
                      {formData.costPrice > 0 && targetMarginInput < 100
                        ? `AED ${Math.round(formData.costPrice / (1 - targetMarginInput / 100)).toLocaleString()}`
                        : '—'}
                    </div>
                  </div>
                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => handleApplyTargetMargin(targetMarginInput)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Zap className="w-3.5 h-3.5" /> Apply & Sync
                    </button>
                  </div>
                </div>
                {formData.mapPrice !== undefined && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">MAP Floor (Min. Advertised Price)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={formData.mapPrice || ''}
                          onChange={e => setFormData(prev => ({ ...prev, mapPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">AED</span>
                      </div>
                    </div>
                    {formData.mapPrice > 0 && formData.price < formData.mapPrice && (
                      <div className="pt-5 text-[10px] font-bold text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Below MAP!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── B2B Volume Tiered Pricing Matrix ── */}
              {formData.tieredPricing && formData.tieredPricing.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                        <Percent className="w-3.5 h-3.5 text-purple-600" /> B2B Volume Tiered Pricing Matrix
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Wholesale discount tiers for enterprise bulk orders</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                      {formData.tieredPricing.length} Tiers
                    </span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Min. Qty</th>
                        <th className="py-3 px-4">Discount</th>
                        <th className="py-3 px-4 text-right">Unit Price (AED)</th>
                        <th className="py-3 px-4 text-right">Savings/Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {formData.tieredPricing.map((tier, tIdx) => {
                        const savings = formData.price - tier.unitPrice;
                        return (
                          <tr key={tIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                min="1"
                                value={tier.minQty}
                                onChange={e => {
                                  const tiers = [...(formData.tieredPricing || [])];
                                  tiers[tIdx] = { ...tiers[tIdx], minQty: parseInt(e.target.value, 10) || 1 };
                                  setFormData(prev => ({ ...prev, tieredPricing: tiers }));
                                }}
                                className="w-20 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="80"
                                  value={tier.discountPercent}
                                  onChange={e => handleUpdateTierPrice(tIdx, parseFloat(e.target.value) || 0)}
                                  className="w-20 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                                />
                                <span className="text-slate-400 text-[10px]">%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                              {tier.unitPrice.toLocaleString()} AED
                            </td>
                            <td className="py-3 px-4 text-right">
                              {savings > 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">-{savings.toLocaleString()} AED</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* UAE VAT 5% Compliance Box */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>UAE Federal Tax Authority (FTA) 5% VAT</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      formData.chargeTax ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {formData.chargeTax ? 'Standard 5% Rate' : 'Zero-Rated / Tax Exempt'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {formData.chargeTax
                      ? `Taxable: Net Price ${(formData.price / 1.05).toFixed(2)} AED + 5% VAT ${(formData.price - (formData.price / 1.05)).toFixed(2)} AED`
                      : 'Applicable for Designated Free Zones (JAFZA, DAFZA) or direct international export sales.'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, chargeTax: !prev.chargeTax }))}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    formData.chargeTax ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${formData.chargeTax ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: WAREHOUSING & REGIONAL HUBS */}
          {(viewMode === 'all' || activeTab === 'inventory') && (
            <div id="section-warehousing" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-purple-600" />
                    <span>Regional Warehouse Nodes & Stock Allocations</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atomic stock distribution across Dubai JAFZA, Deira, Abu Dhabi, and Sharjah depots.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.inventoryTracked}
                      onChange={e => setFormData({ ...formData, inventoryTracked: e.target.checked })}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Track Quantities</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowBackorder}
                      onChange={e => setFormData({ ...formData, allowBackorder: e.target.checked })}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Allow Backorders</span>
                  </label>
                </div>
              </div>

              {/* Smart Distribution Preset Buttons */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <Warehouse className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Smart Stock Distribution</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleSmartStockDistribution('consolidate_jafza')}
                    className="text-xs px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition-all flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Consolidate JAFZA
                  </button>
                  <button type="button" onClick={() => handleSmartStockDistribution('even')}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-all">
                    ⚖️ Distribute Evenly
                  </button>
                  <button type="button" onClick={() => handleSmartStockDistribution('ratio_70_10')}
                    className="text-xs px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900 cursor-pointer transition-all">
                    📊 Enterprise 70/10/10/10
                  </button>
                  <button type="button" onClick={() => handleSmartStockDistribution('clear')}
                    className="text-xs px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold hover:bg-red-200 dark:hover:bg-red-900 cursor-pointer transition-all">
                    <X className="w-3 h-3 inline mr-0.5" /> Clear All
                  </button>
                </div>
              </div>

              {/* Warehouse Stock Matrix Table with Bin Tracking */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Warehouse Facility</th>
                      <th className="py-3 px-3">Bin / Aisle / Rack</th>
                      <th className="py-3 px-3 text-center">Safety Stock</th>
                      <th className="py-3 px-3 text-center">Available</th>
                      <th className="py-3 px-3 text-center">Committed</th>
                      <th className="py-3 px-3 text-center">Unavailable</th>
                      <th className="py-3 px-3 text-right">On Hand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formData.locations.map((loc, idx) => (
                      <tr key={loc.locationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${loc.available > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span className="text-[11px]">{loc.locationName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pl-4">{loc.city}</div>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            placeholder="e.g. A-04-18"
                            value={loc.binLocation || ''}
                            onChange={e => handleLocationBinChange(idx, e.target.value)}
                            className="w-24 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            value={loc.safetyStock ?? 0}
                            onChange={e => handleLocationSafetyStockChange(idx, parseInt(e.target.value, 10) || 0)}
                            className="w-16 mx-auto block bg-slate-50 dark:bg-slate-950 text-center py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-amber-600 dark:text-amber-400"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            value={loc.available}
                            onChange={e => handleLocationStockChange(idx, 'available', parseInt(e.target.value, 10) || 0)}
                            className="w-20 mx-auto block bg-slate-50 dark:bg-slate-950 text-center py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-purple-600 dark:text-purple-400"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            value={loc.committed}
                            onChange={e => handleLocationStockChange(idx, 'committed', parseInt(e.target.value, 10) || 0)}
                            className="w-20 mx-auto block bg-slate-50 dark:bg-slate-950 text-center py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            value={loc.unavailable}
                            onChange={e => handleLocationStockChange(idx, 'unavailable', parseInt(e.target.value, 10) || 0)}
                            className="w-20 mx-auto block bg-slate-50 dark:bg-slate-950 text-center py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono"
                          />
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                          {loc.onHand}
                          {(loc.safetyStock ?? 0) > 0 && loc.available <= (loc.safetyStock ?? 0) && (
                            <div className="text-[9px] text-amber-500 font-bold">⚠ Low</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Low Stock Alert Level */}
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-slate-500 font-semibold">Global Low-Stock Alert:</span>
                <input
                  type="number"
                  min="1"
                  value={formData.lowStockThreshold}
                  onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 5 })}
                  className="w-16 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-center"
                />
                <span className="text-xs text-slate-400">units</span>
              </div>
            </div>
          )}

          {/* SECTION 4: TECHNICAL SPECIFICATIONS MATRIX — REDESIGNED */}
          {(viewMode === 'all' || activeTab === 'specs') && (
            <div id="section-specs" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">

              {/* Section Header */}
              <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/10">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-600/10 border border-purple-200 dark:border-purple-800">
                    <Cpu className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Technical Specifications &amp; Hardware Matrix</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Configure hardware parameters across 6 namespaced engineering groups.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 dark:text-white">{configuredSpecsCount} <span className="font-normal text-slate-400">/ {SPECIFICATION_GROUPS.reduce((t, g) => t + g.fields.length, 0)}</span></div>
                    <div className="text-[10px] text-slate-400">params filled</div>
                  </div>
                  <div className="w-14 h-14 relative">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
                      <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" stroke="#9333ea"
                        strokeDasharray={`${Math.round((configuredSpecsCount / Math.max(1, SPECIFICATION_GROUPS.reduce((t, g) => t + g.fields.length, 0))) * 100)} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-purple-600 dark:text-purple-400">
                      {Math.round((configuredSpecsCount / Math.max(1, SPECIFICATION_GROUPS.reduce((t, g) => t + g.fields.length, 0))) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Body: Left Nav + Right Panel */}
              <div className="flex min-h-[520px]">

                {/* Left: Vertical Group Navigator */}
                <div className="w-56 sm:w-60 shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3 space-y-1.5">
                  {SPECIFICATION_GROUPS.map((group, gIdx) => {
                    const isActive = activeSpecTab === group.id;
                    const filledCount = group.fields.filter(f => Boolean(formData.specifications[f.key])).length;
                    const totalCount = group.fields.length;
                    const fillPct = Math.round((filledCount / totalCount) * 100);
                    const pillColors = ['bg-purple-600','bg-blue-600','bg-emerald-600','bg-amber-500','bg-rose-600','bg-indigo-600'];
                    const textColors = ['text-purple-600','text-blue-600','text-emerald-600','text-amber-600','text-rose-600','text-indigo-600'];
                    const pc = pillColors[gIdx % pillColors.length];
                    const tc = textColors[gIdx % textColors.length];
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setActiveSpecTab(group.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer group ${
                          isActive ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700' : 'hover:bg-white/60 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className={`text-xs font-bold leading-snug ${
                            isActive ? tc : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                          }`}>{group.name}</span>
                          {filledCount > 0 && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white ${pc} shrink-0 mt-0.5`}>{filledCount}</span>
                          )}
                        </div>
                        <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${pc}`} style={{ width: `${fillPct}%` }} />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">{filledCount}/{totalCount} params filled</div>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Spec Field Panel */}
                <div className="flex-1 p-6 sm:p-8 space-y-6 min-w-0">
                  {(() => {
                    const groupIndex = Math.max(0, SPECIFICATION_GROUPS.findIndex(g => g.id === activeSpecTab));
                    const currentGroup = SPECIFICATION_GROUPS[groupIndex] || SPECIFICATION_GROUPS[0];
                    const filledInGroup = currentGroup.fields.filter(f => Boolean(formData.specifications[f.key])).length;
                    return (
                      <div className="space-y-6">

                        {/* Group Header Banner — Theme Adaptive (Light & Dark) */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50/80 via-slate-50 to-slate-100/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 flex items-center justify-between gap-4 shadow-sm border border-purple-100/90 dark:border-slate-800">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0"></span>
                              <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">{currentGroup.name}</h3>
                              <span className="inline-flex items-center whitespace-nowrap shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 shadow-xs">
                                Group {groupIndex + 1} of {SPECIFICATION_GROUPS.length}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{currentGroup.description}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-lg font-black text-slate-900 dark:text-white leading-none">
                                {filledInGroup}<span className="text-xs font-normal text-slate-400 dark:text-slate-500">/{currentGroup.fields.length}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">completed</div>
                            </div>
                            {filledInGroup > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cleared = { ...formData.specifications };
                                  currentGroup.fields.forEach(f => { cleared[f.key] = ''; });
                                  setFormData(prev => ({ ...prev, specifications: cleared }));
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 dark:bg-white/10 dark:hover:bg-rose-500/20 dark:text-slate-200 dark:hover:text-rose-300 dark:border-white/15 text-xs font-bold cursor-pointer transition-all whitespace-nowrap shadow-xs"
                              >
                                Clear Group
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Spec Fields Grid — Clean 2-Column Professional Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentGroup.fields.map(field => {
                            const presets = field.presetKey ? (SPECIFICATION_PRESETS[field.presetKey] || []) : (SPECIFICATION_PRESETS[field.key as keyof typeof SPECIFICATION_PRESETS] || []);
                            const currentValue = formData.specifications[field.key] || '';
                            const isFilled = Boolean(currentValue);
                            return (
                              <div key={field.key} className={`relative group rounded-2xl border transition-all p-4 space-y-2.5 ${
                                isFilled ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm' : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40'
                              }`}>
                                <div className="flex items-center justify-between gap-2">
                                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                    {field.label}
                                  </label>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {isFilled && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-1">
                                        <Check className="w-2.5 h-2.5" /> Set
                                      </span>
                                    )}
                                    {isFilled && (
                                      <button
                                        type="button"
                                        onClick={() => handleSpecChange(field.key, '')}
                                        className="p-1 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                        title="Clear spec"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {presets.length > 0 ? (
                                  <div className="relative">
                                    <select
                                      value={currentValue}
                                      onChange={e => handleSpecChange(field.key, e.target.value)}
                                      className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 cursor-pointer appearance-none transition-all pr-8"
                                    >
                                      <option value="">— Select —</option>
                                      {currentValue && !presets.includes(currentValue) && (
                                        <option value={currentValue}>{currentValue}</option>
                                      )}
                                      {presets.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                      ))}
                                    </select>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder={field.placeholder || `Enter ${field.label}…`}
                                    value={currentValue}
                                    onChange={e => handleSpecChange(field.key, e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all placeholder:text-slate-400"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Active params summary strip */}
                        {filledInGroup > 0 && (
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Active Parameters — {currentGroup.name}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {currentGroup.fields.filter(f => Boolean(formData.specifications[f.key])).map(f => (
                                <span
                                  key={f.key}
                                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 shadow-sm"
                                >
                                  <span className="text-slate-500 dark:text-slate-400">{f.label}:</span>
                                  <span className="font-bold text-slate-900 dark:text-white">{formData.specifications[f.key]}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleSpecChange(f.key, '')}
                                    className="p-0.5 text-purple-400 hover:text-red-500 cursor-pointer transition-colors"
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Custom Dynamic Metafields Builder */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800">
                          <Plus className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-white">Custom Dynamic Metafields</h3>
                          <p className="text-[11px] text-slate-400">Arbitrary parameters not in standard spec groups</p>
                        </div>
                      </div>
                      <button type="button" onClick={handleAddCustomSpec}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Metafield
                      </button>
                    </div>
                    {formData.customSpecs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {formData.customSpecs.map((cs, i) => (
                          <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group">
                            <div className="flex-1 space-y-1.5">
                              <input type="text" placeholder="Key (e.g. TPM 2.0 Chip)" value={cs.key}
                                onChange={e => handleCustomSpecChange(i, 'key', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500" />
                              <input type="text" placeholder="Value" value={cs.value}
                                onChange={e => handleCustomSpecChange(i, 'value', e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg text-[11px] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500" />
                            </div>
                            <button type="button" onClick={() => handleRemoveCustomSpec(i)}
                              className="p-2 text-slate-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all mt-0.5">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                          <Plus className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="text-xs font-bold text-slate-500">No custom metafields yet</div>
                        <div className="text-[11px] text-slate-400">Add TPM version, cooling config, certifications, etc.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: VARIANTS & MULTI-SKU COMBINATIONS */}
          {(viewMode === 'all' || activeTab === 'variants') && (
            <div id="section-variants" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>Product Variants & Multi-SKU Engine</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate multi-option matrices (RAM, Storage, Colors) with autonomous hierarchical SKUs and barcodes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, hasVariants: !p.hasVariants }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    formData.hasVariants
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {formData.hasVariants ? '✓ Multi-SKU Matrix Enabled' : 'Enable Multi-SKU Mode'}
                </button>
              </div>

              {formData.hasVariants ? (
                <div className="space-y-6">
                  {/* Option Builder */}
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          1. Define Variant Options
                        </div>
                        <div className="text-xs text-slate-500">Configure parameters like Memory or Storage Capacity with values</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Option Name (e.g. Color)..."
                          value={newOptionName}
                          onChange={e => setNewOptionName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOptionName();
                            }
                          }}
                          className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 min-w-[180px]"
                        />
                        <button
                          type="button"
                          onClick={handleAddOptionName}
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-500 transition-colors cursor-pointer"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.variantOptions.map((opt, optIdx) => (
                        <div key={optIdx} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Option: <span className="text-purple-600 dark:text-purple-400 font-black">{opt.name}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionGroup(optIdx)}
                              className="text-xs text-red-500 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {opt.values.map(val => (
                              <span
                                key={val}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700"
                              >
                                {val}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOptionValue(optIdx, val)}
                                  className="hover:text-red-500 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              placeholder={`Add value...`}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOptionValue(optIdx, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                              className="bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-800 min-w-[120px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleGenerateVariants}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Combinations Matrix</span>
                      </button>
                    </div>
                  </div>

                  {/* High Density Variant Matrix Table */}
                  {formData.variants.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Generated Variant Matrix ({formData.variants.length} SKU Combinations)
                          </div>
                          <div className="text-xs text-slate-500">Granular pricing, independent stock nodes, and barcode tracking</div>
                        </div>
                        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                          Total Variant Stock: {formData.stock} units
                        </span>
                      </div>

                      {/* ── Batch Controls Ribbon ── */}
                      <div className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 mr-1">Batch Actions:</span>
                        <button type="button" onClick={handleBatchVariantPrice}
                          className="text-[11px] px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition-all flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Apply Base Price to All
                        </button>
                        <button type="button" onClick={() => handleBatchVariantMarkup(5)}
                          className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-all">
                          +5% Markup All
                        </button>
                        <button type="button" onClick={() => handleBatchVariantMarkup(-5)}
                          className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-all">
                          -5% Discount All
                        </button>
                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-[10px] text-slate-500 font-semibold">Uniform Stock:</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="qty"
                            className="w-16 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-center"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const qty = parseInt((e.target as HTMLInputElement).value, 10);
                                if (!isNaN(qty)) handleBatchVariantStock(qty);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={e => {
                              const inp = (e.currentTarget.previousElementSibling as HTMLInputElement);
                              const qty = parseInt(inp?.value || '0', 10);
                              if (!isNaN(qty) && qty >= 0) handleBatchVariantStock(qty);
                            }}
                            className="text-[11px] px-2 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                          >
                            Set All
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                              <th className="py-3 px-4">Variant Title</th>
                              <th className="py-3 px-4">Variant SKU</th>
                              <th className="py-3 px-4">Barcode (EAN)</th>
                              <th className="py-3 px-4 text-right">Price (AED)</th>
                              <th className="py-3 px-4 text-right">Cost (AED)</th>
                              <th className="py-3 px-4 text-center">Stock</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {formData.variants.map((v, i) => (
                              <tr key={v.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                  {v.title}
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="text"
                                    value={v.sku}
                                    onChange={e => handleUpdateVariant(i, { sku: e.target.value })}
                                    className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 w-full min-w-[210px]"
                                  />
                                </td>
                                <td className="py-3 px-4">
                                  <input
                                    type="text"
                                    value={v.barcode || ''}
                                    onChange={e => handleUpdateVariant(i, { barcode: e.target.value })}
                                    className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-800 w-full min-w-[140px]"
                                  />
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <input
                                    type="number"
                                    value={v.price}
                                    onChange={e => handleUpdateVariant(i, { price: parseFloat(e.target.value) || 0 })}
                                    className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 w-28 text-right"
                                  />
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <input
                                    type="number"
                                    value={v.costPrice || ''}
                                    onChange={e => handleUpdateVariant(i, { costPrice: parseFloat(e.target.value) || 0 })}
                                    className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-800 w-28 text-right"
                                  />
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="number"
                                    value={v.stock}
                                    onChange={e => handleUpdateVariant(i, { stock: parseInt(e.target.value, 10) || 0 })}
                                    className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-800 w-20 text-center"
                                  />
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVariant(i)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                    title="Delete Variant"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Sparkles className="w-8 h-8 text-purple-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Single Standalone Hardware SKU</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    This hardware model currently operates as a standalone SKU. Enable Multi-SKU mode to configure RAM, Storage, or Graphics options.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, hasVariants: true }))}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Enable Multi-SKU Combinations
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: LOGISTICS, DIMENSIONS & COMPLIANCE */}
          {(viewMode === 'all' || activeTab === 'logistics') && (
            <div id="section-logistics" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    <span>Logistics, Volumetric Shipping & GCC Customs</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Packaging dimensions, volumetric weight calculation, HS tariff codes, and warranty terms.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  Step 6
                </span>
              </div>

              {/* Physical Goods Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Physical Hardware Parcel</div>
                  <div className="text-[11px] text-slate-500">Requires parcel dispatch, weight check, and customs airway bill</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, isPhysical: !p.isPhysical }))}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formData.isPhysical ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${formData.isPhysical ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Dimensions & Weight Grid */}
              {formData.isPhysical && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Net Weight (kg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.weight || ''}
                        onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Length ({formData.dimensions.unit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.length}
                        onChange={e => setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) || 0 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Width ({formData.dimensions.unit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.width}
                        onChange={e => setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) || 0 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Height ({formData.dimensions.unit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.height}
                        onChange={e => setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) || 0 },
                        })}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        HS Tariff Code
                      </label>
                      <input
                        type="text"
                        placeholder="8471.30.01"
                        value={formData.hsCode || ''}
                        onChange={e => setFormData({ ...formData, hsCode: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border border-slate-200 dark:border-slate-800"
                      />
                    </div>
                  </div>

                  {/* Volumetric Weight Calculator Advice */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">Courier Billable Weight: </span>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400">{volumetricMetrics.billableWeight} kg</span>
                        <span className="text-slate-400 ml-1.5">
                          (Volumetric: {volumetricMetrics.volWeight} kg vs Actual: {formData.weight || 0} kg)
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      DHL / Aramex standard volumetric divisor (5000)
                    </span>
                  </div>
                </div>
              )}

              {/* Warranty & Condition Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Hardware Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 font-bold cursor-pointer"
                  >
                    {CONDITION_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Official Warranty Coverage Tier
                  </label>
                  <select
                    value={formData.warranty}
                    onChange={e => {
                      const val = e.target.value;
                      const match = val.match(/(\d+)\s*Year/i);
                      const yrs = match ? parseInt(match[1], 10) : 3;
                      setFormData({ ...formData, warranty: val, warrantyYears: yrs });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 font-bold cursor-pointer"
                  >
                    {WARRANTY_OPTIONS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================== RIGHT SIDEBAR (4 COLS) ===================== */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* SIDEBAR CARD 1: LIVE STOREFRONT PRODUCT CARD PREVIEW + FX SIMULATOR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" /> Live Preview Studio
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                Live Mockup
              </span>
            </div>

            {/* FX Currency Simulator Pills */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Multi-Currency FX Simulator</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.entries(FX_RATES) as [keyof typeof FX_RATES, typeof FX_RATES[keyof typeof FX_RATES]][]).map(([cur, info]) => {
                  const isSelected = previewCurrency === cur;
                  const displayLabel = info.symbol !== cur ? `${info.symbol} ${cur}` : cur;
                  return (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => setPreviewCurrency(cur)}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {displayLabel}
                    </button>
                  );
                })}
              </div>
              <div className="text-center pt-1 pb-0.5">
                <div className="text-2xl font-mono font-black text-purple-600 dark:text-purple-400 tracking-tight">
                  {formatFxPrice(formData.price, previewCurrency)}
                </div>
                <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                  Simulated Customer Price ({previewCurrency})
                </div>
              </div>
            </div>

            {/* The Actual Mock Product Card — Automatically Theme Adaptive */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={previewImageError ? DEFAULT_FALLBACK_IMAGE : getSafeImageUrl(formData.primaryImage)}
                  alt={formData.title ? formData.title.replace(/[<>'"]/g, '') : 'Product Preview'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={() => setPreviewImageError(true)}
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 dark:bg-slate-900/90 text-white text-[10px] font-black tracking-wider uppercase backdrop-blur-md border border-white/10 shadow-sm">
                  {formData.brandName || 'Brand'}
                </div>
                {formData.discountPercentage > 0 && (
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black tracking-wider shadow-sm">
                    -{formData.discountPercentage}%
                  </div>
                )}
                <div className={`absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md shadow-sm ${
                  formData.stock > 0 ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'
                }`}>
                  {formData.stock > 0 ? `In Stock (${formData.stock})` : 'Out of Stock'}
                </div>
              </div>

              <div className="p-4 space-y-2.5 bg-white dark:bg-slate-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[11px] font-black ml-1 text-slate-700 dark:text-slate-200">
                      5.0
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                    {formData.condition || 'Brand New'}
                  </span>
                </div>

                <div className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {formData.title || 'HP ProBook 460 G11 Business Laptop'}
                </div>

                <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                  <span className="text-base font-black font-mono text-purple-600 dark:text-purple-400">
                    {formatFxPrice(formData.price, previewCurrency)}
                  </span>
                  {formData.originalPrice > formData.price && (
                    <span className="text-xs line-through text-slate-400 font-mono">
                      {formatFxPrice(formData.originalPrice, previewCurrency)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    ({formData.chargeTax ? 'incl. 5% VAT' : '0% Tax'})
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {formData.warrantyYears}Y Warranty
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                    {formData.sku}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR CARD 2: SKU QUALITY & COMPLETENESS SCORE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Catalog Readiness Score
              </span>
              <span className={`text-xs font-mono font-black ${
                completeness.percentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {completeness.percentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>{completeness.passedCount} of {completeness.total} parameters passed</span>
                <span>{completeness.percentage >= 80 ? 'Ready to Publish' : 'Needs Details'}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 pt-1">
              {completeness.checks.map(check => (
                <div key={check.id} className="flex items-center justify-between text-xs">
                  <span className={check.passed ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}>
                    {check.label}
                  </span>
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR CARD 3: TAXONOMY & FACETED CHIPS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" /> Collections & Tags
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {formData.collections.length + formData.tags.length} assigned
              </span>
            </div>

            {/* Collections */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Catalog Collections
              </label>
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[42px]">
                {formData.collections.map(c => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-bold"
                  >
                    {c}
                    <button type="button" onClick={() => handleRemoveCollection(c)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ Add collection..."
                  value={collectionInput}
                  onChange={e => setCollectionInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCollection(collectionInput);
                    }
                  }}
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none p-1 flex-1 min-w-[100px]"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Search & Filter Tags
              </label>
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[42px]">
                {formData.tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold"
                  >
                    #{t}
                    <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ Add tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none p-1 flex-1 min-w-[80px]"
                />
              </div>
            </div>
          </div>

          {/* SIDEBAR CARD 4: QUICK JUMP NAVIGATOR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white block mb-2">
              Fast Section Navigator
            </span>
            <div className="space-y-1">
              {TABS.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (viewMode === 'tabs') {
                        setActiveTab(tab.id);
                      } else {
                        const targetId = tab.id === 'general' ? 'section-overview'
                          : tab.id === 'pricing' ? 'section-pricing'
                          : tab.id === 'inventory' ? 'section-warehousing'
                          : tab.id === 'specs' ? 'section-specs'
                          : tab.id === 'variants' ? 'section-variants'
                          : 'section-logistics';
                        const el = document.getElementById(targetId);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-purple-600" />
                      <span>{idx + 1}. {tab.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
