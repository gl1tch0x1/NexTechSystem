import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { productRepository } from '../repositories/product.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { importRepository } from '../repositories/import.repository.js';
import { ProductImportRow, ProductImportReport, Product } from '../types/index.js';
import { auditService } from './audit.service.js';

// Canonical schema mapping dictionary
const CANONICAL_FIELD_MAPPINGS: Record<string, string[]> = {
  name: ['product name', 'item name', 'title', 'product title', 'name', 'model name'],
  sku: ['sku', 'item code', 'part number', 'model number', 'mpn', 'sku code'],
  barcode: ['barcode', 'upc', 'ean', 'isbn'],
  brandName: ['brand', 'brand name', 'manufacturer', 'vendor'],
  categoryName: ['category', 'category name', 'type', 'product category', 'sub-category'],
  price: ['price', 'selling price', 'retail price', 'unit price', 'rate', 'msrp'],
  compareAtPrice: ['compare at price', 'original price', 'regular price', 'list price', 'mrp'],
  costPrice: ['cost', 'cost price', 'wholesale price', 'buy price'],
  stock: ['stock', 'qty', 'quantity', 'available qty', 'inventory', 'units'],
  description: ['description', 'details', 'overview', 'product description'],
  shortDescription: ['short description', 'summary', 'highlights'],
  images: ['image', 'images', 'image url', 'product image', 'photo', 'picture'],
  warranty: ['warranty', 'warranty period', 'guarantee'],
  processor: ['processor', 'cpu', 'cpu model', 'processor type'],
  ram: ['ram', 'memory', 'ram size', 'memory capacity'],
  storage: ['storage', 'ssd', 'hdd', 'hard drive', 'storage capacity'],
  gpu: ['gpu', 'graphics', 'graphics card', 'video card'],
  socket: ['socket', 'cpu socket', 'socket type'],
  formFactor: ['form factor', 'size', 'chassis'],
  wattage: ['wattage', 'power', 'power supply', 'tdp'],
};

export class ExcelImportService {
  /**
   * Intelligently detect headers and map to internal canonical schema
   */
  public detectColumnMappings(headers: string[]): Record<string, string> {
    const mappings: Record<string, string> = {};

    for (const rawHeader of headers) {
      const cleanHeader = rawHeader.toLowerCase().trim();
      let matched = false;

      for (const [canonicalKey, synonyms] of Object.entries(CANONICAL_FIELD_MAPPINGS)) {
        if (synonyms.some(s => cleanHeader === s || cleanHeader.includes(s))) {
          mappings[rawHeader] = canonicalKey;
          matched = true;
          break;
        }
      }

      if (!matched) {
        mappings[rawHeader] = cleanHeader.replace(/[^a-z0-9]/g, '_');
      }
    }

    return mappings;
  }

  /**
   * Parses Excel/CSV buffer, executes column auto-mapping, and runs validation rules
   */
  async parseAndValidateBuffer(
    buffer: Buffer,
    resellerId: string,
    resellerCode: string,
    fileName: string,
    customMappings?: Record<string, string>
  ): Promise<{
    reportId: string;
    totalRows: number;
    validRowsCount: number;
    errorRowsCount: number;
    duplicateRowsCount: number;
    detectedHeaders: string[];
    columnMappings: Record<string, string>;
    rows: ProductImportRow[];
  }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    if (rawData.length === 0) {
      throw new Error('The uploaded Excel file contains no data rows.');
    }

    const detectedHeaders = Object.keys(rawData[0]);
    const mappings = customMappings || this.detectColumnMappings(detectedHeaders);

    const categories = await categoryRepository.find();
    const brands = await brandRepository.find();
    const existingProducts = await productRepository.find();
    const existingSkus = new Set(existingProducts.map(p => p.sku.toLowerCase()));

    const rows: ProductImportRow[] = [];
    let validRowsCount = 0;
    let errorRowsCount = 0;
    let duplicateRowsCount = 0;
    const errorsList: { row: number; field: string; message: string }[] = [];

