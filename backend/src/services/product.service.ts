import { v4 as uuidv4 } from 'uuid';
import { productRepository } from '../repositories/product.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { Product, ProductApprovalStatus, SellerType } from '../types/index.js';
import { auditService } from './audit.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { ENV } from '../config/env.js';

export interface ProductFilterQuery {
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;
  brandSlug?: string;
  search?: string;
  collection?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sellerType?: SellerType;
  minRating?: number;
  onSale?: boolean;
  location?: string;
  resellerId?: string;
  approvalStatus?: ProductApprovalStatus;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'name_asc';
  specifications?: Record<string, string>; // e.g. { processor: 'i9', ram: '32GB' }
  page?: number;
  limit?: number;
}

export class ProductService {
  async getProducts(filter: ProductFilterQuery = {}): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    facets: {
      categories: Array<{ id: string; name: string; count: number }>;
      brands: Array<{ id: string; name: string; count: number }>;
      priceRange: { min: number; max: number };
    };
  }> {
    let allProducts = await productRepository.find();

    // If filtering public products, only return active & approved
    if (!filter.approvalStatus && !filter.resellerId) {
      allProducts = allProducts.filter(p => p.isActive && p.approvalStatus === 'APPROVED');
    }

    // Reseller filter
    if (filter.resellerId) {
      allProducts = allProducts.filter(p => p.resellerId === filter.resellerId);
    }

    // Approval status filter
    if (filter.approvalStatus) {
      allProducts = allProducts.filter(p => p.approvalStatus === filter.approvalStatus);
    }

    // Category filter
    if (filter.categoryId) {
      allProducts = allProducts.filter(p => p.categoryId === filter.categoryId);
    } else if (filter.categorySlug) {
      const c = await categoryRepository.findBySlug(filter.categorySlug);
      if (c) {
        allProducts = allProducts.filter(p => p.categoryId === c.id);
      }
    }

    // Brand filter
    if (filter.brandId) {
      allProducts = allProducts.filter(p => p.brandId === filter.brandId);
    } else if (filter.brandSlug) {
      const b = await brandRepository.findBySlug(filter.brandSlug);
      if (b) {
        allProducts = allProducts.filter(p => p.brandId === b.id);
      }
    }

    // Search query
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      allProducts = allProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
        (p.collections && p.collections.some(c => c.toLowerCase().includes(q))) ||
        (p.variants && p.variants.some(v => v.sku.toLowerCase().includes(q) || v.title.toLowerCase().includes(q)))
      );
    }

    // Collection filter
    if (filter.collection && filter.collection.trim()) {
      const colLower = filter.collection.toLowerCase().trim();
      allProducts = allProducts.filter(p =>
        p.collections?.some(c => c.toLowerCase() === colLower || c.toLowerCase().includes(colLower))
      );
    }

    // Tag filter
    if (filter.tag && filter.tag.trim()) {
      const tagLower = filter.tag.toLowerCase().trim();
      allProducts = allProducts.filter(p =>
        p.tags?.some(t => t.toLowerCase() === tagLower)
      );
    }

    // Price range
    if (filter.minPrice != null) {
      allProducts = allProducts.filter(p => (p.salePrice || p.price) >= filter.minPrice!);
    }
    if (filter.maxPrice != null) {
      allProducts = allProducts.filter(p => (p.salePrice || p.price) <= filter.maxPrice!);
    }

    // In-stock only
    if (filter.inStock) {
      allProducts = allProducts.filter(p => p.stock > 0);
    }

    // Featured only
    if (filter.isFeatured) {
      allProducts = allProducts.filter(p => p.isFeatured);
    }

    // Seller type (OEM Direct vs Verified Reseller)
    if (filter.sellerType) {
      allProducts = allProducts.filter(p => p.sellerType === filter.sellerType);
    }

    // Min customer rating
    if (filter.minRating != null) {
      allProducts = allProducts.filter(p => (p.rating || 0) >= filter.minRating!);
    }

    // On-Sale / Deals filter
    if (filter.onSale) {
      allProducts = allProducts.filter(p => (p.salePrice && p.salePrice < p.price) || (p.compareAtPrice && p.compareAtPrice > p.price));
    }

    // Logistics Hub / UAE Warehouse filter
    if (filter.location) {
      const locLower = filter.location.toLowerCase();
      allProducts = allProducts.filter(p =>
        p.locations?.some(l => (l.city?.toLowerCase().includes(locLower) || l.locationName?.toLowerCase().includes(locLower)) && l.quantity > 0)
      );
    }

    // Custom specification matching
    if (filter.specifications) {
      for (const [specKey, specVal] of Object.entries(filter.specifications)) {
        if (specVal) {
          const valLower = specVal.toLowerCase();
          allProducts = allProducts.filter(p => {
            const prodVal = p.specifications?.[specKey]?.toLowerCase();
            return prodVal && prodVal.includes(valLower);
          });
        }
      }
    }

    // Compute Facets before pagination
    const categoryCounts: Record<string, { id: string; name: string; count: number }> = {};
    const brandCounts: Record<string, { id: string; name: string; count: number }> = {};
    let minP = Infinity;
    let maxP = 0;

    for (const p of allProducts) {
      const effectivePrice = p.salePrice || p.price;
      if (effectivePrice < minP) minP = effectivePrice;
      if (effectivePrice > maxP) maxP = effectivePrice;

      if (!categoryCounts[p.categoryId]) {
        categoryCounts[p.categoryId] = { id: p.categoryId, name: p.categoryName, count: 0 };
      }
      categoryCounts[p.categoryId].count++;

      if (!brandCounts[p.brandId]) {
        brandCounts[p.brandId] = { id: p.brandId, name: p.brandName, count: 0 };
      }
      brandCounts[p.brandId].count++;
    }

    // Sorting
    switch (filter.sortBy) {
      case 'price_asc':
        allProducts.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        break;
      case 'price_desc':
        allProducts.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        break;
      case 'rating':
        allProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'name_asc':
        allProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        allProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    const total = allProducts.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginatedProducts = allProducts.slice(offset, offset + limit);

    return {
      products: paginatedProducts.map(p => this.attachLocations(p)),
      total,
      page,
      limit,
      totalPages,
      facets: {
        categories: Object.values(categoryCounts),
        brands: Object.values(brandCounts),
        priceRange: { min: minP === Infinity ? 0 : minP, max: maxP },
      },
    };
  }

  public async validateProductData(data: Partial<Product>, currentId?: string): Promise<void> {
    // 1. Title / Name validation
    if (data.name !== undefined && (!data.name || typeof data.name !== 'string' || !data.name.trim())) {
      throw new Error('Product title/name is required');
    }

    // 2. Base SKU validation
    if (data.sku !== undefined) {
      if (!data.sku || typeof data.sku !== 'string' || !data.sku.trim()) {
        throw new Error('Valid SKU is required');
      }
      const existingWithSku = await productRepository.findBySku(data.sku.trim());
      if (existingWithSku && existingWithSku.id !== currentId) {
        if (existingWithSku.name === data.name && existingWithSku.sellerType === (data.sellerType || 'RESELLER')) {
          await productRepository.delete(existingWithSku.id);
        } else {
          throw new Error(`SKU "${data.sku}" is already in use by another product ("${existingWithSku.name}").`);
        }
      }
    }

    // 3. Price and numbers validation
    if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0 || isNaN(data.price))) {
      throw new Error('Price must be a non-negative number');
    }
    if (data.compareAtPrice !== undefined && data.compareAtPrice !== null && (typeof data.compareAtPrice !== 'number' || data.compareAtPrice < 0 || isNaN(data.compareAtPrice))) {
      throw new Error('Compare-at price must be a non-negative number');
    }
    if (data.costPrice !== undefined && data.costPrice !== null && (typeof data.costPrice !== 'number' || data.costPrice < 0 || isNaN(data.costPrice))) {
      throw new Error('Cost price must be a non-negative number');
    }
    if (data.stock !== undefined && (typeof data.stock !== 'number' || data.stock < 0 || !Number.isInteger(data.stock))) {
      throw new Error('Stock quantity must be a non-negative integer');
    }

    // 4. Logistics / Shipping validation
    if (data.weight !== undefined && data.weight !== null && (typeof data.weight !== 'number' || data.weight < 0 || isNaN(data.weight))) {
      throw new Error('Product weight must be a non-negative number in kilograms');
    }
    if (data.dimensions) {
      const { length, width, height } = data.dimensions;
      if (length < 0 || width < 0 || height < 0) {
        throw new Error('Package dimensions must be non-negative numbers');
      }
    }
    if (data.hsCode && typeof data.hsCode === 'string') {
      const trimmedHs = data.hsCode.trim();
      if (trimmedHs.length > 0 && !/^[0-9.\-]{4,15}$/.test(trimmedHs)) {
        throw new Error('HS tariff code must contain 4-15 digits, dots, or hyphens (e.g. 8471.30.01)');
      }
    }

    // 5. Variants validation
    if (data.hasVariants && data.variants && data.variants.length > 0) {
      const seenSkus = new Set<string>();
      if (data.sku) seenSkus.add(data.sku.trim().toLowerCase());

      const allProducts = await productRepository.find();

      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i];
        if (!v.id) v.id = `var_${uuidv4()}`;
        if (!v.sku || !v.sku.trim()) {
          throw new Error(`Variant #${i + 1} (${v.title || 'Untitled'}) must have a valid SKU`);
        }
        const skuLower = v.sku.trim().toLowerCase();
        if (seenSkus.has(skuLower)) {
          throw new Error(`Duplicate SKU "${v.sku}" detected among product variants`);
        }
        seenSkus.add(skuLower);

        // Check against other products and their variants
        for (const other of allProducts) {
          if (other.id === currentId) continue;
          if (other.sku && other.sku.trim().toLowerCase() === skuLower) {
            throw new Error(`Variant SKU "${v.sku}" conflicts with product "${other.name}"`);
          }
          if (other.variants) {
            for (const otherV of other.variants) {
              if (otherV.sku && otherV.sku.trim().toLowerCase() === skuLower) {
                throw new Error(`Variant SKU "${v.sku}" conflicts with variant in "${other.name}"`);
              }
            }
          }
        }

        if (typeof v.price !== 'number' || v.price < 0 || isNaN(v.price)) {
          throw new Error(`Variant "${v.title}" must have a non-negative price`);
        }
        if (typeof v.stock !== 'number' || v.stock < 0 || !Number.isInteger(v.stock)) {
          throw new Error(`Variant "${v.title}" must have a non-negative integer stock`);
        }
      }
    }
  }

  public attachLocations(product: Product): Product {
    if (!product.locations || product.locations.length === 0) {
      const total = product.stock || 0;
      const dxb = Math.floor(total * 0.6);
      const deira = Math.floor(total * 0.25);
      const auh = Math.max(0, total - dxb - deira);
      product.locations = [
        {
          locationId: 'loc_dxb_main',
          locationName: 'Dubai Logistics Hub (JAFZA)',
          city: 'Dubai',
          quantity: dxb,
          available: dxb,
          onHand: dxb,
          committed: 0,
          unavailable: 0,
        },
        {
          locationId: 'loc_deira_tech',
          locationName: 'Deira Showroom & Tech Center',
          city: 'Dubai',
          quantity: deira,
          available: deira,
          onHand: deira,
          committed: 0,
          unavailable: 0,
        },
        {
          locationId: 'loc_auh_hub',
          locationName: 'Abu Dhabi Regional Hub',
          city: 'Abu Dhabi',
          quantity: auh,
          available: auh,
          onHand: auh,
          committed: 0,
          unavailable: 0,
        },
      ];
    } else {
      product.locations = product.locations.map(loc => {
        const avail = loc.available !== undefined ? loc.available : loc.quantity;
        const comm = loc.committed || 0;
        const unavail = loc.unavailable || 0;
        const onHand = loc.onHand !== undefined ? loc.onHand : (avail + comm);
        return {
          ...loc,
          quantity: avail,
          available: avail,
          committed: comm,
          unavailable: unavail,
          onHand,
        };
      });
    }
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const prod = await productRepository.findBySlug(slug);
    return prod ? this.attachLocations(prod) : null;
  }

  async getProductById(id: string): Promise<Product | null> {
    const prod = await productRepository.findById(id);
    return prod ? this.attachLocations(prod) : null;
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'slug'> & { slug?: string }): Promise<Product> {
    await this.validateProductData(data);

    const slug = (data.slug && data.slug.trim())
      ? data.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + `-${Date.now().toString(36)}`;

    // Sanitize collections and tags
    const cleanTags = Array.isArray(data.tags)
      ? Array.from(new Set(data.tags.map(t => String(t).trim()).filter(Boolean)))
      : [];
    const cleanCollections = Array.isArray(data.collections)
      ? Array.from(new Set(data.collections.map(c => String(c).trim()).filter(Boolean)))
      : [];

    // Calculate aggregated stock if variants exist
    let computedStock = data.stock;
    if (data.hasVariants && data.variants && data.variants.length > 0) {
      computedStock = data.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }

    const newProduct: Product = {
      ...data,
      id: `prod_${uuidv4()}`,
      slug,
      stock: computedStock,
      chargeTax: data.chargeTax !== false,
      isPhysical: data.isPhysical !== false,
      inventoryTracked: data.inventoryTracked !== false,
      allowBackorder: !!data.allowBackorder,
      rating: data.rating || 5.0,
      reviewCount: data.reviewCount || 0,
      reservedStock: data.reservedStock || 0,
      lowStockThreshold: data.lowStockThreshold || 5,
      isFeatured: !!data.isFeatured,
      isActive: data.isActive !== false,
      approvalStatus: data.approvalStatus || (data.sellerType === 'ADMIN' ? 'APPROVED' : 'PENDING_APPROVAL'),
      specifications: data.specifications || {},
      features: data.features || [],
      tags: cleanTags,
      collections: cleanCollections,
      images: data.images || [],
      thumbnail: data.thumbnail || data.images?.[0] || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return productRepository.create(newProduct);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    await this.validateProductData(updates, id);

    if (updates.tags && Array.isArray(updates.tags)) {
      updates.tags = Array.from(new Set(updates.tags.map(t => String(t).trim()).filter(Boolean)));
    }
    if (updates.collections && Array.isArray(updates.collections)) {
      updates.collections = Array.from(new Set(updates.collections.map(c => String(c).trim()).filter(Boolean)));
    }
    if (updates.hasVariants && updates.variants && updates.variants.length > 0) {
      updates.stock = updates.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    }
    updates.updatedAt = new Date().toISOString();

    return productRepository.update(id, updates);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return productRepository.delete(id);
  }

  async setApprovalStatus(id: string, status: ProductApprovalStatus, rejectionReason?: string, adminUserId?: string): Promise<Product | null> {
    const product = await productRepository.findById(id);
    if (!product) return null;

    const updated = await productRepository.update(id, {
      approvalStatus: status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      isActive: status === 'APPROVED',
    });

    if (adminUserId) {
      const actingAdmin = await userRepository.findById(adminUserId);
      await auditService.log({
        userId: adminUserId,
        userEmail: actingAdmin?.email || ENV.ADMIN_DEFAULT_EMAIL,
        userRole: 'ADMIN',
        action: `PRODUCT_STATUS_${status}`,
        resource: 'products',
        resourceId: id,
        details: { status, rejectionReason, productName: product.name },
      });
    }

    return updated;
  }
}

export const productService = new ProductService();
