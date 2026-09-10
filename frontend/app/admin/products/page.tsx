'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice, formatDate } from '@/lib/utils';
import { Product, ProductApprovalStatus, Category, Brand, SellerType } from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_BRANDS } from '@/lib/default-taxonomy';
import {
  SPECIFICATION_FIELDS,
  SPECIFICATION_PRESETS,
  SPECIFICATION_GROUPS,
} from '@/lib/specification-presets';
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  ShieldCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Boxes,
  Eye,
  Check,
  Cpu,
  Zap,
  Sliders,
  Sparkles,
  Database,
  HardDrive,
  Monitor,
  Layers,
  Settings,
  Building2,
  MapPin,
  RefreshCw,
  Percent,
  Barcode,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Tag,
  DollarSign
} from 'lucide-react';
import { Reseller } from '@/types';

// Standard Enterprise Partner Stores Pre-configurations
const DEFAULT_PARTNER_STORES = [
  { id: 'reseller_comnet_101', businessName: 'ComNet Solutions LLC', displayName: 'ComNet Enterprise Systems', resellerCode: 'comnet101', city: 'Dubai', commissionRate: 8 },
  { id: 'reseller_alfalasi', businessName: 'Al-Falasi Technology Systems', displayName: 'Al-Falasi Tech Partner', resellerCode: 'alfalasi', city: 'Abu Dhabi', commissionRate: 7.5 },
  { id: 'reseller_apex', businessName: 'Apex Silicon Hardware', displayName: 'Apex Systems Hub', resellerCode: 'apexsilicon', city: 'Dubai', commissionRate: 8.5 },
  { id: 'reseller_hypertech', businessName: 'HyperTech Middle East', displayName: 'HyperTech Commercial', resellerCode: 'hypertech', city: 'Sharjah', commissionRate: 9 },
];

// Logistics and Fulfillment Warehousing Nodes
const WAREHOUSE_LOCATIONS = [
  { id: 'loc_dxb_main', name: 'Dubai Logistics Hub (JAFZA)', city: 'Dubai', code: 'DXB-01' },
  { id: 'loc_deira_tech', name: 'Deira Showroom & Technical Center', city: 'Dubai', code: 'DXB-02' },
  { id: 'loc_auh_hub', name: 'Abu Dhabi Regional Distribution Hub', city: 'Abu Dhabi', code: 'AUH-01' },
  { id: 'loc_shj_depot', name: 'Sharjah Industrial Logistics Depot', city: 'Sharjah', code: 'SHJ-01' },
  { id: 'loc_partner_direct', name: 'Partner Store Direct Inventory Depot', city: 'Partner Local', code: 'PTR-01' },
];