    for (let index = 0; index < rawData.length; index++) {
      const rawRow = rawData[index];
      const rowNumber = index + 2; // Excel 1-indexed plus header row
      const missingRequiredFields: string[] = [];
      const invalidFields: { field: string; message: string }[] = [];
      const normalizedSpecs: Record<string, string> = {};

      const mappedData: Record<string, any> = {};

      // Map raw headers to canonical fields
      for (const [header, val] of Object.entries(rawRow)) {
        const canonicalKey = mappings[header] || header;
        const strVal = String(val).trim();
        mappedData[canonicalKey] = strVal;

        // Collect tech specs
        if (['processor', 'ram', 'storage', 'gpu', 'socket', 'formFactor', 'wattage'].includes(canonicalKey) && strVal) {
          normalizedSpecs[canonicalKey] = strVal;
        }
      }

      // Mandatory validation checks
      if (!mappedData.name) missingRequiredFields.push('Product Name');
      if (!mappedData.sku) missingRequiredFields.push('SKU');
      if (!mappedData.price) missingRequiredFields.push('Price');
      if (!mappedData.stock && mappedData.stock !== '0') missingRequiredFields.push('Stock Quantity');
      if (!mappedData.categoryName) missingRequiredFields.push('Category');

      // Price validation
      const priceNum = parseFloat(mappedData.price);
      if (mappedData.price && (isNaN(priceNum) || priceNum <= 0)) {
        invalidFields.push({ field: 'Price', message: 'Price must be a positive number' });
      }

      // Stock validation
      const stockNum = parseInt(mappedData.stock, 10);
      if (mappedData.stock && (isNaN(stockNum) || stockNum < 0)) {
        invalidFields.push({ field: 'Stock', message: 'Stock quantity cannot be negative' });
      }

      // Duplicate SKU Check
      const skuClean = (mappedData.sku || '').toLowerCase();
      const isDuplicateSku = existingSkus.has(skuClean);
      if (isDuplicateSku) {
        duplicateRowsCount++;
      }

      // Match category & brand
      let matchedCategory = categories.find(c =>
        c.name.toLowerCase() === (mappedData.categoryName || '').toLowerCase()
      );
      if (!matchedCategory && categories.length > 0) {
        matchedCategory = categories[0];
      }

      let matchedBrand = brands.find(b =>
        b.name.toLowerCase() === (mappedData.brandName || '').toLowerCase()
      );
      if (!matchedBrand && brands.length > 0) {
        matchedBrand = brands[0];
      }

      const isValid = missingRequiredFields.length === 0 && invalidFields.length === 0;

      if (isValid) {
        validRowsCount++;
      } else {
        errorRowsCount++;
        for (const m of missingRequiredFields) {
          errorsList.push({ row: rowNumber, field: m, message: 'Required field is missing' });
        }
        for (const inv of invalidFields) {
          errorsList.push({ row: rowNumber, field: inv.field, message: inv.message });
        }
      }

      const normalizedProduct: Partial<Product> = {
        name: mappedData.name,
        sku: mappedData.sku,
        barcode: mappedData.barcode,
        price: isNaN(priceNum) ? 0 : priceNum,
        compareAtPrice: mappedData.compareAtPrice ? parseFloat(mappedData.compareAtPrice) : undefined,
        costPrice: mappedData.costPrice ? parseFloat(mappedData.costPrice) : undefined,
        stock: isNaN(stockNum) ? 0 : stockNum,
        description: mappedData.description || `${mappedData.name} - High-Performance Enterprise Grade Hardware.`,
        shortDescription: mappedData.shortDescription,
        categoryId: matchedCategory?.id || 'cat_general',
        categoryName: matchedCategory?.name || mappedData.categoryName || 'Hardware',
        brandId: matchedBrand?.id || 'brand_general',
        brandName: matchedBrand?.name || mappedData.brandName || 'OEM',
        images: mappedData.images ? [mappedData.images] : ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'],
        thumbnail: mappedData.images || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
        specifications: normalizedSpecs,
        warranty: mappedData.warranty || '1 Year Manufacturer Warranty',
        sellerType: 'RESELLER',
        resellerId,
        resellerCode,
        currency: 'AED',
        approvalStatus: 'PENDING_APPROVAL',
        isActive: false,
      };

      rows.push({
        rowNumber,
        data: rawRow,
        normalizedProduct,
        missingRequiredFields,
        invalidFields,
        isDuplicateSku,
        isValid,
      });
    }

    const reportId = `import_${uuidv4()}`;
    const report: ProductImportReport = {
      id: reportId,
      resellerId,
      resellerCode,
      fileName,
      totalRows: rawData.length,
      validRows: validRowsCount,
      errorRows: errorRowsCount,
      duplicateRows: duplicateRowsCount,
      importedCount: 0,
      status: 'PREVIEW',
      errors: errorsList,
      createdAt: new Date().toISOString(),
    };

    await importRepository.create(report);

