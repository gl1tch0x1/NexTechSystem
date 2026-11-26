import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ExcelJS from 'exceljs';
import { productRepository } from '../repositories/product.repository.js';
import { categoryRepository, brandRepository } from '../repositories/category.repository.js';
import { Product, Category, Brand, WarehouseLocationStock } from '../types/index.js';

export interface CategoryMapping {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  image: string;
  order: number;
}

export const CATEGORY_MAP: Record<string, CategoryMapping> = {
  'ACER BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Acer', order: 1, image: '' },
  'All in One': { id: 'cat_all_in_one', name: 'All-in-One PCs', slug: 'all-in-one-pcs', brand: null, order: 2, image: '' },
  'All in One ': { id: 'cat_all_in_one', name: 'All-in-One PCs', slug: 'all-in-one-pcs', brand: null, order: 2, image: '' },
  'ASUS BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'ASUS', order: 1, image: '' },
  'Dell ALIENWARE & PRECISION': { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', brand: 'Dell', order: 3, image: '' },
  'DELL BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Dell', order: 1, image: '' },
  'DELL XPS BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Dell', order: 1, image: '' },
  'DESKTOPS': { id: 'cat_desktops', name: 'Desktops', slug: 'desktops', brand: null, order: 4, image: '' },
  'GAMING LAPTOP BRAND NEW': { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', brand: null, order: 3, image: '' },
  'HEADSET': { id: 'cat_headsets', name: 'Headsets & Audio', slug: 'headsets-audio', brand: null, order: 5, image: '' },
  'HP BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'HP', order: 1, image: '' },
  'HP DOCKING STATION': { id: 'cat_accessories', name: 'Accessories', slug: 'accessories', brand: 'HP', order: 6, image: '' },
  'HP OMEN': { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', brand: 'HP', order: 3, image: '' },
  'HP REFURBISHED / OPEN BOX': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'HP', order: 1, image: '' },
  'LENOVO BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Lenovo', order: 1, image: '' },
  'MONITORS': { id: 'cat_monitors', name: 'Monitors', slug: 'monitors', brand: null, order: 7, image: '' },
  'MSI BRAND NEW': { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', brand: 'MSI', order: 3, image: '' },
  'OPEN BOX REFURB': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: null, order: 1, image: '' },
  'SCANNER': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: null, order: 8, image: '' },
  'UBIQUITI': { id: 'cat_networking', name: 'Networking', slug: 'networking', brand: 'Ubiquiti', order: 9, image: '' },
  'USED APPLE': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Apple', order: 1, image: '' },
  'USED LAPTOP': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: null, order: 1, image: '' },
  'Z ACCESSORIES': { id: 'cat_accessories', name: 'Accessories', slug: 'accessories', brand: null, order: 6, image: '' },
  'Z ADATA BRAND NEW': { id: 'cat_storage', name: 'Storage & Drives', slug: 'storage-drives', brand: 'ADATA', order: 10, image: '' },
  'Z CISCO': { id: 'cat_networking', name: 'Networking', slug: 'networking', brand: 'Cisco', order: 9, image: '' },
  'Z CPU': { id: 'cat_components', name: 'Components', slug: 'components', brand: 'Intel', order: 11, image: '' },
  'Z GAMING ACCESSORIES': { id: 'cat_gaming_accessories', name: 'Gaming Accessories', slug: 'gaming-accessories', brand: null, order: 12, image: '' },
  'Z HAND BAGS': { id: 'cat_bags_cases', name: 'Bags & Cases', slug: 'bags-cases', brand: null, order: 13, image: '' },
  'Z HARD DISK DRIVE': { id: 'cat_storage', name: 'Storage & Drives', slug: 'storage-drives', brand: null, order: 10, image: '' },
  'Z IDEAL NETWORKS NETWORK CABLE TESTER': { id: 'cat_accessories', name: 'Accessories', slug: 'accessories', brand: null, order: 6, image: '' },
  'Z KEYBOARD & MOUSE': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: null, order: 8, image: '' },
  'Z LOGITECH  ACCESSORIES': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: 'Logitech', order: 8, image: '' },
  'Z MIKROTIK': { id: 'cat_networking', name: 'Networking', slug: 'networking', brand: 'MikroTik', order: 9, image: '' },
  'Z PEN': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: null, order: 8, image: '' },
  'Z PROJECTOR': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: null, order: 8, image: '' },
  'Z PULL OUT HDD SSD RAMS': { id: 'cat_components', name: 'Components', slug: 'components', brand: null, order: 11, image: '' },
  'Z RACK & CABINET': { id: 'cat_networking', name: 'Networking', slug: 'networking', brand: null, order: 9, image: '' },
  'Z RAMDOM ACCESS MEMORY': { id: 'cat_components', name: 'Components', slug: 'components', brand: null, order: 11, image: '' },
  'Z RANDOM ACCESS MEMORY': { id: 'cat_components', name: 'Components', slug: 'components', brand: null, order: 11, image: '' },
  'Z SANDISK FLASH DRIVE': { id: 'cat_storage', name: 'Storage & Drives', slug: 'storage-drives', brand: 'SanDisk', order: 10, image: '' },
  'Z SOLID STATE DRIVE': { id: 'cat_storage', name: 'Storage & Drives', slug: 'storage-drives', brand: null, order: 10, image: '' },
  'Z UPS': { id: 'cat_ups', name: 'UPS & Power', slug: 'ups-power', brand: null, order: 14, image: '' },
};

