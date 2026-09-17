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
} from 'lucide-react';

const WAREHOUSE_LOCATIONS = [
  { id: 'loc_dxb_main', name: 'Dubai Logistics Hub (JAFZA)', city: 'Dubai', code: 'DXB-01' },
  { id: 'loc_deira_tech', name: 'Deira Showroom & Technical Center', city: 'Dubai', code: 'DXB-02' },
  { id: 'loc_auh_hub', name: 'Abu Dhabi Regional Distribution Hub', city: 'Abu Dhabi', code: 'AUH-01' },
  { id: 'loc_shj_depot', name: 'Sharjah Industrial Logistics Depot', city: 'Sharjah', code: 'SHJ-01' },
];

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80';

const HARDWARE_IMAGE_PRESETS = [
  {
    label: 'HP ProBook 460 G11',
    category: 'Laptops',
    catId: 'cat_laptops',
    brand: 'HP',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'ASUS ROG Astral RTX 5090',
    category: 'GPUs',
    catId: 'cat_gpus',
    brand: 'ASUS',
    url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Intel Core Ultra 9 285K',
    category: 'CPUs',
    catId: 'cat_processors',
    brand: 'Intel',
    url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Samsung 990 PRO NVMe 2TB',
    category: 'Storage',
    catId: 'cat_storage',
    brand: 'Samsung',
    url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Corsair Dominator Titanium DDR5',
    category: 'RAM',
    catId: 'cat_ram',
    brand: 'Corsair',
    url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Platinum Server Power Supply',
    category: 'PSUs',
    catId: 'cat_psus',
    brand: 'Seasonic',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
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
  const [activeSpecTab, setActiveSpecTab] = useState<string>('core_platform');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Local helper inputs
  const [tagInput, setTagInput] = useState('');
  const [collectionInput, setCollectionInput] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newOptionName, setNewOptionName] = useState('');

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
      quantity: w.id === 'loc_dxb_main' ? 25 : 0,
      available: w.id === 'loc_dxb_main' ? 25 : 0,
      committed: 0,
      unavailable: 0,
      onHand: w.id === 'loc_dxb_main' ? 25 : 0,
    })),
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

  // Warehouse Multi-Location Stock Change
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

  // Quick Hardware Preset Loader
  const handleApplyPreset = (preset: typeof HARDWARE_IMAGE_PRESETS[0]) => {
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
      <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <svg viewBox={`0 0 ${clean.length * 11 + 16} 38`} className="h-8 text-slate-900 dark:text-slate-100">
          {bars}
        </svg>
        <span className="font-mono text-[11px] font-black tracking-widest text-slate-600 dark:text-slate-300 mt-1">
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
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/products"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors shrink-0 cursor-pointer"
              title="Return to Catalog"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Link href="/admin/products" className="hover:underline">Hardware Catalog</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  {mode === 'edit' ? 'SKU Configuration Studio' : 'New Hardware SKU'}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate mt-0.5">
                {formData.title || (mode === 'edit' ? 'Edit Hardware SKU' : 'Add New Hardware SKU')}
              </h1>
            </div>
          </div>

          {/* Controls: View Mode, Status & Actions */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            {/* View Mode Toggle: All Sections vs Tabs */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View complete document layout"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All Sections</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('tabs')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'tabs'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Focused step-by-step tabs"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabbed</span>
              </button>
            </div>

            {/* Status Selector */}
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className={`text-xs font-bold px-3 py-2 rounded-xl border cursor-pointer focus:outline-none transition-all ${
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
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Discard
            </Link>

            <button
              type="button"
              onClick={() => handleSaveProduct('DRAFT')}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSaveProduct()}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 shrink-0"
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
                  <span className="hidden md:inline text-[10px] opacity-70 font-mono">⌘S</span>
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

                {/* Visual Assets & High-Res Presets */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span>Media Assets & Quick Hardware Presets</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Primary Hero Thumbnail */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Primary Cover Asset
                      </label>
                      <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 relative shadow-sm group">
                        <img
                          src={formData.primaryImage || DEFAULT_FALLBACK_IMAGE}
                          alt="Primary"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-slate-900/80 text-[10px] font-bold text-white backdrop-blur-md flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> Primary Cover
                        </div>
                      </div>
                    </div>

                    {/* Image URL Inputs & Presets */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          Primary Asset Direct URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.primaryImage}
                          onChange={e => setFormData({ ...formData, primaryImage: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* 1-Click Hardware Photography Presets */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> 1-Click Hardware Photo Presets
                          </span>
                          <span className="text-[10px] text-slate-400">Click to apply photo</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {HARDWARE_IMAGE_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleApplyPreset(preset)}
                              className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 transition-all text-left group cursor-pointer shadow-sm"
                            >
                              <div className="aspect-video rounded-lg overflow-hidden mb-1">
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                              <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                {preset.label}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {preset.brand} • {preset.category}
                              </div>
                            </button>
                          ))}
                        </div>
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

              {/* Warehouse Stock Matrix Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Warehouse Facility</th>
                      <th className="py-3 px-4">City / Region</th>
                      <th className="py-3 px-4 text-center">Available</th>
                      <th className="py-3 px-4 text-center">Committed</th>
                      <th className="py-3 px-4 text-center">Unavailable</th>
                      <th className="py-3 px-4 text-right">On Hand Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formData.locations.map((loc, idx) => (
                      <tr key={loc.locationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{loc.locationName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{loc.city}</td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min="0"
                            value={loc.available}
                            onChange={e => handleLocationStockChange(idx, 'available', parseInt(e.target.value, 10) || 0)}
                            className="w-24 mx-auto block bg-slate-50 dark:bg-slate-950 text-center py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-purple-600 dark:text-purple-400"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min="0"
                            value={loc.committed}
                            onChange={e => handleLocationStockChange(idx, 'committed', parseInt(e.target.value, 10) || 0)}
                            className="w-24 mx-auto block bg-slate-50 dark:bg-slate-950 text-center py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="number"
                            min="0"
                            value={loc.unavailable}
                            onChange={e => handleLocationStockChange(idx, 'unavailable', parseInt(e.target.value, 10) || 0)}
                            className="w-24 mx-auto block bg-slate-50 dark:bg-slate-950 text-center py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                          {loc.onHand} units
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warehouse Quick Tools & Low Stock Alert */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => {
                        const updated = prev.locations.map(l => ({
                          ...l,
                          available: l.locationId === 'loc_dxb_main' ? 25 : 0,
                          committed: 0,
                          unavailable: 0,
                          onHand: l.locationId === 'loc_dxb_main' ? 25 : 0,
                          quantity: l.locationId === 'loc_dxb_main' ? 25 : 0,
                        }));
                        return { ...prev, locations: updated, stock: 25 };
                      });
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Consolidate in Dubai JAFZA (25)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => {
                        const updated = prev.locations.map(l => ({
                          ...l,
                          available: 10,
                          committed: 0,
                          unavailable: 0,
                          onHand: 10,
                          quantity: 10,
                        }));
                        return { ...prev, locations: updated, stock: 40 };
                      });
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Distribute 10 to Each Hub (40)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Low-Stock Alert Level:</span>
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
            </div>
          )}

          {/* SECTION 4: TECHNICAL SPECIFICATIONS MATRIX */}
          {(viewMode === 'all' || activeTab === 'specs') && (
            <div id="section-specs" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-600" />
                    <span>Technical Specifications & Hardware Matrix</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Namespaced hardware presets for Laptops, Enterprise HDDs, Core Platforms, and Custom Metafields.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                  {configuredSpecsCount} Active Specs
                </span>
              </div>

              {/* Spec Sub-Categories Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800">
                {SPECIFICATION_GROUPS.map(group => {
                  const isActive = activeSpecTab === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveSpecTab(group.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>

              {/* Spec Fields */}
              {(() => {
                const currentGroup = SPECIFICATION_GROUPS.find(g => g.id === activeSpecTab) || SPECIFICATION_GROUPS[0];
                return (
                  <div className="space-y-4">
                    <div className="text-xs text-slate-500 italic">
                      {currentGroup.description}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {currentGroup.fields.map(field => {
                        const presets = field.presetKey
                          ? SPECIFICATION_PRESETS[field.presetKey] || []
                          : (SPECIFICATION_PRESETS[field.key as any] || []);
                        const currentValue = formData.specifications[field.key] || '';

                        return (
                          <div key={field.key} className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={field.label}>
                              {field.label}
                            </label>
                            {presets.length > 0 ? (
                              <select
                                value={currentValue}
                                onChange={e => handleSpecChange(field.key, e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                              >
                                <option value="">-- Select {field.label} --</option>
                                {presets.map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder={field.placeholder || `Enter ${field.label}...`}
                                value={currentValue}
                                onChange={e => handleSpecChange(field.key, e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-purple-500"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Custom Metafields Builder */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Custom Dynamic Metafields
                    </h3>
                    <p className="text-xs text-slate-500">Define arbitrary hardware parameters not in standard presets</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomSpec}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Metafield
                  </button>
                </div>

                {formData.customSpecs.length > 0 ? (
                  <div className="space-y-3">
                    {formData.customSpecs.map((cs, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Metafield Key (e.g. TPM 2.0 Chip, Heatpipe Config)"
                          value={cs.key}
                          onChange={e => handleCustomSpecChange(i, 'key', e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                        />
                        <input
                          type="text"
                          placeholder="Metafield Value"
                          value={cs.value}
                          onChange={e => handleCustomSpecChange(i, 'value', e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomSpec(i)}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    No custom metafields defined yet.
                  </div>
                )}
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
          {/* SIDEBAR CARD 1: LIVE STOREFRONT PRODUCT CARD PREVIEW */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" /> Live Storefront Card Preview
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                Live Mockup
              </span>
            </div>

            {/* The Actual Mock Product Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden shadow-sm group">
              <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={formData.primaryImage || DEFAULT_FALLBACK_IMAGE}
                  alt={formData.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold tracking-wider uppercase">
                  {formData.brandName || 'Brand'}
                </div>
                {formData.discountPercentage > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold">
                    -{formData.discountPercentage}%
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-sm">
                  {formData.stock > 0 ? `In Stock (${formData.stock})` : 'Out of Stock'}
                </div>
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-center gap-1 text-amber-400 text-xs">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-[10px] text-slate-400 font-bold ml-1">5.0 (Brand New)</span>
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                  {formData.title || 'HP ProBook 460 G11 Business Laptop'}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-base font-black font-mono text-purple-600 dark:text-purple-400">
                    {formatPrice(formData.price)}
                  </span>
                  {formData.originalPrice > formData.price && (
                    <span className="text-xs line-through text-slate-400 font-mono">
                      {formatPrice(formData.originalPrice)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {formData.chargeTax ? '(incl. VAT)' : '(0% Tax)'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Warranty:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                    {formData.warrantyYears} Years Official
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