    return {
      reportId,
      totalRows: rawData.length,
      validRowsCount,
      errorRowsCount,
      duplicateRowsCount,
      detectedHeaders,
      columnMappings: mappings,
      rows,
    };
  }

  /**
   * Finalizes import of confirmed rows into catalog
   */
  async executeImport(
    reportId: string,
    resellerId: string,
    resellerCode: string,
    productsToImport: Partial<Product>[],
    duplicateAction: 'SKIP' | 'UPDATE' = 'SKIP'
  ): Promise<{ importedCount: number; updatedCount: number; skippedCount: number }> {
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const prodData of productsToImport) {
      if (!prodData.name || !prodData.sku || !prodData.price) continue;

      const existing = await productRepository.findBySku(prodData.sku);
      if (existing) {
        if (duplicateAction === 'UPDATE' && existing.resellerId === resellerId) {
          await productRepository.update(existing.id, {
            ...prodData,
            approvalStatus: 'PENDING_APPROVAL',
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        const slug = prodData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') + `-${Date.now().toString(36)}`;

        const newProd: Product = {
          id: `prod_${uuidv4()}`,
          name: prodData.name,
          slug,
          sku: prodData.sku,
          barcode: prodData.barcode,
          brandId: prodData.brandId || 'brand_general',
          brandName: prodData.brandName || 'OEM',
          categoryId: prodData.categoryId || 'cat_general',
          categoryName: prodData.categoryName || 'Hardware',
          sellerType: 'RESELLER',
          resellerId,
          resellerCode,
          description: prodData.description || prodData.name,
          shortDescription: prodData.shortDescription,
          price: prodData.price,
          salePrice: prodData.salePrice,
          compareAtPrice: prodData.compareAtPrice,
          costPrice: prodData.costPrice,
          currency: prodData.currency || 'AED',
          stock: prodData.stock || 0,
          reservedStock: 0,
          lowStockThreshold: 5,
          images: prodData.images && prodData.images.length > 0 ? prodData.images : ['https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'],
          thumbnail: prodData.thumbnail || prodData.images?.[0] || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
          specifications: prodData.specifications || {},
          features: prodData.features || [],
          tags: prodData.tags || [],
          warranty: prodData.warranty || '1 Year Manufacturer Warranty',
          rating: 5.0,
          reviewCount: 0,
          isFeatured: false,
          isActive: false, // Requires Admin Approval
          approvalStatus: 'PENDING_APPROVAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await productRepository.create(newProd);
        importedCount++;
      }
    }

    // Update report
    await importRepository.update(reportId, {
      importedCount,
      status: 'COMPLETED',
    });

    // Audit Log
    await auditService.log({
      userId: resellerId,
      userEmail: `${resellerCode}@reseller.com`,
      userRole: 'RESELLER',
      resellerId,
      action: 'EXCEL_PRODUCTS_IMPORTED',
      resource: 'product_imports',
      resourceId: reportId,
      details: { importedCount, updatedCount, skippedCount },
    });

    return { importedCount, updatedCount, skippedCount };
  }

  /**
   * Generates a downloadable standard Excel listing template
   */
  generateSampleTemplateBuffer(): Buffer {
    const templateData = [
      {
        'Product Name': 'ASUS ROG Strix GeForce RTX 4090 OC 24GB',
        'SKU': 'ROG-RTX4090-O24G',
        'Barcode': '195553927429',
        'Brand': 'ASUS',
        'Category': 'Components',
        'Price': 7499,
        'Compare At Price': 7999,
        'Cost Price': 6800,
        'Stock': 15,
        'GPU': 'RTX 4090 24GB GDDR6X',
        'Wattage': '450W',
        'Warranty': '3 Years Manufacturer Warranty',
        'Description': 'Flagship enthusiast graphics card with axial-tech fans and 3.5-slot design.',
        'Image': 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
      },
      {
        'Product Name': 'Intel Core i9-14900K 24-Core Desktop Processor',
        'SKU': 'BX8071514900K',
        'Barcode': '735858547285',
        'Brand': 'Intel',
        'Category': 'Components',
        'Price': 2249,
        'Compare At Price': 2499,
        'Cost Price': 1950,
        'Stock': 28,
        'Processor': 'Core i9-14900K (6.0 GHz Turbo)',
        'Socket': 'LGA1700',
        'Wattage': '125W Base / 253W Boost',
        'Warranty': '3 Years',
        'Description': 'Ultimate gaming and workstation performance with 24 cores (8 P-cores + 16 E-cores).',
        'Image': 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product_Listing_Template');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const excelImportService = new ExcelImportService();
