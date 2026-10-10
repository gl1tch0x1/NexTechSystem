import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { Readable } from 'node:stream';
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
  condition: ['condition', 'item condition', 'product condition'],
  model: ['model', 'hardware model'],
  partNumber: ['part number', 'mpn', 'manufacturer part number'],
  price: ['price', 'selling price', 'retail price', 'unit price', 'rate', 'msrp', 'price (aed)'],
  compareAtPrice: ['compare at price', 'original price', 'regular price', 'list price', 'mrp', 'compare at price (aed)'],
  costPrice: ['cost', 'cost price', 'wholesale price', 'buy price', 'cost price (aed)'],
  stock: ['stock', 'qty', 'quantity', 'available qty', 'inventory', 'units', 'stock quantity'],
  lowStockThreshold: ['low stock threshold', 'threshold', 'min stock', 'safety stock'],
  description: ['description', 'details', 'overview', 'product description'],
  shortDescription: ['short description', 'summary', 'highlights'],
  images: ['image', 'images', 'image url', 'product image', 'photo', 'picture'],
  warranty: ['warranty', 'warranty period', 'guarantee'],
  countryOfOrigin: ['country of origin', 'origin'],
  // Hardware specifications
  processorBrand: ['processor brand', 'cpu brand'],
  processor: ['processor model', 'processor', 'cpu', 'cpu model', 'processor type'],
  processorGeneration: ['processor generation', 'cpu generation', 'generation'],
  processorCores: ['processor cores', 'cpu cores', 'cores'],
  socket: ['socket', 'cpu socket', 'socket type'],
  ram: ['ram capacity', 'ram', 'memory', 'ram size', 'memory capacity'],
  ramType: ['ram type', 'memory type'],
  storage: ['storage capacity', 'storage', 'ssd', 'hdd', 'hard drive', 'storage capacity', 'storage size'],
  storageType: ['storage type', 'drive type', 'interface type'],
  gpu: ['gpu', 'graphics', 'graphics card', 'video card', 'gpu chipset'],
  graphicsMemory: ['graphics memory', 'vram', 'gpu memory', 'video memory'],
  formFactor: ['form factor', 'size', 'chassis', 'case type', 'computer form factor'],
  wattage: ['wattage', 'power', 'power supply', 'tdp', 'power supply wattage', 'psu'],
  screenSize: ['screen size', 'display size', 'screen'],
  resolution: ['resolution', 'display resolution', 'screen resolution'],
  operatingSystem: ['operating system', 'os'],
};

export class ExcelImportService {
  /**
   * Intelligently detect headers and map to internal canonical schema
   */
  public detectColumnMappings(headers: string[]): Record<string, string> {
    const mappingsMap = new Map<string, string>();
    const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

    for (const rawHeader of headers) {
      if (typeof rawHeader !== 'string' || FORBIDDEN_KEYS.has(rawHeader.trim())) continue;
      const cleanHeader = rawHeader.toLowerCase().trim();
      let matched = false;

      for (const [canonicalKey, synonyms] of Object.entries(CANONICAL_FIELD_MAPPINGS)) {
        if (synonyms.some(s => cleanHeader === s || cleanHeader.includes(s))) {
          mappingsMap.set(rawHeader, canonicalKey);
          matched = true;
          break;
        }
      }

      if (!matched) {
        mappingsMap.set(rawHeader, cleanHeader.replace(/[^a-z0-9]/g, '_'));
      }
    }

    return Object.fromEntries(mappingsMap);
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
    const cleanFileName = (fileName || '').trim();
    const extension = cleanFileName.toLowerCase().split('.').pop() || '';
    const allowedExtensions = ['xlsx', 'xls', 'csv', 'tsv'];
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Only .xlsx, .xls, and .csv files are supported.');
    }

    // Verify magic bytes / file signatures to block polyglots and executable payloads
    if (buffer.length < 4) {
      throw new Error('Uploaded file is corrupted or empty.');
    }