// Quick Component Visual Presets
const HARDWARE_IMAGE_PRESETS = [
  { label: 'Intel Core i9 CPU', category: 'CPUs', url: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80' },
  { label: 'ASUS ROG RTX 4090', category: 'GPUs', url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80' },
  { label: 'ROG Gaming Motherboard', category: 'Motherboards', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80' },
  { label: 'Corsair DDR5 Memory Kit', category: 'RAM', url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80' },
  { label: 'Samsung 990 Pro NVMe SSD', category: 'Storage', url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Corsair 1000W Platinum PSU', category: 'PSUs', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80' },
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

interface ProductFormData {
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
  stock: number;
  lowStockThreshold: number;
  warehouseLocation: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  primaryImage: string;
  sellerType: SellerType;
  resellerId: string;
  resellerName: string;
  resellerCode: string;
  partnerSkuRef: string;
  socket: string;
  tdp: number;
  formFactor: string;
  specifications: Record<string, string>;
  customSpecs: { key: string; value: string }[];
}

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(DEFAULT_BRANDS);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [activeModalStep, setActiveModalStep] = useState<'general' | 'partner' | 'media' | 'specs'>('general');
  const [activeSpecTab, setActiveSpecTab] = useState<string>('core');

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
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
    stock: 25,
    lowStockThreshold: 5,
    warehouseLocation: 'loc_dxb_main',
    categoryId: 'cat_processors',
    categoryName: 'Processors (CPUs)',
    brandId: 'brand_asus',
    brandName: 'ASUS',
    primaryImage: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    sellerType: 'ADMIN',
    resellerId: '',
    resellerName: '',
    resellerCode: '',
    partnerSkuRef: '',
    socket: 'LGA1700',
    tdp: 125,
    formFactor: 'ATX',
    specifications: {},
    customSpecs: [],
  });

  const fetchData = async () => {
    try {
      const fetchOpts = token ? { token } : {};
      const [prodRes, catRes, brandRes, resellerRes] = await Promise.all([
        token
          ? ApiClient.get<Product[]>('/admin/products?limit=100', { token }).catch(() => [])
          : Promise.resolve([]),
        ApiClient.get<Category[]>('/admin/categories', fetchOpts)
          .catch(() => ApiClient.get<Category[]>('/products/categories').catch(() => [])),
        ApiClient.get<Brand[]>('/admin/brands', fetchOpts)
          .catch(() => ApiClient.get<Brand[]>('/products/brands').catch(() => [])),
        token
          ? ApiClient.get<Reseller[]>('/admin/resellers', { token }).catch(() => [])
          : Promise.resolve([]),
      ]);
      if (prodRes && Array.isArray(prodRes) && prodRes.length > 0) {
        setProducts(prodRes);
      }
      if (catRes && Array.isArray(catRes) && catRes.length > 0) {
        setCategories(catRes);
      }
      if (brandRes && Array.isArray(brandRes) && brandRes.length > 0) {
        setBrands(brandRes);
      }
      if (resellerRes && Array.isArray(resellerRes) && resellerRes.length > 0) {
        setResellers(resellerRes);
      }
    } catch (err) {
      console.error('Failed to load admin products or taxonomy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Dynamic Options & Inline Creators State
  const [warehouseNodes, setWarehouseNodes] = useState(WAREHOUSE_LOCATIONS);
  const [conditionOptions, setConditionOptions] = useState<string[]>(CONDITION_OPTIONS);
  const [warrantyOptions, setWarrantyOptions] = useState<string[]>(WARRANTY_OPTIONS);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isSavingBrand, setIsSavingBrand] = useState(false);

  const [isCustomCondition, setIsCustomCondition] = useState(false);
  const [customConditionValue, setCustomConditionValue] = useState('');

  const [isCustomWarranty, setIsCustomWarranty] = useState(false);
  const [customWarrantyValue, setCustomWarrantyValue] = useState('');

  const [isAddingReseller, setIsAddingReseller] = useState(false);
  const [newResellerName, setNewResellerName] = useState('');
  const [newResellerCode, setNewResellerCode] = useState('');
  const [newResellerCity, setNewResellerCity] = useState('');
  const [isSavingReseller, setIsSavingReseller] = useState(false);

  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);
  const [newWhName, setNewWhName] = useState('');
  const [newWhCode, setNewWhCode] = useState('');
  const [newWhCity, setNewWhCity] = useState('');

  // 1. Create New Category and immediately select
  const handleQuickAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSavingCategory(true);
    try {
      const clean = newCatName.trim();
      const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const created = await ApiClient.post<Category>('/admin/categories', {
        name: clean,
        slug,
      }, token ? { token } : {});

      const newCat: Category = {
        id: created?.id || `cat_${Date.now()}`,
        name: created?.name || clean,
        slug: created?.slug || slug,
        productCount: 0,
        isActive: true,
      };

      setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat]);
      setFormData(prev => ({
        ...prev,
        categoryId: newCat.id,
        categoryName: newCat.name,
        sku: generateRandomSku(newCat.id),
        specifications: {
          ...prev.specifications,
          'Product Category': newCat.name,
        },
      }));
      setNewCatName('');
      setIsAddingCategory(false);
    } catch (err: any) {
      console.warn('Backend category create error, using local fallback:', err);
      const fallbackCat: Category = {
        id: `cat_${Date.now()}`,
        name: newCatName.trim(),
        slug: newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        productCount: 0,
        isActive: true,
      };
      setCategories(prev => [...prev, fallbackCat]);
      setFormData(prev => ({
        ...prev,
        categoryId: fallbackCat.id,
        categoryName: fallbackCat.name,
        sku: generateRandomSku(fallbackCat.id),
        specifications: {
          ...prev.specifications,
          'Product Category': fallbackCat.name,
        },
      }));
      setNewCatName('');
      setIsAddingCategory(false);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // 2. Create New Brand and immediately select
  const handleQuickAddBrand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newBrandName.trim()) return;
    setIsSavingBrand(true);
    try {
      const clean = newBrandName.trim();
      const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const created = await ApiClient.post<Brand>('/admin/brands', {
        name: clean,
        slug,
      }, token ? { token } : {});

      const newB: Brand = {
        id: created?.id || `brand_${Date.now()}`,
        name: created?.name || clean,
        slug: created?.slug || slug,
        productCount: 0,
        isActive: true,
      };

      setBrands(prev => [...prev.filter(b => b.id !== newB.id), newB]);
      setFormData(prev => ({
        ...prev,
        brandId: newB.id,
        brandName: newB.name,
        specifications: {
          ...prev.specifications,
          Brand: newB.name,
        },
      }));
      setNewBrandName('');
      setIsAddingBrand(false);
    } catch (err: any) {
      console.warn('Backend brand create error, using fallback:', err);
      const fallbackB: Brand = {
        id: `brand_${Date.now()}`,
        name: newBrandName.trim(),
        slug: newBrandName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        productCount: 0,
        isActive: true,
      };
      setBrands(prev => [...prev, fallbackB]);
      setFormData(prev => ({
        ...prev,
        brandId: fallbackB.id,
        brandName: fallbackB.name,
        specifications: {
          ...prev.specifications,
          Brand: fallbackB.name,
        },
      }));
      setNewBrandName('');
      setIsAddingBrand(false);
    } finally {
      setIsSavingBrand(false);
    }
  };

  // 3. Custom Condition
  const handleApplyCustomCondition = (val: string) => {
    setCustomConditionValue(val);
    if (!conditionOptions.includes(val) && val.trim()) {
      setConditionOptions(prev => [...prev, val.trim()]);
    }
    setFormData(prev => ({
      ...prev,
      condition: val,
      specifications: {
        ...prev.specifications,
        Condition: val,
      },
    }));
  };

  // 4. Custom Warranty
  const handleApplyCustomWarranty = (val: string) => {
    setCustomWarrantyValue(val);
    if (!warrantyOptions.includes(val) && val.trim()) {
      setWarrantyOptions(prev => [...prev, val.trim()]);
    }
    const match = val.match(/(\d+)\s*Year/i);
    const yrs = match ? parseInt(match[1], 10) : 3;
    setFormData(prev => ({
      ...prev,
      warranty: val,
      warrantyYears: yrs,
      specifications: {
        ...prev.specifications,
        Warranty: val,
      },
    }));
  };

  // 5. Create New Partner Store (Reseller)
  const handleQuickAddReseller = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newResellerName.trim()) return;
    setIsSavingReseller(true);
    try {
      const code = (newResellerCode.trim() || newResellerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')).toLowerCase();
      const city = newResellerCity.trim() || 'Dubai, UAE';
      const created = await ApiClient.post<any>('/admin/resellers', {
        businessName: newResellerName.trim(),
        displayName: newResellerName.trim(),
        resellerCode: code,
        address: { city, country: 'United Arab Emirates' },
        commissionRate: 8,
      }, token ? { token } : {});

      const storeObj: any = created?.reseller || created?.data?.reseller || created?.data || created || {
        id: `reseller_${Date.now()}`,
        businessName: newResellerName.trim(),
        displayName: newResellerName.trim(),
        resellerCode: code,
        city,
      };

      setResellers(prev => [...prev, storeObj]);
      setFormData(prev => ({
        ...prev,
        sellerType: 'RESELLER',
        resellerId: storeObj.id,
        resellerName: storeObj.displayName || storeObj.businessName,
        resellerCode: storeObj.resellerCode || code,
      }));
      setNewResellerName('');
      setNewResellerCode('');
      setNewResellerCity('');
      setIsAddingReseller(false);
    } catch (err: any) {
      console.warn('Backend reseller create error, using fallback:', err);
      const code = (newResellerCode.trim() || newResellerName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')).toLowerCase();
      const fallbackStore = {
        id: `reseller_${Date.now()}`,
        businessName: newResellerName.trim(),
        displayName: newResellerName.trim(),
        resellerCode: code,
        city: newResellerCity.trim() || 'Dubai',
      };
      setResellers(prev => [...prev, fallbackStore as any]);
      setFormData(prev => ({
        ...prev,
        sellerType: 'RESELLER',
        resellerId: fallbackStore.id,
        resellerName: fallbackStore.displayName,
        resellerCode: fallbackStore.resellerCode,
      }));
      setNewResellerName('');
      setNewResellerCode('');
      setNewResellerCity('');
      setIsAddingReseller(false);
    } finally {
      setIsSavingReseller(false);
    }
  };

  // 6. Create New Warehouse Node
  const handleQuickAddWarehouse = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newWhName.trim()) return;
    const newId = `loc_${Date.now()}`;
    const newWh = {
      id: newId,
      name: newWhName.trim(),
      code: newWhCode.trim() || `WH-${Math.floor(10 + Math.random() * 90)}`,
      city: newWhCity.trim() || 'UAE Regional Depot',
    };
    setWarehouseNodes(prev => [...prev, newWh]);
    setFormData(prev => ({ ...prev, warehouseLocation: newId }));
    setNewWhName('');
    setNewWhCode('');
    setNewWhCity('');
    setIsAddingWarehouse(false);
  };

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
    const code = prefixMap[catId || formData.categoryId] || 'SKU';
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `NX-${code}-${rand}`;
  };

  const generateRandomBarcode = () => {
    return `729${Math.floor(100000000 + Math.random() * 900000000)}`;
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedProduct(null);
    setFormError('');
    setActiveModalStep('general');
    setActiveSpecTab('core');
    const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const activeBrands = brands.length > 0 ? brands : DEFAULT_BRANDS;
    const initialCat = activeCats[0];
    const initialBrand = activeBrands[0];
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
      price: 999,
      originalPrice: 1199,
      costPrice: 799,
      discountPercentage: 16.7,
      stock: 25,
      lowStockThreshold: 5,
      warehouseLocation: 'loc_dxb_main',
      categoryId: initialCat?.id || 'cat_processors',
      categoryName: initialCat?.name || 'Processors (CPUs)',
      brandId: initialBrand?.id || 'brand_asus',
      brandName: initialBrand?.name || 'ASUS',
      primaryImage: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
      sellerType: 'ADMIN',
      resellerId: '',
      resellerName: '',
      resellerCode: '',
      partnerSkuRef: '',
      socket: 'LGA1700',
      tdp: 125,
      formFactor: 'ATX',
      specifications: {
        Condition: 'Brand New (Factory Sealed)',
        'Product Category': initialCat?.name || 'Processors (CPUs)',
        'Processor Brand': 'Intel',
        'Socket Type': 'LGA1700',
        'Form Factor': 'ATX',
        Warranty: '3 Years Official Manufacturer Warranty',
      },
      customSpecs: [],
    });
    setIsAddingCategory(false);
    setIsAddingBrand(false);
    setIsCustomCondition(false);
    setIsCustomWarranty(false);
    setIsAddingReseller(false);
    setIsAddingWarehouse(false);
    setNewCatName('');
    setNewBrandName('');
    setNewResellerName('');
    setNewResellerCode('');
    setNewResellerCity('');
    setNewWhName('');
    setNewWhCode('');
    setNewWhCity('');

    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setIsEditing(true);
    setSelectedProduct(prod);
    setFormError('');
    setActiveModalStep('general');
    setActiveSpecTab('core');
    setIsAddingCategory(false);
    setIsAddingBrand(false);
    setIsCustomCondition(false);
    setIsCustomWarranty(false);
    setIsAddingReseller(false);
    setIsAddingWarehouse(false);

    const loadedSpecs: Record<string, string> = { ...(prod.specifications || {}) };
    if (prod.specs?.socket && !loadedSpecs['Socket Type']) loadedSpecs['Socket Type'] = prod.specs.socket;
    if (prod.specs?.formFactor && !loadedSpecs['Form Factor']) loadedSpecs['Form Factor'] = prod.specs.formFactor;
    if (prod.specs?.warrantyYears && !loadedSpecs['Warranty']) loadedSpecs['Warranty'] = `${prod.specs.warrantyYears} Years Official Manufacturer Warranty`;

    const standardKeys = new Set<string>(SPECIFICATION_FIELDS);
    const customSpecsList: { key: string; value: string }[] = [];
    Object.entries(loadedSpecs).forEach(([k, v]) => {
      if (!standardKeys.has(k)) {
        customSpecsList.push({ key: k, value: String(v) });
      }
    });

    const origP = prod.originalPrice || prod.compareAtPrice || prod.price;
    const computedDiscount = origP > prod.price ? Math.round(((origP - prod.price) / origP) * 100) : 0;

    const cond = loadedSpecs['Condition'] || 'Brand New (Factory Sealed)';
    if (!conditionOptions.includes(cond)) {
      setConditionOptions(prev => [...prev, cond]);
    }
    const war = prod.warranty || loadedSpecs['Warranty'] || '3 Years Official Manufacturer Warranty';
    if (!warrantyOptions.includes(war)) {
      setWarrantyOptions(prev => [...prev, war]);
    }

    setFormData({
      title: prod.title || prod.name || '',
      slug: prod.slug,
      sku: prod.sku,
      barcode: prod.barcode || '',
      shortDescription: prod.shortDescription || '',
      description: prod.description || '',
      condition: cond,
      warrantyYears: prod.specs?.warrantyYears || 3,
      warranty: war,
      price: prod.price,
      originalPrice: origP,
      costPrice: prod.costPrice || Math.round(prod.price * 0.8),
      discountPercentage: prod.discountPercentage || computedDiscount,
      stock: prod.stock,
      lowStockThreshold: prod.lowStockThreshold || 5,
      warehouseLocation: prod.locations?.[0]?.locationId || 'loc_dxb_main',
      categoryId: prod.categoryId,
      categoryName: prod.categoryName,
      brandId: prod.brandId,
      brandName: prod.brandName,
      primaryImage: prod.primaryImage || prod.thumbnail || (prod.images && prod.images[0]) || '',
      sellerType: prod.sellerType || 'ADMIN',
      resellerId: prod.resellerId || '',
      resellerName: prod.resellerName || '',
      resellerCode: prod.resellerCode || '',
      partnerSkuRef: '',
      socket: prod.specs?.socket || loadedSpecs['Socket Type'] || '',
      tdp: prod.specs?.tdp || (loadedSpecs['Power Supply Wattage'] ? parseInt(loadedSpecs['Power Supply Wattage'], 10) || 125 : 125),
      formFactor: prod.specs?.formFactor || loadedSpecs['Form Factor'] || 'ATX',
      specifications: loadedSpecs,
      customSpecs: customSpecsList,
    });
    setIsModalOpen(true);
  };

  const handleSpecChange = (key: string, value: string) => {
    const updatedSpecs = { ...formData.specifications, [key]: value };
    const updates: Partial<ProductFormData> = { specifications: updatedSpecs };

    if (key === 'Socket Type') {
      updates.socket = value;
    } else if (key === 'Form Factor') {
      updates.formFactor = value;
    } else if (key === 'Power Supply Wattage') {
      const match = value.match(/\d+/);
      if (match) updates.tdp = parseInt(match[0], 10);
    } else if (key === 'Warranty') {
      const match = value.match(/(\d+)\s*Year/i);
      if (match) updates.warrantyYears = parseInt(match[1], 10);
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

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
    setFormData(prev => {
      const next = prev.customSpecs.filter((_, i) => i !== index);
      return { ...prev, customSpecs: next };
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFormError('');

    try {
      const finalSpecs: Record<string, string> = { ...formData.specifications };
      formData.customSpecs.forEach(cs => {
        if (cs.key.trim() && cs.value.trim()) {
          finalSpecs[cs.key.trim()] = cs.value.trim();
        }
      });

      if (formData.condition) finalSpecs['Condition'] = formData.condition;
      if (formData.warranty) finalSpecs['Warranty'] = formData.warranty;
      if (formData.socket && !finalSpecs['Socket Type']) {
        finalSpecs['Socket Type'] = formData.socket;
      }
      if (formData.formFactor && !finalSpecs['Form Factor']) {
        finalSpecs['Form Factor'] = formData.formFactor;
      }

      const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
      const activeBrands = brands.length > 0 ? brands : DEFAULT_BRANDS;
      const matchedCat = activeCats.find(c => c.id === formData.categoryId);
      const matchedBrand = activeBrands.find(b => b.id === formData.brandId);

      const isPartner = formData.sellerType === 'RESELLER';
      const availableStores = resellers.length > 0 ? resellers : DEFAULT_PARTNER_STORES;
      const matchedPartner = isPartner ? availableStores.find(r => r.id === formData.resellerId) : null;
      const selectedHub = WAREHOUSE_LOCATIONS.find(w => w.id === formData.warehouseLocation) || WAREHOUSE_LOCATIONS[0];
      const stockVal = Number(formData.stock) || 1;

      const origP = Number(formData.originalPrice || formData.price);
      const computedDiscount = origP > Number(formData.price)
        ? Math.round(((origP - Number(formData.price)) / origP) * 100)
        : 0;

      const payload = {
        title: formData.title,
        name: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        shortDescription: formData.shortDescription,
        description: formData.description,
        price: Number(formData.price),
        originalPrice: origP,
        costPrice: Number(formData.costPrice || (formData.price * 0.8)),
        discountPercentage: computedDiscount,
        stock: stockVal,
        lowStockThreshold: Number(formData.lowStockThreshold || 5),
        categoryId: formData.categoryId,
        categoryName: matchedCat?.name || formData.categoryName,
        brandId: formData.brandId,
        brandName: matchedBrand?.name || formData.brandName,
        primaryImage: formData.primaryImage,
        images: [formData.primaryImage],
        thumbnail: formData.primaryImage,
        sellerType: formData.sellerType,
        resellerId: isPartner ? (matchedPartner?.id || formData.resellerId || undefined) : undefined,
        resellerName: isPartner ? (matchedPartner?.displayName || matchedPartner?.businessName || formData.resellerName || undefined) : undefined,
        resellerCode: isPartner ? (matchedPartner?.resellerCode || formData.resellerCode || undefined) : undefined,
        locations: [
          {
            locationId: selectedHub.id,
            locationName: selectedHub.name,
            city: selectedHub.city,
            quantity: stockVal,
          }
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
        warranty: formData.warranty || finalSpecs['Warranty'] || `${formData.warrantyYears} Years Manufacturer Warranty`,
      };

      if (isEditing && selectedProduct) {
        await ApiClient.put(`/admin/products/${selectedProduct.id}`, payload, { token });
      } else {
        await ApiClient.post('/admin/products', payload, { token });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    try {
      await ApiClient.delete(`/admin/products/${id}`, { token });
      setIsDeleting(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product.');
    }
  };

  const handleSetApproval = async (id: string, status: ProductApprovalStatus, reason?: string) => {
    if (!token) return;
    try {
      await ApiClient.put(`/admin/products/${id}/approval`, { status, rejectionReason: reason }, { token });
      setRejectingProduct(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => {
    const title = p.title || p.name || '';
    const sku = p.sku || '';
    const brand = p.brandName || '';
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'APPROVED') return p.approvalStatus === 'APPROVED';
    if (statusFilter === 'PENDING') return p.approvalStatus === 'PENDING_APPROVAL';
    if (statusFilter === 'REJECTED') return p.approvalStatus === 'REJECTED';
    if (statusFilter === 'LOW_STOCK') return p.stock <= (p.lowStockThreshold || 5);
    return true;
  });

  const configuredSpecsCount =
    Object.keys(formData.specifications).filter(k => !!formData.specifications[k]).length +
    formData.customSpecs.filter(c => !!c.key && !!c.value).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Hardware Catalog & Inventory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-mono font-bold border border-purple-200 dark:border-purple-800">
              {products.length} SKUs
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standardized technical taxonomy, multi-category inventory, and vendor moderation
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Hardware SKU</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by Title, SKU, or Brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Catalog' },
            { id: 'APPROVED', label: 'Live Active' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'LOW_STOCK', label: 'Low Stock' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">Hardware Item & Specs</th>
                <th className="py-3 px-4">Brand & Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Inventory</th>
                <th className="py-3 px-4">Origin Channel</th>
                <th className="py-3 px-4">Catalog Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading enterprise catalog products...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(prod => {
                  const title = prod.title || prod.name || 'Untitled SKU';
                  const specs = prod.specifications || {};
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.primaryImage || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=150&q=80'}
                            alt={title}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white max-w-[220px] truncate">{title}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">SKU: {prod.sku}</div>
                            {/* Quick Specs Badges */}
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {specs['Condition'] && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                                  {specs['Condition'].split('(')[0].trim()}
                                </span>
                              )}
                              {(specs['Socket Type'] || prod.specs?.socket) && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                                  {specs['Socket Type'] || prod.specs?.socket}
                                </span>
                              )}
                              {specs['RAM Capacity'] && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
                                  {specs['RAM Capacity']}
                                </span>
                              )}
                              {specs['Storage Capacity'] && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono">
                                  {specs['Storage Capacity']}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-300">{prod.brandName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{prod.categoryName}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">{formatPrice(prod.price)}</div>
                        {(prod.discountPercentage || 0) > 0 && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                            -{prod.discountPercentage}% off ({formatPrice(prod.originalPrice || prod.price)})
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                            prod.stock > 10
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : prod.stock > 0
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}
                        >
                          {prod.stock} in stock
                        </span>
                      </td>

                      {/* Seller Type */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {prod.sellerType === 'ADMIN' ? 'Official Store' : 'Partner Store'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {prod.approvalStatus === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {prod.approvalStatus === 'PENDING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {prod.approvalStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {prod.approvalStatus === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleSetApproval(prod.id, 'APPROVED')}
                                title="Approve Listing"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRejectingProduct(prod)}
                                title="Reject Listing"
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => openEditModal(prod)}
                            title="Edit Product"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setIsDeleting(prod.id)}
                            title="Delete Product"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No hardware products match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL - REDESIGNED PROFESSIONAL WORKFLOW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[860px] shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white">
            {/* 1. Fixed Modal Top Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0">
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
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      formData.sellerType === 'RESELLER'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    }`}>
                      {formData.sellerType === 'RESELLER' ? 'Partner Store Allocation' : 'Platform Direct Master'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure enterprise catalog taxonomy, partner store allocation, commercial pricing, and technical matrix
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Fixed Modal Step Navigation Bar */}
            <div className="flex items-center gap-1 sm:gap-2 px-6 py-2.5 bg-slate-50/90 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveModalStep('general')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeModalStep === 'general'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1. General & Pricing</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalStep('partner')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeModalStep === 'partner'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>2. Partner Store & Logistics</span>
                {formData.sellerType === 'RESELLER' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveModalStep('media')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeModalStep === 'media'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>3. Media & Visual Assets</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalStep('specs')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeModalStep === 'specs'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>4. Specifications Matrix</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeModalStep === 'specs' ? 'bg-purple-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {configuredSpecsCount}
                </span>
              </button>
            </div>

            {/* Error Banner if validation fails */}
            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* 3. Scrollable Form Content */}
            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

                {/* ============================================================== */}
                {/* TAB 1: GENERAL & COMMERCIAL INFORMATION */}
                {/* ============================================================== */}
                {activeModalStep === 'general' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Card 1: Identification */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                        <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Product Identity & SKU Generation
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
                            placeholder="e.g. Intel Core i9-14900K Flagship 24-Core Desktop Processor"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                SKU Number (Stock Keeping Unit) *
                              </label>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, sku: generateRandomSku() })}
                                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Randomize</span>
                              </button>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="e.g. NX-CPU-849201"
                              value={formData.sku}
                              onChange={e => setFormData({ ...formData, sku: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold transition-all"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Barcode / EAN-13 / UPC
                              </label>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, barcode: generateRandomBarcode() })}
                                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Generate</span>
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="e.g. 729183920192"
                                value={formData.barcode}
                                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-semibold transition-all"
                              />
                              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Taxonomy & Classification */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                        <Boxes className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Hardware Classification & Warranty
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 1. Category Selector & Creator */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              Hardware Category *
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingCategory(!isAddingCategory);
                                setNewCatName('');
                              }}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isAddingCategory ? 'Select Existing' : '+ Add Custom Category'}</span>
                            </button>
                          </div>

                          {isAddingCategory ? (
                            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2 animate-fadeIn">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="New Category Name (e.g. AI Accelerators)"
                                  value={newCatName}
                                  onChange={e => setNewCatName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleQuickAddCategory();
                                    }
                                  }}
                                  className="flex-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  disabled={!newCatName.trim() || isSavingCategory}
                                  onClick={handleQuickAddCategory}
                                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                  {isSavingCategory ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  <span>Save & Select</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsAddingCategory(false)}
                                  className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-purple-700 dark:text-purple-300">
                                Saves category to database and assigns it to this product immediately.
                              </p>
                            </div>
                          ) : (
                            <select
                              value={formData.categoryId}
                              onChange={e => {
                                if (e.target.value === '__new_cat__') {
                                  setIsAddingCategory(true);
                                  return;
                                }
                                const activeCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
                                const sel = activeCats.find(c => c.id === e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  categoryId: e.target.value,
                                  categoryName: sel?.name || '',
                                  sku: generateRandomSku(e.target.value),
                                  specifications: {
                                    ...prev.specifications,
                                    'Product Category': sel?.name || prev.specifications['Product Category'] || '',
                                  },
                                }));
                              }}
                              className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold transition-all"
                            >
                              {(categories.length > 0 ? categories : DEFAULT_CATEGORIES).map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                              <option value="__new_cat__">+ Add New Category...</option>
                            </select>
                          )}
                        </div>

                        {/* 2. Brand Selector & Creator */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              Brand / Manufacturer *
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingBrand(!isAddingBrand);
                                setNewBrandName('');
                              }}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isAddingBrand ? 'Select Existing' : '+ Add Custom Brand'}</span>
                            </button>
                          </div>

                          {isAddingBrand ? (
                            <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2 animate-fadeIn">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="New Brand Name (e.g. Noctua, Fractal)"
                                  value={newBrandName}
                                  onChange={e => setNewBrandName(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleQuickAddBrand();
                                    }
                                  }}
                                  className="flex-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  disabled={!newBrandName.trim() || isSavingBrand}
                                  onClick={handleQuickAddBrand}
                                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                                >
                                  {isSavingBrand ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  <span>Save & Select</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsAddingBrand(false)}
                                  className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-purple-700 dark:text-purple-300">
                                Registers brand in database and links it to this hardware listing.
                              </p>
                            </div>
                          ) : (
                            <select
                              value={formData.brandId}
                              onChange={e => {
                                if (e.target.value === '__new_brand__') {
                                  setIsAddingBrand(true);
                                  return;
                                }
                                const activeBrands = brands.length > 0 ? brands : DEFAULT_BRANDS;
                                const sel = activeBrands.find(b => b.id === e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  brandId: e.target.value,
                                  brandName: sel?.name || '',
                                  specifications: {
                                    ...prev.specifications,
                                    Brand: sel?.name || prev.specifications['Brand'] || '',
                                  },
                                }));
                              }}
                              className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold transition-all"
                            >
                              {(brands.length > 0 ? brands : DEFAULT_BRANDS).map(b => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                              <option value="__new_brand__">+ Add New Brand...</option>
                            </select>
                          )}
                        </div>

                        {/* 3. Hardware Condition */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              Hardware Condition
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomCondition(!isCustomCondition);
                                if (!isCustomCondition) {
                                  setCustomConditionValue(formData.condition);
                                }
                              }}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isCustomCondition ? 'Select Preset' : '+ Type Custom'}</span>
                            </button>
                          </div>

                          {isCustomCondition ? (
                            <div className="space-y-1.5 animate-fadeIn">
                              <input
                                type="text"
                                placeholder="Type custom condition (e.g. Certified Pre-Owned, Tray New)"
                                value={formData.condition}
                                onChange={e => handleApplyCustomCondition(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-purple-300 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                                autoFocus
                              />
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                Custom hardware condition applied to this item
                              </p>
                            </div>
                          ) : (
                            <select
                              value={formData.condition}
                              onChange={e => {
                                if (e.target.value === '__custom_cond__') {
                                  setIsCustomCondition(true);
                                } else {
                                  setFormData({
                                    ...formData,
                                    condition: e.target.value,
                                    specifications: {
                                      ...formData.specifications,
                                      Condition: e.target.value,
                                    },
                                  });
                                }
                              }}
                              className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold transition-all"
                            >
                              {conditionOptions.map(opt => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                              <option value="__custom_cond__">+ Type Custom Condition...</option>
                            </select>
                          )}
                        </div>

                        {/* 4. Warranty Coverage */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              Warranty Coverage
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomWarranty(!isCustomWarranty);
                                if (!isCustomWarranty) {
                                  setCustomWarrantyValue(formData.warranty);
                                }
                              }}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{isCustomWarranty ? 'Select Preset' : '+ Type Custom'}</span>
                            </button>
                          </div>

                          {isCustomWarranty ? (
                            <div className="space-y-1.5 animate-fadeIn">
                              <input
                                type="text"
                                placeholder="Type custom warranty (e.g. 5 Years Direct RMA, 90 Days Testing)"
                                value={formData.warranty}
                                onChange={e => handleApplyCustomWarranty(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-purple-300 dark:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-semibold"
                                autoFocus
                              />
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                Custom warranty policy text applied to this SKU
                              </p>
                            </div>
                          ) : (
                            <select
                              value={formData.warranty}
                              onChange={e => {
                                if (e.target.value === '__custom_war__') {
                                  setIsCustomWarranty(true);
                                } else {
                                  const match = e.target.value.match(/(\d+)\s*Year/i);
                                  const yrs = match ? parseInt(match[1], 10) : 3;
                                  setFormData({
                                    ...formData,
                                    warranty: e.target.value,
                                    warrantyYears: yrs,
                                    specifications: {
                                      ...formData.specifications,
                                      Warranty: e.target.value,
                                    },
                                  });
                                }
                              }}
                              className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold transition-all"
                            >
                              {warrantyOptions.map(w => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                              <option value="__custom_war__">+ Type Custom Warranty...</option>
                            </select>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Pricing & Stock Commercials */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Commercial Valuation, Margin & Stock
                          </h3>
                        </div>

                        {/* Live Financial Metrics Badges */}
                        <div className="flex items-center gap-2">
                          {Number(formData.originalPrice) > Number(formData.price) && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              -{Math.round(((Number(formData.originalPrice) - Number(formData.price)) / Number(formData.originalPrice)) * 100)}% Discount
                            </span>
                          )}
                          {Number(formData.costPrice) > 0 && Number(formData.price) > Number(formData.costPrice) && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              Est. Margin: +{Math.round(((Number(formData.price) - Number(formData.costPrice)) / Number(formData.price)) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Selling Price (د.إ AED) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            List / Orig. Price (د.إ AED)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.originalPrice}
                            onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Cost Price (Wholesale AED)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.costPrice}
                            onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-slate-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Available Stock (Units) *
                          </label>
                          <input
                            type="number"
                            required
                            value={formData.stock}
                            onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold text-purple-600 dark:text-purple-400"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Low-Stock Alert Trigger Threshold
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            value={formData.lowStockThreshold}
                            onChange={e => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                            className="w-32 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-semibold"
                          />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Automatic emergency restock banner will appear on the operations dashboard when units drop to or below this quantity.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Short Description */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Catalog Highlight / Brief Specification Summary
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Flagship 24-core (8P + 16E) desktop computing processor with up to 6.0 GHz Turbo and PCIe Gen 5 support for enthusiast workstations..."
                        value={formData.shortDescription}
                        onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 2: PARTNER STORES & LOGISTICS DISTRIBUTION */}
                {/* ============================================================== */}
                {activeModalStep === 'partner' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Sales Channel Selection */}
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Commercial Sales Channel & Attribution *
                      </label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Option 1: Platform Master Direct */}
                        <div
                          onClick={() => setFormData({ ...formData, sellerType: 'ADMIN', resellerId: '', resellerName: '', resellerCode: '' })}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                            formData.sellerType === 'ADMIN'
                              ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-600 dark:border-purple-500 shadow-sm'
                              : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            formData.sellerType === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                NexTech Platform Master (Direct)
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                                0% Commission
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Central inventory sold under NexTech Official Store. Dispatched from primary regional platform logistics hubs.
                            </p>
                          </div>
                        </div>

                        {/* Option 2: Partner Reseller Store */}
                        <div
                          onClick={() => {
                            const stores = resellers.length > 0 ? resellers : DEFAULT_PARTNER_STORES;
                            const defaultStore = stores[0];
                            setFormData({
                              ...formData,
                              sellerType: 'RESELLER',
                              resellerId: defaultStore.id,
                              resellerName: defaultStore.displayName || defaultStore.businessName,
                              resellerCode: defaultStore.resellerCode,
                            });
                          }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                            formData.sellerType === 'RESELLER'
                              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-600 dark:border-amber-500 shadow-sm'
                              : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            formData.sellerType === 'RESELLER' ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                Authorized Partner Reseller Store
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                                Partner Network
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Assigned to a verified multi-tenant technology partner store. Tracked through partner portals and vendor settlements.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Partner Store Details (Active if RESELLER selected) */}
                    {formData.sellerType === 'RESELLER' && (
                      <div className="p-5 rounded-2xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-900/40">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                              Assigned Partner Store Profile
                            </h3>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                            Multi-Tenant Mode
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                Select Partner Store Entity *
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingReseller(!isAddingReseller);
                                  setNewResellerName('');
                                  setNewResellerCode('');
                                  setNewResellerCity('');
                                }}
                                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>{isAddingReseller ? 'Select Existing Partner' : '+ Add New Partner Store'}</span>
                              </button>
                            </div>

                            {isAddingReseller ? (
                              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 space-y-3 animate-fadeIn">
                                <div className="flex items-center justify-between pb-1 border-b border-amber-200/50 dark:border-amber-800/40">
                                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Register New Partner Store</span>
                                  <button
                                    type="button"
                                    onClick={() => setIsAddingReseller(false)}
                                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      Store / Business Name *
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Al-Ain Silicon PC Hub"
                                      value={newResellerName}
                                      onChange={e => setNewResellerName(e.target.value)}
                                      className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-amber-500/20"
                                      autoFocus
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      Store Code (e.g. alainsilicon)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="alain101"
                                      value={newResellerCode}
                                      onChange={e => setNewResellerCode(e.target.value)}
                                      className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-amber-500/20 font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                      City / Region
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Al Ain, Abu Dhabi"
                                      value={newResellerCity}
                                      onChange={e => setNewResellerCity(e.target.value)}
                                      className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-amber-500/20"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setIsAddingReseller(false)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!newResellerName.trim() || isSavingReseller}
                                    onClick={handleQuickAddReseller}
                                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                                  >
                                    {isSavingReseller ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    <span>Register & Assign Partner Store</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <select
                                value={formData.resellerId}
                                onChange={e => {
                                  if (e.target.value === '__new_reseller__') {
                                    setIsAddingReseller(true);
                                    return;
                                  }
                                  const stores = resellers.length > 0 ? resellers : DEFAULT_PARTNER_STORES;
                                  const selected = stores.find(s => s.id === e.target.value);
                                  setFormData({
                                    ...formData,
                                    resellerId: e.target.value,
                                    resellerName: selected?.displayName || selected?.businessName || '',
                                    resellerCode: selected?.resellerCode || '',
                                  });
                                }}
                                className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                              >
                                {(resellers.length > 0 ? resellers : DEFAULT_PARTNER_STORES).map((store: any) => (
                                  <option key={store.id} value={store.id}>
                                    {store.displayName || store.businessName} ({store.resellerCode?.toUpperCase()} - {store.address?.city || store.city || 'UAE'})
                                  </option>
                                ))}
                                <option value="__new_reseller__">+ Add New Partner Store...</option>
                              </select>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Partner Internal SKU / Ref Code
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. COMNET-CPU-0199"
                              value={formData.partnerSkuRef}
                              onChange={e => setFormData({ ...formData, partnerSkuRef: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                            />
                          </div>
                        </div>

                        {/* Partner store metadata badge */}
                        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-900/30 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Selected Partner Store: <span className="font-bold text-slate-900 dark:text-white">{formData.resellerName || 'ComNet Solutions LLC'}</span>
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-amber-700 dark:text-amber-300 font-bold">
                            Code: {formData.resellerCode || 'comnet101'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Warehousing & Logistics Node */}
                    <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            Primary Fulfillment & Storage Node
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          Same-Day Dispatch Ready
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Warehouse Location *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingWarehouse(!isAddingWarehouse);
                              setNewWhName('');
                              setNewWhCode('');
                              setNewWhCity('');
                            }}
                            className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{isAddingWarehouse ? 'Select Existing Depot' : '+ Add Warehouse Depot'}</span>
                          </button>
                        </div>

                        {isAddingWarehouse ? (
                          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between pb-1 border-b border-purple-200/50 dark:border-purple-800/40">
                              <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                                Add New Fulfillment / Warehouse Depot
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsAddingWarehouse(false)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Depot / Warehouse Name *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Ras Al Khaimah Regional Hub"
                                  value={newWhName}
                                  onChange={e => setNewWhName(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-purple-500/20"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Depot Code (e.g. RAK-01)
                                </label>
                                <input
                                  type="text"
                                  placeholder="RAK-01"
                                  value={newWhCode}
                                  onChange={e => setNewWhCode(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-purple-500/20 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  Emirate / City
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ras Al Khaimah"
                                  value={newWhCity}
                                  onChange={e => setNewWhCity(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-purple-500/20"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setIsAddingWarehouse(false)}
                                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={!newWhName.trim()}
                                onClick={handleQuickAddWarehouse}
                                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Add Depot & Assign</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <select
                            value={formData.warehouseLocation}
                            onChange={e => {
                              if (e.target.value === '__new_warehouse__') {
                                setIsAddingWarehouse(true);
                                return;
                              }
                              setFormData({ ...formData, warehouseLocation: e.target.value });
                            }}
                            className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold transition-all"
                          >
                            {warehouseNodes.map(wh => (
                              <option key={wh.id} value={wh.id}>
                                {wh.name} [{wh.code}] — {wh.city}
                              </option>
                            ))}
                            <option value="__new_warehouse__">+ Add New Warehouse Depot...</option>
                          </select>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          The physical depot where stock for this hardware item is secured and routed for regional orders.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 3: MEDIA & VISUAL ASSETS */}
                {/* ============================================================== */}
                {activeModalStep === 'media' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                        <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Primary Hardware Image & Live Visual Render
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        {/* Image URL Inputs */}
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Primary High-Resolution Image URL *
                            </label>
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/photo-..."
                              value={formData.primaryImage}
                              onChange={e => setFormData({ ...formData, primaryImage: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Ensure direct HTTPS links with clear product backgrounds for catalog clarity.
                            </p>
                          </div>

                          {/* Quick Presets Selection */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                              Instant Hardware Photo Presets (1-Click Fill)
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {HARDWARE_IMAGE_PRESETS.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, primaryImage: preset.url })}
                                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 text-left text-xs transition-all cursor-pointer group"
                                >
                                  <span className="font-bold block text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                    {preset.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {preset.category}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Live Image Card Render */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            Live Preview Render
                          </label>
                          <div className="w-full aspect-square rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden relative flex items-center justify-center shadow-inner group">
                            {formData.primaryImage ? (
                              <img
                                src={formData.primaryImage}
                                alt="SKU Preview"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e: any) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80';
                                }}
                              />
                            ) : (
                              <div className="text-center p-4">
                                <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                <span className="text-xs text-slate-400">No Image Specified</span>
                              </div>
                            )}
                            <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                              HD 800x800
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 4: TECHNICAL SPECIFICATIONS MATRIX */}
                {/* ============================================================== */}
                {activeModalStep === 'specs' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Technical Specifications Matrix</span>
                          <span className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full font-mono font-bold">
                            {configuredSpecsCount} Active
                          </span>
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Choose standardized architecture presets or type custom hardware metrics
                      </p>
                    </div>

                    {/* Specification Category Sub-tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
                      {SPECIFICATION_GROUPS.map(grp => (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => setActiveSpecTab(grp.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeSpecTab === grp.id
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {grp.id === 'core' && <Cpu className="w-3.5 h-3.5" />}
                          {grp.id === 'memory_storage' && <Database className="w-3.5 h-3.5" />}
                          {grp.id === 'graphics_power' && <Zap className="w-3.5 h-3.5" />}
                          {grp.id === 'display_system' && <Monitor className="w-3.5 h-3.5" />}
                          <span>{grp.name}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setActiveSpecTab('custom')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                          activeSpecTab === 'custom'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Custom Specifications ({formData.customSpecs.length})</span>
                      </button>
                    </div>

                    {/* Active Subtab Fields Rendering */}
                    {SPECIFICATION_GROUPS.map(grp => {
                      if (activeSpecTab !== grp.id) return null;
                      return (
                        <div key={grp.id} className="space-y-3 animate-fadeIn">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            {grp.description}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {grp.fields.map(f => {
                              const presets = f.presetKey ? SPECIFICATION_PRESETS[f.presetKey] : undefined;
                              const currentValue = formData.specifications[f.key] || '';
                              return (
                                <div key={f.key} className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                      {f.label}
                                    </label>
                                    {currentValue && (
                                      <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold">
                                        Set
                                      </span>
                                    )}
                                  </div>

                                  {presets && presets.length > 0 ? (
                                    <div className="space-y-1.5">
                                      <select
                                        value={presets.includes(currentValue) ? currentValue : ''}
                                        onChange={e => {
                                          if (e.target.value) {
                                            handleSpecChange(f.key, e.target.value);
                                          }
                                        }}
                                        className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-semibold"
                                      >
                                        <option value="">-- Choose {f.label} Preset --</option>
                                        {presets.map(opt => (
                                          <option key={opt} value={opt}>
                                            {opt}
                                          </option>
                                        ))}
                                      </select>

                                      <div className="relative">
                                        <input
                                          type="text"
                                          list={`datalist-${f.key.replace(/\s+/g, '-')}`}
                                          placeholder={f.placeholder}
                                          value={currentValue}
                                          onChange={e => handleSpecChange(f.key, e.target.value)}
                                          className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                                        />
                                        <datalist id={`datalist-${f.key.replace(/\s+/g, '-')}`}>
                                          {presets.map(opt => (
                                            <option key={opt} value={opt} />
                                          ))}
                                        </datalist>
                                      </div>
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder={f.placeholder}
                                      value={currentValue}
                                      onChange={e => handleSpecChange(f.key, e.target.value)}
                                      className="w-full bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Custom Specifications Subtab */}
                    {activeSpecTab === 'custom' && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Add custom enterprise hardware parameters (e.g. L3 Cache, Interface, PCIe Lanes, Max Temp)
                          </p>
                          <button
                            type="button"
                            onClick={handleAddCustomSpec}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Parameter</span>
                          </button>
                        </div>

                        {formData.customSpecs.length === 0 ? (
                          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                            No custom specification parameters configured. Click &quot;Add Parameter&quot; to insert custom attributes.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {formData.customSpecs.map((cs, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Parameter Name (e.g. L3 Cache)"
                                  value={cs.key}
                                  onChange={e => handleCustomSpecChange(idx, 'key', e.target.value)}
                                  className="flex-1 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                                />
                                <input
                                  type="text"
                                  placeholder="Parameter Value (e.g. 36 MB Intel Smart Cache)"
                                  value={cs.value}
                                  onChange={e => handleCustomSpecChange(idx, 'value', e.target.value)}
                                  className="flex-1 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomSpec(idx)}
                                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                                  title="Delete parameter"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Fixed Modal Bottom Footer Action Bar */}
              <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                {/* Left side: Live summary chip */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                    <img
                      src={formData.primaryImage || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80'}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-[280px]">
                      {formData.title || 'New Hardware SKU'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {formData.price ? `AED ${formData.price}` : 'AED 0.00'}
                      </span>
                      <span>•</span>
                      <span>{formData.stock} Units</span>
                      <span>•</span>
                      <span className={formData.sellerType === 'RESELLER' ? 'text-amber-600 font-semibold' : 'text-indigo-600 font-semibold'}>
                        {formData.sellerType === 'RESELLER' ? (formData.resellerName || 'Partner Store') : 'Platform Direct'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Navigation & Submit */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {/* Step navigation prev/next */}
                  {activeModalStep !== 'general' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeModalStep === 'specs') setActiveModalStep('media');
                        else if (activeModalStep === 'media') setActiveModalStep('partner');
                        else if (activeModalStep === 'partner') setActiveModalStep('general');
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  )}

                  {activeModalStep !== 'specs' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeModalStep === 'general') setActiveModalStep('partner');
                        else if (activeModalStep === 'partner') setActiveModalStep('media');
                        else if (activeModalStep === 'media') setActiveModalStep('specs');
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Next Section</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isSubmitting ? 'Saving SKU...' : isEditing ? 'Update Hardware Product' : 'Create Hardware SKU'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Reject Vendor SKU Listing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide specific feedback to the vendor regarding why this listing cannot be approved:
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Inaccurate pricing or missing manufacturer datasheet specifications..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingProduct(null)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSetApproval(rejectingProduct.id, 'REJECTED', rejectionReason)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-600/20"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleting && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Product Listing?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will permanently delete this hardware listing and remove it from all customer catalogs.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(isDeleting)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-600/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
