'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Product,
  ProductVariant,
  WarehouseLocationStock,
  Category,
  Brand,
  SellerType,
  Reseller,
} from '@/types';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
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
  ChevronLeft,
  ChevronRight,
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
  Square,
  Globe,
  FileText,
} from 'lucide-react';

export type AdminModalStep =
  | 'basic'
  | 'organization'
  | 'media'
  | 'pricing'
  | 'inventory'
  | 'shipping'
  | 'specs'
  | 'variants'
  | 'status';

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

const HARDWARE_IMAGE_PRESETS = [
  { label: 'Intel Core i9 CPU', category: 'CPUs', url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80' },
  { label: 'ASUS ROG RTX 4090', category: 'GPUs', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80' },
  { label: 'HP ProBook Business Laptop', category: 'Laptops', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
  { label: 'Enterprise Storage Drive', category: 'Storage', url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Corsair DDR5 Memory Kit', category: 'RAM', url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80' },
  { label: 'Platinum Server PSU', category: 'PSUs', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80' },
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

export interface ProductModalFormData {
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
    quantity: number;
    available: number;
    committed: number;
    unavailable: number;
    onHand: number;
  }[];
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

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  resellers: Reseller[];
  token: string | null;
  mode?: 'admin' | 'reseller';
  resellerCode?: string;
}

export function AdminProductModal({
  isOpen,
  onClose,
  onSaved,
  product,
  categories,
  brands,
  resellers,
  token,
  mode = 'admin',
  resellerCode = '',
}: AdminProductModalProps) {
  const isEditing = Boolean(product);

  const [activeModalStep, setActiveModalStep] = useState<AdminModalStep>('basic');
  const [activeSpecTab, setActiveSpecTab] = useState<string>(SPECIFICATION_GROUPS[0]?.id || 'core');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Local helper states
  const [tagInput, setTagInput] = useState('');
  const [collectionInput, setCollectionInput] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValueInput, setNewOptionValueInput] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [customWarranty, setCustomWarranty] = useState('');

  // Form Data State
  const [formData, setFormData] = useState<ProductModalFormData>({
    title: '',
    slug: '',
    sku: '',
    barcode: '',
    shortDescription: '',
    description: '',
    condition: 'Brand New (Factory Sealed)',
    warrantyYears: 3,
    warranty: '3 Years Official Manufacturer Warranty',
    price: 999,
    originalPrice: 1199,
    costPrice: 799,
    discountPercentage: 16.7,
    chargeTax: true,
    unitPrice: 999,
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
      quantity: w.id === 'loc_dxb_main' ? 25 : 0,
      available: w.id === 'loc_dxb_main' ? 25 : 0,
      committed: 0,
      unavailable: 0,
      onHand: w.id === 'loc_dxb_main' ? 25 : 0,
    })),
    weight: 1.5,
    dimensions: {
      length: 30,
      width: 20,
      height: 5,
      unit: 'cm' as 'cm' | 'in',
    },
    hsCode: '8471.30.01',
    isPhysical: true,
    collections: ['Laptops'],
    tags: ['Work Laptop', 'UAE'],
    primaryImage: DEFAULT_FALLBACK_IMAGE,
    images: [DEFAULT_FALLBACK_IMAGE],
    sellerType: 'ADMIN' as SellerType,
    resellerId: '',
    resellerName: '',
    resellerCode: '',
    categoryId: '',
    categoryName: '',
    brandId: '',
    brandName: '',
    socket: 'LGA1700',
    tdp: 125,
    formFactor: 'ATX',
    specifications: {} as Record<string, string>,
    customSpecs: [] as { key: string; value: string }[],
    hasVariants: false,
    variantOptions: [
      { name: 'RAM', values: ['16GB', '32GB'] },
      { name: 'Storage', values: ['512GB SSD', '1TB SSD'] },
    ],
    variants: [] as ProductVariant[],
    status: 'ACTIVE' as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
  });

  const generateRandomSku = (catId?: string) => {
    const prefixMap: Record<string, string> = {
      cat_processors: 'CPU',
      cat_gpus: 'GPU',
      cat_motherboards: 'MBD',
      cat_ram: 'RAM',
      cat_storage: 'SSD',
      cat_psus: 'PSU',
      cat_servers: 'SRV',
      cat_laptops: 'LPT',
      cat_networking: 'NET',
      cat_monitors: 'MON',
    };
    const code = prefixMap[catId || 'cat_laptops'] || 'SKU';
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `NX-${code}-${rand}`;
  };

  const generateRandomBarcode = () => {
    return `729${Math.floor(100000000 + Math.random() * 900000000)}`;
  };

  // Populate form on open / edit
  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    setActiveModalStep('basic');

    if (product) {
      const loadedSpecs: Record<string, string> = { ...(product.specifications || {}) };
      if (product.specs?.socket && !loadedSpecs['Socket Type']) loadedSpecs['Socket Type'] = product.specs.socket;
      if (product.specs?.formFactor && !loadedSpecs['Form Factor']) loadedSpecs['Form Factor'] = product.specs.formFactor;
      if (product.specs?.warrantyYears && !loadedSpecs['Warranty']) loadedSpecs['Warranty'] = `${product.specs.warrantyYears} Years Official Manufacturer Warranty`;

      const standardKeys = new Set<string>(SPECIFICATION_FIELDS);
      const customSpecsList: { key: string; value: string }[] = [];
      Object.entries(loadedSpecs).forEach(([k, v]) => {
        if (!standardKeys.has(k)) {
          customSpecsList.push({ key: k, value: String(v) });
        }
      });

      const origP = product.originalPrice || product.compareAtPrice || product.price;
      const computedDiscount = origP > product.price ? Math.round(((origP - product.price) / origP) * 100) : 0;

      const cond = loadedSpecs['Condition'] || 'Brand New (Factory Sealed)';
      const war = product.warranty || loadedSpecs['Warranty'] || '3 Years Official Manufacturer Warranty';

      const prodLocations = product.locations && product.locations.length > 0
        ? product.locations.map(w => ({
            locationId: w.locationId,
            locationName: w.locationName,
            city: w.city || 'UAE',
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
    } else {
      // New Product Initialization
      const initialCat = categories[0];
      const initialBrand = brands[0];
      const initialSku = generateRandomSku(initialCat?.id);

      setFormData({
        title: '',
        slug: '',
        sku: initialSku,
        barcode: generateRandomBarcode(),
        shortDescription: '',
        description: '',
        condition: 'Brand New (Factory Sealed)',
        warrantyYears: 3,
        warranty: '3 Years Official Manufacturer Warranty',
        price: mode === 'reseller' ? 0 : 999,
        originalPrice: mode === 'reseller' ? 0 : 1199,
        costPrice: mode === 'reseller' ? 0 : 799,
        discountPercentage: mode === 'reseller' ? 0 : 16.7,
        chargeTax: true,
        unitPrice: mode === 'reseller' ? 0 : 999,
        unitMeasure: 'unit',
        stock: mode === 'reseller' ? 0 : 25,
        lowStockThreshold: 5,
        inventoryTracked: true,
        allowBackorder: false,
        warehouseLocation: 'loc_dxb_main',
        locations: WAREHOUSE_LOCATIONS.map(w => ({
          locationId: w.id,
          locationName: w.name,
          city: w.city,
          quantity: mode === 'reseller' ? 0 : w.id === 'loc_dxb_main' ? 25 : 0,
          available: mode === 'reseller' ? 0 : w.id === 'loc_dxb_main' ? 25 : 0,
          committed: 0,
          unavailable: 0,
          onHand: mode === 'reseller' ? 0 : w.id === 'loc_dxb_main' ? 25 : 0,
        })),
        weight: mode === 'reseller' ? 0 : 1.5,
        dimensions: {
          length: mode === 'reseller' ? 0 : 30,
          width: mode === 'reseller' ? 0 : 20,
          height: mode === 'reseller' ? 0 : 5,
          unit: 'cm',
        },
        hsCode: mode === 'reseller' ? '' : '8471.30.01',
        isPhysical: true,
        collections: mode === 'reseller' ? [] : ['Laptops', 'Home & Business Laptops'],
        tags: mode === 'reseller' ? [] : ['Work Laptop', 'UAE'],
        primaryImage: DEFAULT_FALLBACK_IMAGE,
        images: [DEFAULT_FALLBACK_IMAGE],
        sellerType: mode === 'reseller' ? 'RESELLER' : 'ADMIN',
        resellerId: '',
        resellerName: '',
        resellerCode: '',
        categoryId: initialCat?.id || '',
        categoryName: initialCat?.name || '',
        brandId: initialBrand?.id || '',
        brandName: initialBrand?.name || '',
        socket: mode === 'reseller' ? '' : 'LGA1700',
        tdp: mode === 'reseller' ? 0 : 125,
        formFactor: mode === 'reseller' ? '' : 'ATX',
        specifications: mode === 'reseller' ? {} : {
          Condition: 'Brand New (Factory Sealed)',
          'Product Category': initialCat?.name || 'Laptops',
          'Processor Brand': 'Intel',
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
    }
  }, [isOpen, product]);

  const configuredSpecsCount = useMemo(() => {
    return Object.keys(formData.specifications).filter(k => Boolean(formData.specifications[k])).length + formData.customSpecs.length;
  }, [formData.specifications, formData.customSpecs]);

  if (!isOpen) return null;

  // Tag Helpers
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

  // Collection Helpers
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

  // Image Helpers
  const handleAddImage = (url: string) => {
    const clean = url.trim().replace(/[<>'"]/g, '');
    if (!clean) return;
    const safeUrl = getSafeImageUrl(clean);
    if (!formData.images.includes(safeUrl)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, safeUrl],
        primaryImage: prev.primaryImage || safeUrl,
      }));
    }
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => {
      const remaining = prev.images.filter((_, i) => i !== index);
      const newPrimary = remaining.includes(prev.primaryImage)
        ? prev.primaryImage
        : (remaining[0] || DEFAULT_FALLBACK_IMAGE);
      return {
        ...prev,
        images: remaining.length > 0 ? remaining : [DEFAULT_FALLBACK_IMAGE],
        primaryImage: newPrimary,
      };
    });
  };

  const handleSetPrimaryImage = (url: string) => {
    setFormData(prev => ({ ...prev, primaryImage: url }));
  };

  // Variant Option Helpers
  const handleAddVariantOption = () => {
    const name = newOptionName.trim();
    if (!name) return;
    const vals = newOptionValueInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    setFormData(prev => ({
      ...prev,
      variantOptions: [
        ...prev.variantOptions.filter(o => o.name !== name),
        { name, values: vals.length > 0 ? vals : ['Standard'] },
      ],
    }));
    setNewOptionName('');
    setNewOptionValueInput('');
  };

  const handleRemoveVariantOption = (optIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variantOptions: prev.variantOptions.filter((_, i) => i !== optIndex),
    }));
  };

  const handleAddOptionValue = (optIndex: number, val: string) => {
    const clean = val.trim();
    if (!clean) return;
    setFormData(prev => {
      const next = [...prev.variantOptions];
      if (!next[optIndex].values.includes(clean)) {
        next[optIndex] = {
          ...next[optIndex],
          values: [...next[optIndex].values, clean],
        };
      }
      return { ...prev, variantOptions: next };
    });
  };

  const handleRemoveOptionValue = (optIndex: number, valIndex: number) => {
    setFormData(prev => {
      const next = [...prev.variantOptions];
      next[optIndex] = {
        ...next[optIndex],
        values: next[optIndex].values.filter((_, i) => i !== valIndex),
      };
      return { ...prev, variantOptions: next };
    });
  };

  // Cartesian combination generator
  const handleGenerateVariants = () => {
    if (formData.variantOptions.length === 0) return;

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce(
        (acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])),
        [[]] as string[][]
      );
    };

    const optNames = formData.variantOptions.map(o => o.name);
    const optValueArrays = formData.variantOptions.map(o => (o.values.length > 0 ? o.values : ['Default']));
    const combinations = cartesian(optValueArrays);

    const generated: ProductVariant[] = combinations.map((combo, idx) => {
      const optionsRecord: Record<string, string> = {};
      combo.forEach((val, i) => {
        optionsRecord[optNames[i]] = val;
      });

      const title = combo.join(' / ');
      const skuSuffix = combo.map(c => c.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()).join('-');
      const variantSku = `${formData.sku}-${skuSuffix || idx + 1}`;

      return {
        id: `var_${Date.now()}_${idx}`,
        sku: variantSku,
        barcode: generateRandomBarcode(),
        title,
        price: Number(formData.price),
        compareAtPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        stock: Math.max(1, Math.floor((Number(formData.stock) || 10) / combinations.length)),
        options: optionsRecord,
        image: formData.primaryImage,
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

  const handleUpdateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const next = [...prev.variants];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, variants: next };
    });
  };

  const handleRemoveVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleAddManualVariant = () => {
    const newIdx = formData.variants.length + 1;
    const newVar: ProductVariant = {
      id: `var_${Date.now()}_${newIdx}`,
      sku: `${formData.sku}-VAR${newIdx}`,
      barcode: generateRandomBarcode(),
      title: `Custom Variant ${newIdx}`,
      price: Number(formData.price),
      compareAtPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
      stock: 5,
      options: {},
      image: formData.primaryImage,
      weight: formData.weight,
      chargeTax: formData.chargeTax,
    };
    setFormData(prev => ({
      ...prev,
      hasVariants: true,
      variants: [...prev.variants, newVar],
    }));
  };

  // Multi-location Stock Helpers
  const handleLocationStockChange = (index: number, field: 'quantity' | 'unavailable' | 'committed', val: number) => {
    setFormData(prev => {
      const next = [...prev.locations];
      const loc = { ...next[index] };
      const numVal = Math.max(0, val);
      loc[field] = numVal;

      const onHand = Number(loc.quantity) || 0;
      const unavail = Number(loc.unavailable) || 0;
      const comm = Number(loc.committed) || 0;
      loc.onHand = onHand;
      loc.available = Math.max(0, onHand - unavail - comm);

      next[index] = loc;
      const totalStock = next.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
      return { ...prev, locations: next, stock: totalStock };
    });
  };

  // Spec Matrix Change
  const handleSpecChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value,
      },
    }));
  };

  // Custom Specs Helpers
  const handleAddCustomSpec = () => {
    setFormData(prev => ({
      ...prev,
      customSpecs: [...prev.customSpecs, { key: '', value: '' }],
    }));
  };

  const handleCustomSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    setFormData(prev => {
      const next = [...prev.customSpecs];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, customSpecs: next };
    });
  };

  const handleRemoveCustomSpec = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customSpecs: prev.customSpecs.filter((_, i) => i !== index),
    }));
  };

  // Save Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      if (mode === 'reseller' && (!formData.title.trim() || !formData.sku.trim() || !formData.description.trim() ||
          !formData.categoryId || !formData.brandId || !Number.isFinite(Number(formData.price)) || Number(formData.price) <= 0)) {
        throw new Error('Complete the product title, SKU, full description, category, brand, and a price greater than zero.');
      }
      // 1. Validate Variant SKUs
      if (formData.hasVariants && formData.variants.length > 0) {
        const variantSkus = new Set<string>();
        for (const v of formData.variants) {
          if (!v.sku?.trim()) {
            throw new Error(`Variant "${v.title}" is missing a SKU.`);
          }
          const upper = v.sku.trim().toUpperCase();
          if (variantSkus.has(upper)) {
            throw new Error(`Duplicate variant SKU detected: ${v.sku}`);
          }
          variantSkus.add(upper);
        }
      }

      // 2. Validate Weight & Dimensions
      if (formData.weight !== undefined && Number(formData.weight) < 0) {
        throw new Error('Product weight cannot be negative.');
      }

      // 3. Compile Specs
      const finalSpecs: Record<string, string> = { ...formData.specifications };
      formData.customSpecs.forEach(cs => {
        if (cs.key.trim() && cs.value.trim()) {
          finalSpecs[cs.key.trim()] = cs.value.trim();
        }
      });
      if (formData.condition) finalSpecs['Condition'] = formData.condition;
      if (formData.warranty) finalSpecs['Warranty'] = formData.warranty;

      const activeCats = categories.length > 0 ? categories : [];
      const activeBrands = brands.length > 0 ? brands : [];
      const matchedCat = activeCats.find(c => c.id === formData.categoryId);
      const matchedBrand = activeBrands.find(b => b.id === formData.brandId);

      const isPartner = mode === 'reseller' || formData.sellerType === 'RESELLER';
      const matchedPartner = mode === 'reseller' ? resellers[0] : isPartner ? resellers.find(r => r.id === formData.resellerId) : null;
      const selectedHub = WAREHOUSE_LOCATIONS.find(w => w.id === formData.warehouseLocation) || WAREHOUSE_LOCATIONS[0];

      const stockVal = formData.hasVariants && formData.variants.length > 0
        ? formData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : (Number(formData.stock) || 0);

      const origP = Number(formData.originalPrice || formData.price);
      const computedDiscount = origP > Number(formData.price)
        ? Math.round(((origP - Number(formData.price)) / origP) * 100)
        : 0;

      const payload = {
        title: formData.title,
        name: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        sku: formData.sku.trim(),
        barcode: formData.barcode?.trim() || undefined,
        shortDescription: formData.shortDescription,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: origP,
        costPrice: Number(formData.costPrice || (formData.price * 0.8)),
        discountPercentage: computedDiscount,
        chargeTax: Boolean(formData.chargeTax),
        unitPrice: formData.unitPrice ? Number(formData.unitPrice) : undefined,
        unitMeasure: formData.unitMeasure || undefined,
        stock: stockVal,
        lowStockThreshold: Number(formData.lowStockThreshold || 5),
        inventoryTracked: Boolean(formData.inventoryTracked),
        allowBackorder: Boolean(formData.allowBackorder),
        categoryId: formData.categoryId,
        categoryName: matchedCat?.name || formData.categoryName,
        brandId: formData.brandId,
        brandName: matchedBrand?.name || formData.brandName,
        primaryImage: formData.primaryImage,
        images: formData.images.length > 0 ? formData.images : [formData.primaryImage],
        thumbnail: formData.primaryImage,
        isPhysical: Boolean(formData.isPhysical),
        weight: formData.weight ? Number(formData.weight) : undefined,
        dimensions: formData.dimensions,
        hsCode: formData.hsCode || undefined,
        collections: formData.collections,
        tags: formData.tags,
        sellerType: mode === 'reseller' ? 'RESELLER' : formData.sellerType,
        resellerId: isPartner ? (matchedPartner?.id || formData.resellerId || undefined) : undefined,
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
          ...finalSpecs,
          warrantyYears: Number(formData.warrantyYears || 3),
          condition: formData.condition,
        },
        warranty: formData.warranty || `${formData.warrantyYears} Years Official Manufacturer Warranty`,
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
        status: formData.status,
        isActive: formData.status === 'ACTIVE',
      };

      if (isEditing && product) {
        await ApiClient.put(mode === 'reseller' ? `/reseller/products/${product.id}` : `/admin/products/${product.id}`, payload,
          { token, ...(mode === 'reseller' ? { params: { resellerCode } } : {}) });
      } else {
        await ApiClient.post(mode === 'reseller' ? '/reseller/products' : '/admin/products', payload,
          { token, ...(mode === 'reseller' ? { params: { resellerCode } } : {}) });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const MODAL_STEPS: { id: AdminModalStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'basic', label: '1. Basic Info', icon: Layers },
    { id: 'organization', label: '2. Organization', icon: Tag },
    { id: 'media', label: '3. Media Gallery', icon: ImageIcon },
    { id: 'pricing', label: '4. Pricing & Tax', icon: DollarSign },
    { id: 'inventory', label: '5. Inventory & Hubs', icon: Boxes },
    { id: 'shipping', label: '6. Shipping & Logistics', icon: Truck },
    { id: 'specs', label: '7. Specifications', icon: Cpu },
    { id: 'variants', label: '8. Variants Matrix', icon: Sparkles },
    ...(mode === 'admin' ? [{ id: 'status' as AdminModalStep, label: '9. Status & Publishing', icon: ShieldCheck }] : []),
  ];

  const currentStepIndex = MODAL_STEPS.findIndex(s => s.id === activeModalStep);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl w-full max-w-6xl h-[94vh] max-h-[900px] shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {isEditing ? 'Edit Hardware Product' : 'Add New Hardware SKU'}
                </h2>
                <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {configuredSpecsCount} Specs Configured
                </span>
                {formData.hasVariants && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-tech-cyan border border-blue-200 dark:border-blue-900">
                    {formData.variants.length} Variants Active
                  </span>
                )}
                {mode === 'admin' ? <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  formData.status === 'ACTIVE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                  {formData.status}
                </span> : <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Admin review required</span>}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === 'reseller' ? 'Build a complete hardware listing. New and edited SKUs go to admin review.' : 'Multi-SKU catalog configuration, UAE tax toggles, inventory locations, and specifications'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 9-Step Navigation Bar */}
        <div className="flex items-center gap-1.5 px-6 py-2 bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 overflow-x-auto">
          {MODAL_STEPS.map(step => {
            const Icon = step.icon;
            const isActive = activeModalStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveModalStep(step.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {formError && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

            {/* TAB 1: BASIC INFORMATION */}
            {activeModalStep === 'basic' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Basic Product Information & Taxonomy
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Product Title / Commercial Model Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HP ProBook 460 G11 Intel Core Ultra 5 16.1 FHD BL ENG DOS"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Base SKU (Stock Keeping Unit) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, sku: generateRandomSku(formData.categoryId) })}
                            className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Randomize</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="e.g. NX-HP-PB460-BASE"
                          value={formData.sku}
                          onChange={e => setFormData({ ...formData, sku: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Barcode (EAN-13 / GTIN / UPC)
                          </label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, barcode: generateRandomBarcode() })}
                            className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Generate EAN</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. 729183920192"
                          value={formData.barcode}
                          onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Hardware Category
                        </label>
                        <select
                          value={formData.categoryId}
                          onChange={e => {
                            const cat = categories.find(c => c.id === e.target.value);
                            setFormData({
                              ...formData,
                              categoryId: e.target.value,
                              categoryName: cat?.name || formData.categoryName,
                            });
                          }}
                          className="w-full bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Brand / Manufacturer
                        </label>
                        <select
                          value={formData.brandId}
                          onChange={e => {
                            const b = brands.find(brand => brand.id === e.target.value);
                            setFormData({
                              ...formData,
                              brandId: e.target.value,
                              brandName: b?.name || formData.brandName,
                            });
                          }}
                          className="w-full bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                        >
                          {brands.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Short Commercial Description
                      </label>
                      <input
                        type="text"
                        placeholder="Brief summary for catalog card teasers and search previews"
                        value={formData.shortDescription}
                        onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Technical Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Detailed technical overview, system architecture, enterprise workload performance..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ORGANIZATION (COLLECTIONS & TAGS) */}
            {activeModalStep === 'organization' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Collections Section */}
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Collections Assignment
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign this product to one or more storefront collections for targeted browsing and promotions.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add custom collection name..."
                      value={collectionInput}
                      onChange={e => setCollectionInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCollection(collectionInput);
                        }
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCollection(collectionInput)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Collection
                    </button>
                  </div>

                  {/* Assigned Collections Chips */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Assigned Collections:</div>
                    <div className="flex flex-wrap gap-2">
                      {formData.collections.map(col => (
                        <span
                          key={col}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        >
                          <span>{col}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCollection(col)}
                            className="hover:text-red-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Quick Suggested Collections */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-[11px] font-semibold text-slate-500 mb-2">Quick Add Suggestions:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_COLLECTIONS.map(col => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => handleAddCollection(col)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                          + {col}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Tag-Chip Input Section */}
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Interactive Product Tag Chips
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Type a tag name and press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">,</kbd> to add. Tags power facet filtering and search auto-complete.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type tag (e.g. Silver, ProBook 460 G11, Intel Core Ultra 5)..."
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(tagInput)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Tag
                    </button>
                  </div>

                  {/* Active Tags Chips */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                      Configured Tags ({formData.tags.length}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-tech-cyan border border-blue-200 dark:border-blue-900"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Popular Tags Quick Suggestions */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-[11px] font-semibold text-slate-500 mb-2">Popular Catalog Tags:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_TAGS.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-tech-cyan transition-colors"
                        >
                          + #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MEDIA GALLERY */}
            {activeModalStep === 'media' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Multi-Image Gallery & Primary Display
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add multiple high-resolution product photos. Set a primary image for storefront cards and listings.
                  </p>

                  {/* Add New Image Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Paste image URL (HTTPS, PNG, JPG, WebP)..."
                      value={newImageUrl}
                      onChange={e => {
                        const sanitized = e.target.value.replace(/[<>'"]/g, '');
                        setNewImageUrl(sanitized);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImage(newImageUrl);
                        }
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddImage(newImageUrl)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Add Image
                    </button>
                  </div>

                  {/* Gallery Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                    {formData.images.map((img, idx) => {
                      const isPrimary = formData.primaryImage === img;
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                            isPrimary
                              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-md'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 relative">
                            <img
                              src={getSafeImageUrl(img)}
                              alt={`Product ${idx}`}
                              className="max-h-full max-w-full object-contain"
                              onError={(e: any) => {
                                e.target.onerror = null;
                                e.target.src = DEFAULT_FALLBACK_IMAGE;
                              }}
                            />
                            {isPrimary && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-md uppercase">
                                Primary
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-mono text-slate-400 truncate" title={img}>
                            {img}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            {!isPrimary ? (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(img)}
                                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-bold"
                              >
                                Set as Primary
                              </button>
                            ) : (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Active Primary
                              </span>
                            )}

                            {formData.images.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="text-slate-400 hover:text-red-500 p-1"
                                title="Delete Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Visual Presets */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-[11px] font-semibold text-slate-500 mb-2">Add Preset Hardware Images:</div>
                    <div className="flex flex-wrap gap-2">
                      {HARDWARE_IMAGE_PRESETS.map((preset, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAddImage(preset.url)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-600 hover:text-white transition-all"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PRICING & TAX */}
            {activeModalStep === 'pricing' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Commercial Pricing & Profit Margins
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Base Selling Price (AED) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Compare-At / Retail Price (AED)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.originalPrice}
                        onChange={e => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Cost Price per Unit (AED)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.costPrice}
                        onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Margin & Discount Badge */}
                  <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Gross Margin: </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formData.price > 0 ? Math.round(((formData.price - formData.costPrice) / formData.price) * 100) : 0}%
                      </span>
                      <span className="text-slate-400 ml-2">
                        ({formatPrice(Math.max(0, formData.price - formData.costPrice))} profit)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Discount Strike: </span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-300">
                        {formData.originalPrice > formData.price
                          ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
                          : 0}% OFF
                      </span>
                    </div>
                  </div>
                </div>

                {/* UAE 5% VAT Charge Tax Toggle */}
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                        <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Charge UAE 5% VAT on this Product</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        When enabled, 5% UAE VAT will be calculated on cart and checkout totals. Toggle off for tax-exempt enterprise contracts or zero-rated exports.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formData.chargeTax}
                        onChange={e => setFormData({ ...formData, chargeTax: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                    </label>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500">
                    Status:{' '}
                    <span className={formData.chargeTax ? 'text-purple-600 font-bold' : 'text-amber-500 font-bold'}>
                      {formData.chargeTax ? '✓ Taxable (5% UAE VAT Calculated)' : '⚠ Tax Exempt (0% VAT Charged)'}
                    </span>
                  </div>
                </div>

                {/* Unit Pricing Section */}
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Unit Pricing Specification</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Display price per standard unit of measurement (e.g. per piece, per kg, per meter, per license).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Unit Price (AED)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={formData.unitPrice || ''}
                        onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Unit of Measure
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. unit, piece, kg, meter, license, pack"
                        value={formData.unitMeasure}
                        onChange={e => setFormData({ ...formData, unitMeasure: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {formData.unitPrice && formData.unitMeasure && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
                      Storefront Customer Preview: <span className="font-bold text-purple-600 dark:text-purple-400">{formatPrice(formData.unitPrice)} / {formData.unitMeasure}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: INVENTORY & LOCATIONS */}
            {activeModalStep === 'inventory' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Inventory Policies */}
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <Boxes className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Inventory Tracking & Backorder Policy
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Track Inventory Toggle */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Track Inventory</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Deduct stock on purchase & protect against overselling</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.inventoryTracked}
                        onChange={e => setFormData({ ...formData, inventoryTracked: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                    </div>

                    {/* Allow Backorders Toggle */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Sell When Out of Stock (Backorders)</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Allow customer checkout even if stock is 0</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.allowBackorder}
                        onChange={e => setFormData({ ...formData, allowBackorder: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Total Aggregated Stock Quantity (Units)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.lowStockThreshold}
                        onChange={e => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value, 10) || 0 })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Location Breakdown Table */}
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Multi-Location Stock Hubs Breakdown
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage unavailable, committed, and total on-hand quantities across UAE logistics centers. Available = On-Hand - (Unavailable + Committed).
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 text-[10px] font-bold text-slate-500 uppercase">
                          <th className="py-2.5 px-3">Location Node</th>
                          <th className="py-2.5 px-3">City</th>
                          <th className="py-2.5 px-3">Unavailable</th>
                          <th className="py-2.5 px-3">Committed</th>
                          <th className="py-2.5 px-3">Available</th>
                          <th className="py-2.5 px-3">Total On-Hand</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {formData.locations.map((loc, idx) => (
                          <tr key={loc.locationId} className="hover:bg-slate-100/40 dark:hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-semibold">{loc.locationName}</td>
                            <td className="py-2.5 px-3 text-slate-500">{loc.city}</td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                value={loc.unavailable || 0}
                                onChange={e => handleLocationStockChange(idx, 'unavailable', parseInt(e.target.value, 10) || 0)}
                                className="w-20 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-mono"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                value={loc.committed || 0}
                                onChange={e => handleLocationStockChange(idx, 'committed', parseInt(e.target.value, 10) || 0)}
                                className="w-20 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-mono"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {loc.available ?? Math.max(0, (loc.quantity || 0) - (loc.unavailable || 0) - (loc.committed || 0))}
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                value={loc.quantity || 0}
                                onChange={e => handleLocationStockChange(idx, 'quantity', parseInt(e.target.value, 10) || 0)}
                                className="w-20 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 font-mono font-bold"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SHIPPING & LOGISTICS */}
            {activeModalStep === 'shipping' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Physical Product & Freight Logistics
                    </h3>
                  </div>

                  {/* Physical vs Digital Toggle */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Physical Hardware Product</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Toggle off if this item is a digital license or software download (no physical shipping required)</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isPhysical}
                      onChange={e => setFormData({ ...formData, isPhysical: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>

                  {formData.isPhysical && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Product Net Weight (kg)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.weight || ''}
                            onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g. 1.74"
                            className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            HS Tariff Code (GCC Harmonized System)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 8471.30.01 (Laptops) or 8471.70.00 (Storage)"
                            value={formData.hsCode}
                            onChange={e => setFormData({ ...formData, hsCode: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-mono font-bold"
                          />
                        </div>
                      </div>

                      {/* Package Dimensions */}
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Package Shipping Dimensions (L × W × H)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Length</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.dimensions.length}
                              onChange={e => setFormData({
                                ...formData,
                                dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Width</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.dimensions.width}
                              onChange={e => setFormData({
                                ...formData,
                                dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Height</label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={formData.dimensions.height}
                              onChange={e => setFormData({
                                ...formData,
                                dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) || 0 }
                              })}
                              className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Unit</label>
                            <select
                              value={formData.dimensions.unit}
                              onChange={e => setFormData({
                                ...formData,
                                dimensions: { ...formData.dimensions, unit: e.target.value as 'cm' | 'in' }
                              })}
                              className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                            >
                              <option value="cm">cm (Centimeters)</option>
                              <option value="in">in (Inches)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: SPECIFICATIONS (WITH LAPTOP & ENTERPRISE HDD FIELDS) */}
            {activeModalStep === 'specs' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Technical Specifications & Architecture
                    </h3>
                  </div>

                  {/* Spec Groups Navigation */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {SPECIFICATION_GROUPS.map(group => {
                      const isActive = activeSpecTab === group.id;
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => setActiveSpecTab(group.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {group.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Spec Fields for Active Group */}
                  {(() => {
                    const currentGroup = SPECIFICATION_GROUPS.find(g => g.id === activeSpecTab) || SPECIFICATION_GROUPS[0];
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                        {currentGroup?.fields.map(specField => {
                          const presets = specField.presetKey
                            ? SPECIFICATION_PRESETS[specField.presetKey] || []
                            : (SPECIFICATION_PRESETS[specField.key as any] || []);
                          const currentValue = formData.specifications[specField.key] || '';

                          return (
                            <div key={specField.key} className="space-y-1">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={specField.label}>
                                {specField.label}
                              </label>
                              {presets.length > 0 ? (
                                <select
                                  value={currentValue}
                                  onChange={e => handleSpecChange(specField.key, e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                                >
                                  <option value="">-- Select {specField.label} --</option>
                                  {presets.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder={specField.placeholder || `Enter ${specField.label}...`}
                                  value={currentValue}
                                  onChange={e => handleSpecChange(specField.key, e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 font-medium"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Custom Specifications Key-Value Builder */}
                  <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Custom Dynamic Specifications
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomSpec}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Field</span>
                      </button>
                    </div>

                    {formData.customSpecs.map((cs, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Specification Key (e.g. Optical Drive, TPM Chip)"
                          value={cs.key}
                          onChange={e => handleCustomSpecChange(i, 'key', e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                        />
                        <input
                          type="text"
                          placeholder="Specification Value"
                          value={cs.value}
                          onChange={e => handleCustomSpecChange(i, 'value', e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomSpec(i)}
                          className="p-2 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: VARIANTS & MULTI-SKU ENGINE */}
            {activeModalStep === 'variants' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Product Variants & Multi-SKU Engine
                      </h3>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasVariants}
                        onChange={e => setFormData({ ...formData, hasVariants: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Enable Multi-SKU Variants
                      </span>
                    </label>
                  </div>

                  {!formData.hasVariants ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      This product currently uses a single flat SKU (<span className="font-mono font-bold text-purple-600">{formData.sku}</span>).
                      <br />Check &ldquo;Enable Multi-SKU Variants&rdquo; above to configure options such as RAM, Storage, or Color.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Option Definitions Builder */}
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Configured Option Dimensions (RAM, Storage, Color)
                          </div>
                          <button
                            type="button"
                            onClick={handleGenerateVariants}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>⚡ Generate Combinations Matrix</span>
                          </button>
                        </div>

                        {/* Configured Option Dimensions List */}
                        <div className="space-y-3">
                          {formData.variantOptions.map((opt, optIdx) => (
                            <div key={opt.name} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-purple-600 dark:text-purple-400">
                                  Option {optIdx + 1}: {opt.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariantOption(optIdx)}
                                  className="text-slate-400 hover:text-red-500 text-xs"
                                >
                                  Delete Option
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {opt.values.map((v, valIdx) => (
                                  <span
                                    key={valIdx}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                                  >
                                    <span>{v}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOptionValue(optIdx, valIdx)}
                                      className="hover:text-red-500"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add New Option Input */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <input
                            type="text"
                            placeholder="Option Name (e.g. Color)"
                            value={newOptionName}
                            onChange={e => setNewOptionName(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                          />
                          <input
                            type="text"
                            placeholder="Values (comma-separated, e.g. Silver, Space Gray)"
                            value={newOptionValueInput}
                            onChange={e => setNewOptionValueInput(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                          />
                          <button
                            type="button"
                            onClick={handleAddVariantOption}
                            className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
                          >
                            + Add Option Dimension
                          </button>
                        </div>
                      </div>

                      {/* Variants Matrix Table */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Active Variants Matrix ({formData.variants.length} Variants)
                          </div>
                          <button
                            type="button"
                            onClick={handleAddManualVariant}
                            className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                          >
                            + Add Custom Variant Row
                          </button>
                        </div>

                        {formData.variants.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            No variants generated yet. Click &ldquo;⚡ Generate Combinations Matrix&rdquo; above.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-xs text-left bg-white dark:bg-slate-900">
                              <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-500 uppercase">
                                  <th className="py-2.5 px-3">Variant Title</th>
                                  <th className="py-2.5 px-3">Unique SKU *</th>
                                  <th className="py-2.5 px-3">Barcode</th>
                                  <th className="py-2.5 px-3">Price (AED)</th>
                                  <th className="py-2.5 px-3">Stock</th>
                                  <th className="py-2.5 px-3">Tax</th>
                                  <th className="py-2.5 px-3 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {formData.variants.map((v, vIdx) => (
                                  <tr key={v.id || vIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                                      <input
                                        type="text"
                                        value={v.title}
                                        onChange={e => handleUpdateVariant(vIdx, 'title', e.target.value)}
                                        className="w-36 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-semibold"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        required
                                        value={v.sku}
                                        onChange={e => handleUpdateVariant(vIdx, 'sku', e.target.value)}
                                        className="w-36 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono font-bold text-purple-600 dark:text-purple-400"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        value={v.barcode || ''}
                                        onChange={e => handleUpdateVariant(vIdx, 'barcode', e.target.value)}
                                        className="w-28 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono text-[11px]"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={v.price}
                                        onChange={e => handleUpdateVariant(vIdx, 'price', parseFloat(e.target.value) || 0)}
                                        className="w-20 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono font-bold"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={v.stock}
                                        onChange={e => handleUpdateVariant(vIdx, 'stock', parseInt(e.target.value, 10) || 0)}
                                        className="w-16 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 font-mono font-bold"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="checkbox"
                                        checked={v.chargeTax !== false}
                                        onChange={e => handleUpdateVariant(vIdx, 'chargeTax', e.target.checked)}
                                        className="w-4 h-4 text-purple-600 rounded"
                                      />
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariant(vIdx)}
                                        className="p-1 text-slate-400 hover:text-red-500"
                                        title="Remove Variant"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 9: STATUS & PUBLISHING */}
            {activeModalStep === 'status' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Publishing Status, Channel & Governance
                    </h3>
                  </div>

                  {/* Status Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Product Catalog Status
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'ACTIVE', label: 'Active', desc: 'Live in store, visible in search' },
                        { id: 'DRAFT', label: 'Draft', desc: 'Hidden from store customers' },
                        { id: 'ARCHIVED', label: 'Archived', desc: 'Discontinued legacy record' },
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: st.id as any })}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            formData.status === st.id
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-900 dark:text-white">{st.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seller Attribution */}
                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Fulfillment & Distribution Channel
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sellerType: 'ADMIN', resellerId: '', resellerName: '' })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.sellerType === 'ADMIN'
                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="font-bold text-xs">Direct Platform (Official Store)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Fulfilled directly by NexTech JAFZA Hub</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sellerType: 'RESELLER' })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.sellerType === 'RESELLER'
                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <div className="font-bold text-xs">Verified Partner Store (Reseller)</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Allocated to a registered partner merchant</div>
                      </button>
                    </div>

                    {formData.sellerType === 'RESELLER' && (
                      <div className="pt-2">
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Select Partner Reseller
                        </label>
                        <select
                          value={formData.resellerId}
                          onChange={e => {
                            const r = resellers.find(store => store.id === e.target.value);
                            setFormData({
                              ...formData,
                              resellerId: e.target.value,
                              resellerName: r?.displayName || r?.businessName || '',
                              resellerCode: r?.resellerCode || '',
                            });
                          }}
                          className="w-full bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                        >
                          <option value="">-- Choose Partner Merchant --</option>
                          {resellers.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.displayName || r.businessName} ({r.address?.city || (r as any).city || 'UAE'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Condition and Warranty */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Product Condition
                      </label>
                      <select
                        value={formData.condition}
                        onChange={e => setFormData({ ...formData, condition: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                      >
                        {CONDITION_OPTIONS.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Warranty Coverage
                      </label>
                      <select
                        value={formData.warranty}
                        onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                      >
                        {WARRANTY_OPTIONS.map(w => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer with Step Navigation & Save Button */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Section {currentStepIndex + 1} of {MODAL_STEPS.length}:</span>
              <span className="font-bold text-slate-900 dark:text-white">{MODAL_STEPS[currentStepIndex].label}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveModalStep(MODAL_STEPS[currentStepIndex - 1].id)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              {currentStepIndex < MODAL_STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveModalStep(MODAL_STEPS[currentStepIndex + 1].id)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Next Section</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ml-1"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Submitting SKU...' : mode === 'reseller' ? isEditing ? 'Submit Changes for Review' : 'Submit Hardware SKU' : isEditing ? 'Update Hardware Product' : 'Create Hardware SKU'}
                </span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