    if (extension === 'xlsx') {
      const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
      if (!isZip) {
        throw new Error('File content does not match .xlsx format (invalid file signature).');
      }
    } else if (extension === 'xls') {
      const isOle = buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
      const snippet = buffer.subarray(0, 100).toString('utf8').toLowerCase();
      const isHtmlTable = snippet.includes('<html') || snippet.includes('<table');
      if (!isOle && !isHtmlTable) {
        throw new Error('File content does not match .xls format (invalid file signature).');
      }
    } else if (extension === 'csv' || extension === 'tsv') {
      const isMz = buffer[0] === 0x4d && buffer[1] === 0x5a;
      const isElf = buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46;
      if (isMz || isElf) {
        throw new Error('Executable binaries disguised as CSV are strictly prohibited.');
      }
    }

    const workbook = new ExcelJS.Workbook();
    if (extension === 'csv' || extension === 'tsv') {
      try {
        await workbook.csv.read(Readable.from([buffer]));
      } catch {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        await workbook.xlsx.load(xlsxBuffer);
      }
    } else if (extension === 'xls') {
      // Legacy Excel (.xls / BIFF8 / HTML table): parse via SheetJS and normalize to xlsx buffer
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      await workbook.xlsx.load(xlsxBuffer);
    } else {
      // Modern Excel (.xlsx) with resilient SheetJS fallback
      try {
        await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      } catch {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        await workbook.xlsx.load(xlsxBuffer);
      }
    }
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error('The uploaded file contains no worksheet.');
    const headerRow = worksheet.getRow(1);
    const headers = Array.from({ length: headerRow.cellCount }, (_, index) => headerRow.getCell(index + 1).text.trim());
    const rawData: { rowNumber: number; data: Record<string, string> }[] = [];
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const data = Object.fromEntries(headers.flatMap((header, index) =>
        header && !['__proto__', 'constructor', 'prototype'].includes(header)
          ? [[header, row.getCell(index + 1).text]]
          : []
      ));
      if (Object.values(data).some(value => value.trim())) rawData.push({ rowNumber, data });
    }
    if (rawData.length === 0) {
      throw new Error('The uploaded Excel file contains no data rows.');
    }

    const detectedHeaders = Object.keys(rawData[0].data);
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
      const { data: rawRow, rowNumber } = rawData[index];
      const missingRequiredFields: string[] = [];
      const invalidFields: { field: string; message: string }[] = [];
      const normalizedSpecsMap = new Map<string, string>();
      const mappedDataMap = new Map<string, string>();
      const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

      // Map raw headers to canonical fields safely via Map
      for (const [header, val] of Object.entries(rawRow)) {
        if (FORBIDDEN_KEYS.has(header)) continue;
        const canonicalKey = mappings[header] || header;
        if (FORBIDDEN_KEYS.has(canonicalKey)) continue;
        const strVal = String(val).trim();
        mappedDataMap.set(canonicalKey, strVal);

        // Collect hardware specs: all specifications beyond fundamental catalog attributes
        const nonSpecAttributes = new Set([
          'name', 'sku', 'barcode', 'brandName', 'categoryName',
          'price', 'compareAtPrice', 'costPrice', 'stock', 'lowStockThreshold',
          'description', 'shortDescription', 'images'
        ]);
        if (!nonSpecAttributes.has(canonicalKey) && strVal) {
          normalizedSpecsMap.set(canonicalKey, strVal);
          normalizedSpecsMap.set(header.trim(), strVal);
        }
      }

      const mappedData: Record<string, any> = Object.fromEntries(mappedDataMap);
      const normalizedSpecs: Record<string, string> = Object.fromEntries(normalizedSpecsMap);


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
    const report = await importRepository.findById(reportId);
    if (!report || report.resellerId !== resellerId) throw new Error('Import report does not belong to this reseller.');
    if (report.status === 'COMPLETED') throw new Error('This import has already been completed.');
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const prodData of productsToImport) {
      if (!prodData.name || !prodData.sku || typeof prodData.price !== 'number' || !Number.isFinite(prodData.price) || prodData.price <= 0 ||
          (prodData.stock !== undefined && (!Number.isInteger(prodData.stock) || prodData.stock < 0))) {
        skippedCount++;
        continue;
      }

      const existing = await productRepository.findBySku(prodData.sku);
      if (existing) {
        if (duplicateAction === 'UPDATE' && existing.resellerId === resellerId) {
          const changes = {
            name: prodData.name,
            description: prodData.description,
            shortDescription: prodData.shortDescription,
            barcode: prodData.barcode,
            brandId: prodData.brandId,
            brandName: prodData.brandName,
            categoryId: prodData.categoryId,
            categoryName: prodData.categoryName,
            price: prodData.price,
            salePrice: prodData.salePrice,
            compareAtPrice: prodData.compareAtPrice,
            costPrice: prodData.costPrice,
            stock: prodData.stock,
            images: prodData.images,
            thumbnail: prodData.thumbnail,
            specifications: prodData.specifications,
            features: prodData.features,
            tags: prodData.tags,
            warranty: prodData.warranty,
            approvalStatus: 'PENDING_APPROVAL',
            isActive: false,
            updatedAt: new Date().toISOString(),
          };
          await productRepository.update(existing.id, Object.fromEntries(
            Object.entries(changes).filter(([, value]) => value !== undefined)
          ) as Partial<Product>);
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
   * Generates a downloadable standard Excel listing template aligned with Hardware SKU specifications
   */
  async generateSampleTemplateBuffer(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NexTech Systems Enterprise Hardware Catalog Engine';
    workbook.created = new Date();

    // ----------------------------------------------------
    // Sheet 1: Hardware SKU Catalog Template
    // ----------------------------------------------------
    const worksheet = workbook.addWorksheet('Hardware_SKU_Catalog', {
      views: [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2', activeCell: 'A2' }],
      properties: { defaultRowHeight: 22 },
    });

    const columnsDefinition: Array<{ header: string; key: string; width: number }> = [
      { header: 'Product Name', key: 'name', width: 42 },
      { header: 'SKU', key: 'sku', width: 28 },
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Brand', key: 'brand', width: 20 },
      { header: 'Condition', key: 'condition', width: 26 },
      { header: 'Model', key: 'model', width: 24 },
      { header: 'Part Number', key: 'partNumber', width: 26 },
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'Price (AED)', key: 'price', width: 16 },
      { header: 'Compare At Price (AED)', key: 'compareAtPrice', width: 22 },
      { header: 'Cost Price (AED)', key: 'costPrice', width: 18 },
      { header: 'Stock Quantity', key: 'stock', width: 16 },
      { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 20 },
      { header: 'Processor Brand', key: 'processorBrand', width: 20 },
      { header: 'Processor Model', key: 'processorModel', width: 32 },
      { header: 'Processor Generation', key: 'processorGen', width: 26 },
      { header: 'Processor Cores', key: 'processorCores', width: 24 },
      { header: 'Socket Type', key: 'socket', width: 22 },
      { header: 'RAM Capacity', key: 'ramCapacity', width: 22 },
      { header: 'RAM Type', key: 'ramType', width: 22 },
      { header: 'Storage Capacity', key: 'storageCapacity', width: 22 },
      { header: 'Storage Type', key: 'storageType', width: 26 },
      { header: 'Graphics Card', key: 'gpu', width: 32 },
      { header: 'Graphics Memory', key: 'graphicsMemory', width: 22 },
      { header: 'Form Factor', key: 'formFactor', width: 22 },
      { header: 'Power Supply Wattage', key: 'wattage', width: 26 },
      { header: 'Warranty', key: 'warranty', width: 30 },
      { header: 'Country of Origin', key: 'origin', width: 20 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Image URL', key: 'image', width: 42 },
    ];

    worksheet.columns = columnsDefinition.map(c => ({
      header: c.header,
      key: c.key,
      width: c.width,
    }));

    // Header Row Styling: Dark Slate background (#0F172A), bold white text, amber accent border
    const headerRow = worksheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' },
      };
      cell.font = {
        name: 'Segoe UI',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FFF59E0B' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    // 7 Real-World Hardware Examples across distinct categories
    const sampleHardwareProducts = [
      {
        name: 'ASUS ROG Strix GeForce RTX 4090 OC 24GB',
        sku: 'ROG-RTX4090-O24G-GAMING',
        category: 'Graphics Cards (GPUs)',
        brand: 'ASUS',
        condition: 'Brand New (Factory Sealed)',
        model: 'ROG Strix OC',
        partNumber: '90YV0ID0-M0NA00',
        barcode: '195553927429',
        price: 7499,
        compareAtPrice: 7999,
        costPrice: 6800,
        stock: 15,
        lowStockThreshold: 3,
        processorBrand: 'N/A',
        processorModel: 'N/A',
        processorGen: 'N/A',
        processorCores: 'N/A',
        socket: 'PCIe 4.0 x16',
        ramCapacity: 'N/A',
        ramType: 'N/A',
        storageCapacity: 'N/A',
        storageType: 'N/A',
        gpu: 'NVIDIA GeForce RTX 4090',
        graphicsMemory: '24GB GDDR6X',
        formFactor: '3.5-Slot ATX',
        wattage: '1000W PSU (450W TDP)',
        warranty: '3 Years Manufacturer Warranty',
        origin: 'Taiwan',
        description: 'Flagship enthusiast graphics card with axial-tech fans, diecast shroud, and 24GB GDDR6X VRAM.',
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Intel Core i9-14900K 24-Core Desktop Processor',
        sku: 'BX8071514900K',
        category: 'Processors (CPUs)',
        brand: 'Intel',
        condition: 'Brand New (Factory Sealed)',
        model: 'Core i9-14900K',
        partNumber: 'CM8071505092000',
        barcode: '735858547285',
        price: 2249,
        compareAtPrice: 2499,
        costPrice: 1950,
        stock: 28,
        lowStockThreshold: 5,
        processorBrand: 'Intel',
        processorModel: 'Core i9-14900K (6.0 GHz Turbo)',
        processorGen: '14th Gen Raptor Lake Refresh',
        processorCores: '24 Cores (8P + 16E, 32 Threads)',
        socket: 'LGA1700',
        ramCapacity: 'Up to 192GB',
        ramType: 'DDR5-5600 / DDR4-3200',
        storageCapacity: 'N/A',
        storageType: 'N/A',
        gpu: 'Intel UHD Graphics 770',
        graphicsMemory: 'Shared System Memory',
        formFactor: 'Desktop Processor',
        wattage: '125W Base / 253W Max Turbo',
        warranty: '3 Years Manufacturer Warranty',
        origin: 'Vietnam',
        description: 'Ultimate performance unlocked desktop processor up to 6.0 GHz Intel Thermal Velocity Boost.',
        image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'AMD Ryzen 9 7950X 16-Core 32-Thread Processor',
        sku: '100-100000514WOF',
        category: 'Processors (CPUs)',
        brand: 'AMD',
        condition: 'Brand New (Factory Sealed)',
        model: 'Ryzen 9 7950X',
        partNumber: '100-000000514',
        barcode: '730143314541',
        price: 1999,
        compareAtPrice: 2299,
        costPrice: 1750,
        stock: 35,
        lowStockThreshold: 5,
        processorBrand: 'AMD',
        processorModel: 'Ryzen 9 7950X',
        processorGen: 'Zen 4 (5nm)',
        processorCores: '16 Cores / 32 Threads',
        socket: 'AM5',
        ramCapacity: 'Up to 128GB',
        ramType: 'DDR5-5200 / EXPO',
        storageCapacity: 'N/A',
        storageType: 'N/A',
        gpu: 'AMD Radeon Graphics (2 CU)',
        graphicsMemory: 'Shared System Memory',
        formFactor: 'Desktop Processor',
        wattage: '170W TDP / 230W Max Socket Power',
        warranty: '3 Years Manufacturer Warranty',
        origin: 'Malaysia',
        description: 'Elite gaming and workstation processor built on TSMC 5nm Zen 4 architecture with PCIe 5.0 support.',
        image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Samsung 990 PRO 4TB PCIe 4.0 M.2 NVMe SSD',
        sku: 'MZ-V9P4T0B-AM',
        category: 'Storage (NVMe/SSD/HDD)',
        brand: 'Samsung',
        condition: 'Brand New (Factory Sealed)',
        model: '990 PRO',
        partNumber: 'MZ-V9P4T0BW',
        barcode: '887276761152',
        price: 1399,
        compareAtPrice: 1549,
        costPrice: 1180,
        stock: 50,
        lowStockThreshold: 10,
        processorBrand: 'N/A',
        processorModel: 'Samsung Pascal Controller',
        processorGen: 'N/A',
        processorCores: 'N/A',
        socket: 'M.2 2280 Key M',
        ramCapacity: '4GB LPDDR4 DRAM Cache',
        ramType: 'LPDDR4',
        storageCapacity: '4TB',
        storageType: 'PCIe Gen 4.0 x4, NVMe 2.0 SSD',
        gpu: 'N/A',
        graphicsMemory: 'N/A',
        formFactor: 'M.2 2280',
        wattage: '5.5W Avg / 8.5W Peak',
        warranty: '5 Years Manufacturer Warranty',
        origin: 'South Korea',
        description: 'Blazing read speeds up to 7,450 MB/s and write speeds up to 6,900 MB/s with thermal heat spreader.',
        image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5-6000',
        sku: 'CMP64GX5M2B6000C30',
        category: 'Memory (RAM)',
        brand: 'Corsair',
        condition: 'Brand New (Factory Sealed)',
        model: 'Dominator Titanium',
        partNumber: 'CMP64GX5M2B6000C30',
        barcode: '840006607212',
        price: 1149,
        compareAtPrice: 1299,
        costPrice: 950,
        stock: 40,
        lowStockThreshold: 8,
        processorBrand: 'N/A',
        processorModel: 'N/A',
        processorGen: 'N/A',
        processorCores: 'N/A',
        socket: '288-Pin DIMM',
        ramCapacity: '64GB (2 x 32GB)',
        ramType: 'DDR5-6000MHz CL30',
        storageCapacity: 'N/A',
        storageType: 'N/A',
        gpu: 'N/A',
        graphicsMemory: 'N/A',
        formFactor: 'UDIMM',
        wattage: '1.40V Operating Voltage',
        warranty: 'Limited Lifetime Warranty',
        origin: 'Taiwan',
        description: 'Premium forged aluminum DDR5 memory with customizable top bars and patented DHX cooling.',
        image: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'Dell PowerEdge R760 2U Enterprise Rackmount Server',
        sku: 'PER760-2X4410Y-128G',
        category: 'Enterprise Rackmount Servers',
        brand: 'Dell',
        condition: 'Enterprise Recertified',
        model: 'PowerEdge R760',
        partNumber: '210-BFPR-PER760',
        barcode: '884116439128',
        price: 28500,
        compareAtPrice: 31000,
        costPrice: 24200,
        stock: 6,
        lowStockThreshold: 2,
        processorBrand: 'Intel Xeon',
        processorModel: '2x Intel Xeon Silver 4410Y (24 Cores total)',
        processorGen: '4th Gen Xeon Scalable (Sapphire Rapids)',
        processorCores: '24 Cores / 48 Threads',
        socket: 'Dual LGA4677',
        ramCapacity: '128GB (4x32GB) ECC Registered',
        ramType: 'DDR5-4800MHz ECC RDIMM',
        storageCapacity: '4x 1.92TB NVMe Read-Intensive SSD (7.68TB Raw)',
        storageType: 'U.2 PCIe NVMe Enterprise SSD + PERC H755 RAID',
        gpu: 'Matrox G200 Integrated',
        graphicsMemory: '16MB',
        formFactor: '2U Rackmount',
        wattage: 'Dual 1400W Platinum Redundant Hot-Plug PSUs',
        warranty: '3 Years Dell ProSupport Next Business Day Onsite',
        origin: 'Ireland',
        description: 'High-density 2U dual-socket enterprise rack server optimized for virtualization, database, and cloud workloads.',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      },
      {
        name: 'ASUS ROG Zephyrus G16 OLED Gaming Laptop',
        sku: 'GU605MY-QR044W',
        category: 'Laptops & Workstations',
        brand: 'ASUS',
        condition: 'Brand New (Factory Sealed)',
        model: 'ROG Zephyrus G16',
        partNumber: '90NR0HY1-M00270',
        barcode: '4711387520146',
        price: 11999,
        compareAtPrice: 12999,
        costPrice: 10400,
        stock: 12,
        lowStockThreshold: 3,
        processorBrand: 'Intel',
        processorModel: 'Intel Core Ultra 9 185H (16 Cores, 5.1 GHz)',
        processorGen: 'Meteor Lake with Intel AI Boost NPU',
        processorCores: '16 Cores (6P + 8E + 2 Low Power E-cores)',
        socket: 'BGA Soldered',
        ramCapacity: '32GB LPDDR5X',
        ramType: 'LPDDR5X-7467MHz',
        storageCapacity: '2TB',
        storageType: 'PCIe 4.0 NVMe M.2 SSD',
        gpu: 'NVIDIA GeForce RTX 4090 Laptop GPU (16GB)',
        graphicsMemory: '16GB GDDR6 (115W TGP)',
        formFactor: '16-Inch CNC Aluminum Ultrabook',
        wattage: '240W AC Adapter / 90Wh Battery',
        warranty: '2 Years ASUS International Warranty',
        origin: 'China',
        description: 'Ultra-slim CNC aluminum chassis with 2.5K 240Hz ROG Nebula OLED display and dedicated Intel AI Boost NPU.',
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
      },
    ];

    for (let i = 0; i < sampleHardwareProducts.length; i++) {
      const row = worksheet.addRow(sampleHardwareProducts[i]);
      row.height = 24;
      const isEven = i % 2 === 0;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.alignment = { vertical: 'middle', horizontal: colNum >= 9 && colNum <= 13 ? 'right' : 'left' };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    }

    // ----------------------------------------------------
    // Sheet 2: Taxonomy & Guidelines Reference Sheet
    // ----------------------------------------------------
    const refSheet = workbook.addWorksheet('Taxonomy_&_Guidelines', {
      properties: { defaultRowHeight: 20 },
    });

    refSheet.columns = [
      { header: 'Taxonomy Field', key: 'field', width: 26 },
      { header: 'Supported Values & Presets', key: 'values', width: 62 },
      { header: 'Requirements & Guidance', key: 'rules', width: 45 },
    ];

    const refHeader = refSheet.getRow(1);
    refHeader.height = 30;
    refHeader.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const referenceTaxonomy = [
      {
        field: 'Product Name',
        values: 'Full official manufacturer product name with model and specs',
        rules: 'MANDATORY. Must be between 3 and 255 characters.',
      },
      {
        field: 'SKU',
        values: 'Unique alphanumeric part number or stock keeping unit',
        rules: 'MANDATORY & UNIQUE. Duplicates trigger skip/update rule.',
      },
      {
        field: 'Category',
        values: 'Graphics Cards (GPUs), Processors (CPUs), Storage (NVMe/SSD/HDD), Memory (RAM), Enterprise Rackmount Servers, Laptops & Workstations, Motherboards, Power Supplies (PSUs), Components',
        rules: 'MANDATORY. Matches catalog taxonomy automatically.',
      },
      {
        field: 'Brand',
        values: 'ASUS, Intel, AMD, NVIDIA, Corsair, Dell, HP, Samsung, Kingston, Lenovo, Gigabyte, MSI, Seagate, Western Digital',
        rules: 'MANDATORY. Matched to registered hardware manufacturers.',
      },
      {
        field: 'Condition',
        values: 'Brand New (Factory Sealed), Open Box, Refurbished, Enterprise Recertified, Used (Tested & Cleaned)',
        rules: 'Standard hardware condition taxonomy.',
      },
      {
        field: 'Price (AED)',
        values: 'Standard customer retail selling price in AED (Dirhams)',
        rules: 'MANDATORY. Must be a positive decimal or integer.',
      },
      {
        field: 'Stock Quantity',
        values: 'Integer count of units available for immediate dispatch',
        rules: 'MANDATORY. Must be 0 or a positive integer.',
      },
      {
        field: 'Socket Type',
        values: 'LGA1700, AM5, LGA4677, SP5, BGA, PCIe 4.0 x16, M.2 2280',
        rules: 'Used for PC Builder and compatibility engine verification.',
      },
      {
        field: 'RAM / Storage Types',
        values: 'DDR5, DDR4, LPDDR5X, PCIe 4.0 NVMe, PCIe 5.0, SAS 12Gbps',
        rules: 'Powers hardware filter facets and spec comparison matrix.',
      },
      {
        field: 'Image URL',
        values: 'Direct HTTPS URL to high-resolution product image (JPG, PNG, WebP)',
        rules: 'If blank, an enterprise category placeholder will be assigned.',
      },
    ];

    for (const ref of referenceTaxonomy) {
      const r = refSheet.addRow(ref);
      r.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 9.5 };
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}

export const excelImportService = new ExcelImportService();