export const BRAND_PATTERNS = [
  { pattern: /^APPLE|^Apple|MACBOOK/i, name: 'Apple', id: 'brand_apple' },
  { pattern: /^ACER/i, name: 'Acer', id: 'brand_acer' },
  { pattern: /^ASUS/i, name: 'ASUS', id: 'brand_asus' },
  { pattern: /^DELL/i, name: 'Dell', id: 'brand_dell' },
  { pattern: /^HP /i, name: 'HP', id: 'brand_hp' },
  { pattern: /^LENOVO/i, name: 'Lenovo', id: 'brand_lenovo' },
  { pattern: /^MSI/i, name: 'MSI', id: 'brand_msi' },
  { pattern: /^SAMSUNG/i, name: 'Samsung', id: 'brand_samsung' },
  { pattern: /^SONY/i, name: 'Sony', id: 'brand_sony' },
  { pattern: /^LOGITECH/i, name: 'Logitech', id: 'brand_logitech' },
  { pattern: /^RAZER/i, name: 'Razer', id: 'brand_razer' },
  { pattern: /^CORSAIR/i, name: 'Corsair', id: 'brand_corsair' },
  { pattern: /^MICROSOFT/i, name: 'Microsoft', id: 'brand_microsoft' },
  { pattern: /^CRUCIAL/i, name: 'Crucial', id: 'brand_crucial' },
  { pattern: /^WD |^WESTERN/i, name: 'Western Digital', id: 'brand_wd' },
  { pattern: /^SANDISK/i, name: 'SanDisk', id: 'brand_sandisk' },
  { pattern: /^TRANSCEND/i, name: 'Transcend', id: 'brand_transcend' },
  { pattern: /^KINGSTON/i, name: 'Kingston', id: 'brand_kingston' },
  { pattern: /^SEAGATE/i, name: 'Seagate', id: 'brand_seagate' },
  { pattern: /^TOSHIBA/i, name: 'Toshiba', id: 'brand_toshiba' },
  { pattern: /^CISCO/i, name: 'Cisco', id: 'brand_cisco' },
  { pattern: /^UBIQUITI/i, name: 'Ubiquiti', id: 'brand_ubiquiti' },
  { pattern: /^MIKROTIK/i, name: 'MikroTik', id: 'brand_mikrotik' },
  { pattern: /^APC/i, name: 'APC', id: 'brand_apc' },
  { pattern: /^SANTAK/i, name: 'Santak', id: 'brand_santak' },
  { pattern: /^ADATA/i, name: 'ADATA', id: 'brand_adata' },
  { pattern: /^INTEL/i, name: 'Intel', id: 'brand_intel' },
  { pattern: /^HONEYWELL/i, name: 'Honeywell', id: 'brand_honeywell' },
  { pattern: /^OSMO/i, name: 'DJI', id: 'brand_dji' },
  { pattern: /^HISENSE/i, name: 'Hisense', id: 'brand_hisense' },
  { pattern: /^TARGUS/i, name: 'Targus', id: 'brand_targus' },
  { pattern: /^TUCANO/i, name: 'Tucano', id: 'brand_tucano' },
  { pattern: /^ORICO/i, name: 'Orico', id: 'brand_orico' },
  { pattern: /^RIVACASE/i, name: 'Rivacase', id: 'brand_rivacase' },
  { pattern: /^VERBATIM/i, name: 'Verbatim', id: 'brand_verbatim' },
  { pattern: /^HYPER/i, name: 'HyperX', id: 'brand_hyperx' },
  { pattern: /^STEELSERIES/i, name: 'SteelSeries', id: 'brand_steelseries' },
  { pattern: /^JBL/i, name: 'JBL', id: 'brand_jbl' },
  { pattern: /^ANKER/i, name: 'Anker', id: 'brand_anker' },
  { pattern: /^LG/i, name: 'LG', id: 'brand_lg' },
  { pattern: /^GOOGLE/i, name: 'Google', id: 'brand_google' },
  { pattern: /^HAYSENSER|^HYSENSER/i, name: 'Haysenser', id: 'brand_haysenser' },
  { pattern: /^KENSINGTON/i, name: 'Kensington', id: 'brand_kensington' },
  { pattern: /^ADESSO/i, name: 'Adesso', id: 'brand_adesso' },
  { pattern: /^RAPOO/i, name: 'Rapoo', id: 'brand_rapoo' },
  { pattern: /^OKADE/i, name: 'Okade', id: 'brand_okade' },
  { pattern: /^RED LINE/i, name: 'Red Line', id: 'brand_redline' },
  { pattern: /^IMATION/i, name: 'Imation', id: 'brand_imation' },
  { pattern: /^HYNIX/i, name: 'SK Hynix', id: 'brand_hynix' },
  { pattern: /^TEAMGROUP/i, name: 'TeamGroup', id: 'brand_teamgroup' },
  { pattern: /^OSCOO/i, name: 'OSCOO', id: 'brand_oscoo' },
  { pattern: /^PULL OUT/i, name: 'Generic (Pull Out)', id: 'brand_pullout' },
  { pattern: /^PDU|^3\s*PIN/i, name: 'Generic', id: 'brand_generic' },
  { pattern: /^MINI\s+DISPLAY/i, name: 'Generic', id: 'brand_generic' },
  { pattern: /^ALL\s+IN\s+ONE\s+HDD/i, name: 'Generic', id: 'brand_generic' },
  { pattern: /^SATA/i, name: 'Generic', id: 'brand_generic' },
  { pattern: /^ETHERNET/i, name: 'Generic', id: 'brand_generic' },
];

export interface ParsedSpecs {
  processor?: string;
  ram?: string;
  storage?: string;
  gpu?: string;
  screenSize?: string;
  touchscreen?: boolean;
  resolution?: string;
  color?: string;
  keyboard?: string;
  backlitKeyboard?: boolean;
  os?: string;
  fingerprintReader?: boolean;
  mfgPartNumber?: string;
  warranty?: string;
}

export interface ImportOptions {
  filePath?: string;
  forceUpdate?: boolean;
  assignPricing?: boolean;
  defaultStock?: number;
}

export interface ImportResult {
  success: boolean;
  excelPath: string;
  totalParsed: number;
  categoriesCreated: number;
  brandsCreated: number;
  productsCreated: number;
  productsUpdated: number;
  skipped: number;
  totalProductsInDb: number;
}

export class InventoryImportService {
  /**
   * Safe root directory for all imported inventory files
   */
  public getSafeImportsDirectory(): string {
    const candidateDirs = [
      path.resolve(process.cwd(), 'backend', 'data_store', 'product_imports'),
      path.resolve(process.cwd(), 'data_store', 'product_imports'),
    ];
    for (const dir of candidateDirs) {
      if (fs.existsSync(dir)) {
        return path.normalize(dir);
      }
    }
    return path.resolve(process.cwd(), 'backend', 'data_store', 'product_imports');
  }

  /**
   * Resolve inventory Excel file path securely to prevent CWE-022 path traversal
   */
  public resolveExcelPath(customPath?: string): string {
    const safeDir = this.getSafeImportsDirectory();
    const safeDirPrefix = safeDir.endsWith(path.sep) ? safeDir : `${safeDir}${path.sep}`;

    if (customPath && typeof customPath === 'string' && customPath.trim()) {
      // 1. Sanitize against null bytes and newline injection (CWE-117)
      const sanitized = customPath.trim().replace(/\0/g, '').replace(/\n|\r/g, '');

      // 2. Extract base filename to strip any directory traversal sequences
      const cleanFileName = path.basename(sanitized);

      // 3. Strict allowlist for inventory spreadsheet extensions
      const ext = path.extname(cleanFileName).toLowerCase();
      const allowedExtensions = ['.xlsx', '.csv'];
      if (!allowedExtensions.includes(ext)) {
        throw new Error(
          `Security Exception: Invalid file extension "${ext}". Only ${allowedExtensions.join(', ')} files are permitted.`
        );
      }

      // 4. Resolve path strictly within safe root directory
      const targetPath = path.resolve(safeDir, cleanFileName);

      // 5. Strict containment check (CWE-022 path traversal guard)
      if (!targetPath.startsWith(safeDirPrefix)) {
        throw new Error('Security Exception: Path traversal outside imports directory is prohibited.');
      }

      // 6. Verify file exists
      if (fs.existsSync(targetPath)) {
        return targetPath;
      }

      throw new Error(`Inventory file "${cleanFileName}" not found in safe directory: ${safeDir}`);
    }

    // Default safe candidates (fixed static filenames strictly contained within safeDir)
    const defaultFileNames = [
      'ComNet_Inventory_Fixed.xlsx',
      'ComNet_Inventory_Fixed.csv',
    ];

    for (const fileName of defaultFileNames) {
      const candidatePath = path.resolve(safeDir, fileName);
      if (candidatePath.startsWith(safeDirPrefix) && fs.existsSync(candidatePath)) {
        return candidatePath;
      }
    }

    throw new Error(
      `Inventory Excel file not found. Checked safe files: ${defaultFileNames.join(', ')} in ${safeDir}`
    );
  }

  /**
   * Detect brand from description text or category brand hint
   */
  public detectBrand(text: string, categoryBrand: string | null): { name: string; id: string } {
    for (const bp of BRAND_PATTERNS) {
      if (bp.pattern.test(text)) {
        return { name: bp.name, id: bp.id };
      }
    }
    if (categoryBrand) {
      const found = BRAND_PATTERNS.find(bp => bp.name.toLowerCase() === categoryBrand.toLowerCase());
      if (found) return { name: found.name, id: found.id };
      const slugBrand = categoryBrand.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      return { name: categoryBrand, id: `brand_${slugBrand}` };
    }
    return { name: 'Generic', id: 'brand_generic' };
  }

  /**
   * Extract part number from item string
   */
  public extractPartNumber(text: string): string | null {
    const match = text.match(/\s-\s([A-Z0-9]{4,10})\s+(?:BRAND NEW|USED|REFURBISHED|OPEN BOX)/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract product condition
   */
  public extractCondition(text: string, excelCategory: string): string {
    if (/REFURBISHED/i.test(text) || /REFURB/i.test(excelCategory)) return 'Refurbished';
    if (/OPEN BOX/i.test(text) || /OPEN BOX/i.test(excelCategory)) return 'Open Box';
    if (/USED/i.test(text) || /USED/i.test(excelCategory)) return 'Used';
    if (/PULL OUT/i.test(text)) return 'Pull Out';
    return 'Brand New (Factory Sealed)';
  }

  /**
   * Parse pipe-delimited specifications from laptop/PC lines
   */
  public parseSpecs(text: string): ParsedSpecs {
    const specs: ParsedSpecs = {};
    const parts = text.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) return specs;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      if (
        /ULTRA\s+\d|CORE\s+\d|i[3579]-|RYZEN|SNAPDRAGON|INTEL\s+N-|CELERON|PENTIUM|APPLE\s+M/i.test(part) &&
        !part.includes('GRAPHICS') && !part.includes('ARC') && !part.includes('IRIS') &&
        !part.includes('RADEON') && !part.includes('RTX') && !part.includes('GTX')
      ) {
        specs.processor = part;
      } else if (/^\d+\s*GB(\s+RAM)?$/i.test(part) || /^\d+GB\s+RAM$/i.test(part)) {
        specs.ram = part;
      } else if (/\d+\s*(?:GB|TB)\s*(?:SSD|HDD|NVME)/i.test(part) || /^\d+\s*(?:GB|TB)$/i.test(part)) {
        specs.storage = part;
      } else if (/GRAPHICS|GEFORCE|RTX|GTX|RADEON|IRIS|ARC|ADRENO|UHD|INTEL HD|NVIDIA/i.test(part) && !specs.gpu) {
        specs.gpu = part;
      } else if (/^\d{1,2}(\.\d)?$/i.test(part) && !specs.screenSize) {
        specs.screenSize = `${part}"`;
      } else if (/^TOUCH$/i.test(part)) {
        specs.touchscreen = true;
      } else if (/FHD|QHD|WQXGA|WUXGA|HD\s*\(|UHD|4K|3K|2K|RETINA|\d{3,4}\s*x\s*\d{3,4}/i.test(part) && !specs.resolution) {
        specs.resolution = part;
      } else if (
        /BLACK|SILVER|GREY|GRAY|WHITE|BLUE|RED|GREEN|GOLD|GRAPHITE|INDIGO|CERAMIC|ECLIPSE|STORM|GENTLE|QUIET|COOL|INKWELL|JADE|GLACIER|LUNA|MISTY|INTERSTELLAR|CLOUD|STEEL|COSMO|CARBON/i.test(part) &&
        !specs.color && !part.includes('KEYBOARD') && !part.includes('KB') && !part.includes('GRAPHICS') && part.length < 40
      ) {
        specs.color = part;
      } else if (/ENG\s+KB|KEYBOARD|BACKLIT|NUMERIC|ARABIC/i.test(part) && !part.includes('MOUSE')) {
        if (/^BACKLIT$/i.test(part)) {
          specs.backlitKeyboard = true;
        } else {
          specs.keyboard = part;
        }
      } else if (/^WIN|^DOS$|^WINDOWS|^MAC\s+OS|^CHROME\s+OS/i.test(part)) {
        specs.os = part;
      } else if (/FINGER\s*PRINT/i.test(part)) {
        specs.fingerprintReader = true;
      } else if (/^[A-Z0-9][-A-Z0-9#]{4,}$/i.test(part) && !specs.mfgPartNumber && i >= parts.length - 3) {
        specs.mfgPartNumber = part;
      } else if (/WARRANTY/i.test(part)) {
        specs.warranty = part;
      }
    }

    return specs;
  }

  /**
   * Build clean product name and title
   */
  public buildProductName(rawText: string): string {
    let namePart = rawText.split('|')[0].trim();
    namePart = namePart
      .replace(/\s*-\s*[A-Z0-9]{4,10}\s+(BRAND NEW|USED|REFURBISHED|OPEN BOX).*$/i, '')
      .replace(/\s+(BRAND NEW|USED|REFURBISHED|OPEN BOX).*$/i, '')
      .trim();
    namePart = namePart.replace(/\s{2,}/g, ' ').trim();
    return namePart || rawText.substring(0, 80);
  }

  public buildProductTitle(name: string, specs: ParsedSpecs, condition: string): string {
    const parts = [name];
    if (specs.processor) parts.push(specs.processor);
    if (specs.ram) parts.push(specs.ram);
    if (specs.storage) parts.push(specs.storage);
    if (specs.screenSize) parts.push(specs.screenSize);
    if (condition && !condition.includes('Brand New')) parts.push(`(${condition})`);
    return parts.join(' | ');
  }

  /**
   * Deterministic SKU generation
   */
  public generateSku(partNumber: string | null, brand: string, index: number): string {
    if (partNumber) {
      return `CN-${partNumber.toUpperCase()}`;
    }
    const brandPrefix = brand.substring(0, 3).toUpperCase();
    return `CN-${brandPrefix}-${String(index).padStart(4, '0')}`;
  }

  /**
   * Estimate realistic UAE Dirham (AED) market price from hardware specs
   */
  public calculateEstimatedPrice(categoryId: string, specs: ParsedSpecs, condition: string): { price: number; compareAtPrice: number; costPrice: number } {
    let base = 2499;

    if (categoryId === 'cat_gaming_laptops') {
      base = 4999;
    } else if (categoryId === 'cat_all_in_one') {
      base = 3299;
    } else if (categoryId === 'cat_desktops') {
      base = 2899;
    } else if (categoryId === 'cat_monitors') {
      base = 899;
    } else if (categoryId === 'cat_networking') {
      base = 699;
    } else if (categoryId === 'cat_storage') {
      base = 299;
    } else if (categoryId === 'cat_headsets' || categoryId === 'cat_peripherals') {
      base = 189;
    } else if (categoryId === 'cat_accessories' || categoryId === 'cat_bags_cases') {
      base = 129;
    } else if (categoryId === 'cat_components') {
      base = 599;
    } else if (categoryId === 'cat_ups') {
      base = 799;
    }

    // CPU adjustments
    if (specs.processor) {
      const p = specs.processor.toUpperCase();
      if (p.includes('ULTRA 9') || p.includes('CORE 9') || p.includes('RTX 5070') || p.includes('RYZEN AI 9')) {
        base += 3200;
      } else if (p.includes('ULTRA 7') || p.includes('CORE 7') || p.includes('i7') || p.includes('RYZEN 7')) {
        base += 1600;
      } else if (p.includes('ULTRA 5') || p.includes('CORE 5') || p.includes('i5') || p.includes('RYZEN 5')) {
        base += 700;
      } else if (p.includes('CORE 3') || p.includes('i3')) {
        base -= 400;
      } else if (p.includes('CELERON') || p.includes('PENTIUM')) {
        base -= 800;
      }
    }

    // GPU adjustments
    if (specs.gpu) {
      const g = specs.gpu.toUpperCase();
      if (g.includes('RTX 5070') || g.includes('RTX 4080')) base += 2500;
      else if (g.includes('RTX 4070') || g.includes('RTX 4060')) base += 1400;
      else if (g.includes('RTX 3050') || g.includes('GTX')) base += 600;
    }

    // RAM adjustments
    if (specs.ram) {
      const r = parseInt(specs.ram, 10);
      if (r >= 32) base += 700;
      else if (r >= 16) base += 350;
    }

    // Storage adjustments
    if (specs.storage) {
      const s = specs.storage.toUpperCase();
      if (s.includes('2TB')) base += 550;
      else if (s.includes('1TB')) base += 300;
      else if (s.includes('512GB')) base += 120;
    }

    // Display / Touch
    if (specs.touchscreen) base += 200;
    if (specs.resolution && (specs.resolution.includes('3K') || specs.resolution.includes('4K') || specs.resolution.includes('OLED') || specs.resolution.includes('WQXGA'))) {
      base += 350;
    }

    // Condition multiplier
    let conditionMult = 1.0;
    if (condition.includes('Open Box')) conditionMult = 0.88;
    else if (condition.includes('Refurbished')) conditionMult = 0.75;
    else if (condition.includes('Used') || condition.includes('Pull Out')) conditionMult = 0.62;

    const price = Math.max(99, Math.round((base * conditionMult) / 10) * 10 - 1); // e.g. 2489 or 2499
    const compareAtPrice = Math.round((price * 1.15) / 10) * 10;
    const costPrice = Math.round((price * 0.82) / 10) * 10;

    return { price, compareAtPrice, costPrice };
  }

  /**
   * Build Enterprise Technical Specifications Matrix key-value map
   */
  public buildSpecifications(specs: ParsedSpecs, categoryName: string): Record<string, string> {
    const result: Record<string, string> = {};
    const prefix = categoryName.toUpperCase().replace(/\s*&\s*/g, ' & ');

    if (specs.processor) result[`${prefix} | Processor`] = specs.processor;
    if (specs.ram) result[`${prefix} | RAM`] = specs.ram;
    if (specs.storage) result[`${prefix} | Storage`] = specs.storage;
    if (specs.gpu) result[`${prefix} | Graphics`] = specs.gpu;
    if (specs.screenSize) result[`${prefix} | Screen Size`] = specs.screenSize;
    if (specs.resolution) result[`${prefix} | Display Resolution`] = specs.resolution;
    if (specs.color) result[`${prefix} | Color`] = specs.color;
    if (specs.os) result[`${prefix} | Operating System`] = specs.os;
    if (specs.keyboard) result[`${prefix} | Keyboard`] = specs.keyboard;
    if (specs.touchscreen) result[`${prefix} | Touchscreen`] = 'Yes';
    if (specs.fingerprintReader) result[`${prefix} | Fingerprint Reader`] = 'Yes';
    if (specs.backlitKeyboard) result[`${prefix} | Backlit Keyboard`] = 'Yes';
    if (specs.warranty) result[`${prefix} | Warranty`] = specs.warranty;
    if (specs.mfgPartNumber) result[`${prefix} | Manufacturer Part No`] = specs.mfgPartNumber;

    return result;
  }

  /**
   * Build descriptive hardware tags
   */
  public buildTags(specs: ParsedSpecs, brand: string, condition: string, excelCategory: string): string[] {
    const tags = ['UAE', 'ComNet Distribution', 'NexTech Certified'];
    if (excelCategory && excelCategory !== 'UNCATEGORIZED') tags.push(excelCategory.replace(/^Z\s+/, '').trim());
    if (brand && brand !== 'Generic') tags.push(brand);
    if (condition && !condition.includes('Brand New')) tags.push(condition);
    if (specs.processor) tags.push(specs.processor);
    if (specs.os && /WIN/i.test(specs.os)) tags.push('Windows 11');
    if (specs.os && /DOS/i.test(specs.os)) tags.push('FreeDOS');
    if (specs.os && /MAC/i.test(specs.os)) tags.push('macOS');
    if (specs.touchscreen) tags.push('Touchscreen');
    if (specs.color) tags.push(specs.color);
    if (specs.gpu) tags.push(specs.gpu);
    return [...new Set(tags)];
  }

  /**
   * Hardware photography resolver.
   * Products strictly use authentic assets uploaded by Admin, Product Editor, or verified Reseller.
   * Pre-loaded external stock photography is disallowed by security & catalog policy.
   */
  public resolveItemImage(_text: string, _categoryId: string, _brandName: string): string {
    return '';
  }

  /**
   * Determine if an item is a flagship computing system eligible to be featured on homepage.
   * Strictly excludes loose pull-out RAMs/SSDs, accessories, cables, and bags.
   */
  public isFeaturedComputingDevice(text: string, categoryId: string, brandName: string): boolean {
    const t = text.toUpperCase();
    const b = (brandName || '').toUpperCase();

    // Pull out components, generic parts, cables, bags must NEVER be featured
    if (
      t.includes('PULL OUT') ||
      b.includes('PULL OUT') ||
      t.includes('USED') ||
      categoryId === 'cat_components' ||
      categoryId === 'cat_accessories' ||
      categoryId === 'cat_bags_cases' ||
      categoryId === 'cat_peripherals' ||
      categoryId === 'cat_ups'
    ) {
      return false;
    }

    // All Gaming Laptops and All-in-Ones should be featured
    if (categoryId === 'cat_gaming_laptops' || categoryId === 'cat_all_in_one' || categoryId === 'cat_desktops') {
      return true;
    }

    // Flagship brand-new laptops with modern processors
    if (categoryId === 'cat_laptops') {
      if (
        t.includes('ULTRA') ||
        t.includes('XPS') ||
        t.includes('OMEN') ||
        t.includes('ALIENWARE') ||
        t.includes('MACBOOK') ||
        t.includes('RTX') ||
        t.includes('OLED') ||
        t.includes('i7') ||
        t.includes('i9') ||
        t.includes('RYZEN 7') ||
        t.includes('THINKPAD') ||
        t.includes('ZENBOOK') ||
        t.includes('PRECISION')
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Primary entry point: Imports products from Excel into the Database
   */
  public async importFromExcel(options: ImportOptions = {}): Promise<ImportResult> {
    const rawFilePath = typeof options.filePath === 'string' ? options.filePath.replace(/\n|\r/g, '') : options.filePath;
    const excelPath = this.resolveExcelPath(rawFilePath);
    const sanitizedLogPath = String(excelPath).replace(/\n|\r/g, '');
    console.log(`[InventoryImport] Reading Excel file from: ${sanitizedLogPath}`);

    const workbook = new ExcelJS.Workbook();
    if (path.extname(excelPath).toLowerCase() === '.csv') {
      await workbook.csv.readFile(excelPath);
    } else {
      await workbook.xlsx.readFile(excelPath);
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('Inventory spreadsheet contains no worksheet.');
    const rows: any[][] = [];
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      rows[rowNumber - 1] = Array.from({ length: row.cellCount }, (_, index) => {
        const value = row.getCell(index + 1).value;
        if (value && typeof value === 'object') {
          if ('result' in value) return value.result;
          if ('text' in value) return value.text;
        }
        return value;
      });
    });
    console.log(`[InventoryImport] Total raw sheet rows: ${rows.length}`);

    // Parse categories and line items
    let currentCategoryHeader = 'UNCATEGORIZED';
    const parsedItems: Array<{ text: string; excelCategory: string }> = [];

    for (let i = 3; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;

      if (row.length >= 4 && row[1] === 0 && row[2] === 0 && row[3] === 0) {
        currentCategoryHeader = String(row[0]).trim();
        continue;
      }

      const text = String(row[0] || '').trim();
      if (text) {
        parsedItems.push({ text, excelCategory: currentCategoryHeader });
      }
    }

    console.log(`[InventoryImport] Found ${parsedItems.length} hardware products to process.`);

    // 1. Synchronize Categories into Database
    const existingCategories = await categoryRepository.find();
    const categoryMap = new Map<string, Category>(existingCategories.map(c => [c.id, c]));
    let categoriesCreated = 0;

    for (const mapping of Object.values(CATEGORY_MAP)) {
      if (!categoryMap.has(mapping.id)) {
        const catRecord: Category = {
          id: mapping.id,
          name: mapping.name,
          slug: mapping.slug,
          description: `Enterprise and consumer ${mapping.name} distribution across GCC and UAE`,
          image: mapping.image,
          order: mapping.order,
          isActive: true,
          productCount: 0,
        };
        await categoryRepository.create(catRecord);
        categoryMap.set(mapping.id, catRecord);
        categoriesCreated++;
      }
    }

    // 2. Synchronize Brands into Database
    const existingBrands = await brandRepository.find();
    const brandMap = new Map<string, Brand>(existingBrands.map(b => [b.id, b]));
    let brandsCreated = 0;

    for (const bp of BRAND_PATTERNS) {
      if (!brandMap.has(bp.id)) {
        const brandRecord: Brand = {
          id: bp.id,
          name: bp.name,
          slug: bp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: `Official ${bp.name} authorized hardware catalog and certified distribution.`,
          isActive: true,
          productCount: 0,
        };
        await brandRepository.create(brandRecord);
        brandMap.set(bp.id, brandRecord);
        brandsCreated++;
      }
    }

    // 3. Process and Synchronize Products into Database
    const existingProducts = await productRepository.find();
    const skuMap = new Map<string, Product>();
    for (const p of existingProducts) {
      if (p.sku) skuMap.set(p.sku.toLowerCase(), p);
    }

    let productsCreated = 0;
    let productsUpdated = 0;
    let skipped = 0;

    for (let index = 0; index < parsedItems.length; index++) {
      const item = parsedItems[index];
      const { text, excelCategory } = item;
      const catMapping = CATEGORY_MAP[excelCategory] || {
        id: 'cat_other',
        name: 'Other Hardware',
        slug: 'other-hardware',
        brand: null,
        order: 99,
        image: '',
      };

      const brand = this.detectBrand(text, catMapping.brand);
      const partNumber = this.extractPartNumber(text);
      const condition = this.extractCondition(text, excelCategory);
      const specs = this.parseSpecs(text);
      const name = this.buildProductName(text);
      const title = this.buildProductTitle(name, specs, condition);
      const sku = this.generateSku(partNumber, brand.name, index + 1);

      // Pricing calculation
      const pricing = this.calculateEstimatedPrice(catMapping.id, specs, condition);
      const specifications = this.buildSpecifications(specs, catMapping.name);
      const tags = this.buildTags(specs, brand.name, condition, excelCategory);

      const description = text
        .replace(/\|/g, ', ')
        .replace(/\s{2,}/g, ' ')
        .replace(/MANUFACTURE WARRANTY ONLY/gi, 'Manufacturer Warranty Only')
        .trim();

      const locations: WarehouseLocationStock[] = [
        {
          locationId: 'loc_jafza',
          locationName: 'Dubai Logistics Hub (JAFZA)',
          city: 'Dubai',
          quantity: Math.floor((options.defaultStock || 10) * 0.6),
          available: Math.floor((options.defaultStock || 10) * 0.6),
          onHand: Math.floor((options.defaultStock || 10) * 0.6),
          committed: 0,
        },
        {
          locationId: 'loc_deira',
          locationName: 'Deira Distribution Center',
          city: 'Dubai',
          quantity: Math.ceil((options.defaultStock || 10) * 0.4),
          available: Math.ceil((options.defaultStock || 10) * 0.4),
          onHand: Math.ceil((options.defaultStock || 10) * 0.4),
          committed: 0,
        },
      ];

      const cleanSlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      // Compute featured status for computing devices
      const isItemFeatured = this.isFeaturedComputingDevice(text, catMapping.id, brand.name);

      // Check if product exists in database by SKU
      const existingProduct = skuMap.get(sku.toLowerCase());

      if (existingProduct) {
        if (options.forceUpdate) {
          const finalStock = existingProduct.stock > 0 ? existingProduct.stock : (options.defaultStock || 10);
          const finalLocations = (existingProduct.locations && existingProduct.locations.length > 0)
            ? existingProduct.locations
            : locations;

          await productRepository.update(existingProduct.id, {
            name,
            title,
            brandId: brand.id,
            brandName: brand.name,
            categoryId: catMapping.id,
            categoryName: catMapping.name,
            description,
            specifications,
            tags,
            stock: finalStock,
            locations: finalLocations,
            images: existingProduct.images && existingProduct.images.length > 0 ? existingProduct.images : [],
            thumbnail: existingProduct.thumbnail || existingProduct.images?.[0] || '',
            isFeatured: isItemFeatured,
            ...(options.assignPricing ? pricing : {}),
            updatedAt: new Date().toISOString(),
          } as any);
          productsUpdated++;
        } else {
          skipped++;
        }
      } else {
        const newProduct: Product = {
          id: `prod_cn_${crypto.randomBytes(6).toString('hex')}`,
          name,
          slug: cleanSlug,
          sku,
          brandId: brand.id,
          brandName: brand.name,
          categoryId: catMapping.id,
          categoryName: catMapping.name,
          sellerType: 'ADMIN',
          description,
          shortDescription: `${brand.name} ${name}${specs.processor ? ' • ' + specs.processor : ''}`,
          price: options.assignPricing !== false ? pricing.price : 0,
          compareAtPrice: options.assignPricing !== false ? pricing.compareAtPrice : 0,
          costPrice: options.assignPricing !== false ? pricing.costPrice : 0,
          currency: 'AED',
          stock: options.defaultStock || 10,
          reservedStock: 0,
          lowStockThreshold: 3,
          locations,
          images: [],
          thumbnail: '',
          specifications,
          features: [
            'Enterprise Certified Hardware',
            'Full Manufacturer Warranty',
            'Same-Day Dubai Express Dispatch Available',
            'Official UAE 5% VAT Tax Compliant',
          ],
          tags,
          collections: [catMapping.name, brand.name],
          warranty: specs.warranty || 'Manufacturer Warranty Only',
          rating: 4.8 + Number((((index % 5) * 0.05)).toFixed(2)),
          reviewCount: 5 + (index % 17),
          isFeatured: isItemFeatured,
          isActive: true,
          approvalStatus: 'APPROVED',
          hasVariants: false,
          isPhysical: true,
          chargeTax: true,
          inventoryTracked: true,
          allowBackorder: false,
          unitMeasure: 'unit',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await productRepository.create(newProduct);
        skuMap.set(sku.toLowerCase(), newProduct);
        productsCreated++;
      }
    }

    // Refresh Category and Brand counts in database
    const allProducts = await productRepository.find();
    for (const cat of categoryMap.values()) {
      const count = allProducts.filter(p => p.categoryId === cat.id).length;
      await categoryRepository.update(cat.id, { productCount: count });
    }
    for (const br of brandMap.values()) {
      const count = allProducts.filter(p => p.brandId === br.id).length;
      await brandRepository.update(br.id, { productCount: count });
    }

    console.log(`[InventoryImport] Completed. Created: ${productsCreated}, Updated: ${productsUpdated}, Skipped: ${skipped}`);

    return {
      success: true,
      excelPath,
      totalParsed: parsedItems.length,
      categoriesCreated,
      brandsCreated,
      productsCreated,
      productsUpdated,
      skipped,
      totalProductsInDb: allProducts.length,
    };
  }
}

export const inventoryImportService = new InventoryImportService();
