import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
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
  'ACER BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Acer', order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'All in One': { id: 'cat_all_in_one', name: 'All-in-One PCs', slug: 'all-in-one-pcs', brand: null, order: 2, image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&auto=format&fit=crop&q=80' },
  'All in One ': { id: 'cat_all_in_one', name: 'All-in-One PCs', slug: 'all-in-one-pcs', brand: null, order: 2, image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&auto=format&fit=crop&q=80' },
  'ASUS BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'ASUS', order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'Dell ALIENWARE & PRECISION': { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', brand: 'Dell', order: 3, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80' },
  'DELL BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Dell', order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'DELL XPS BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Dell', order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'DESKTOPS': { id: 'cat_desktops', name: 'Desktops', slug: 'desktops', brand: null, order: 4, image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&auto=format&fit=crop&q=80' },
  'GAMING LAPTOP BRAND NEW': { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', brand: null, order: 3, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80' },
  'HEADSET': { id: 'cat_headsets', name: 'Headsets & Audio', slug: 'headsets-audio', brand: null, order: 5, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80' },
  'HP BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'HP', order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'HP DOCKING STATION': { id: 'cat_accessories', name: 'Accessories', slug: 'accessories', brand: 'HP', order: 6, image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80' },
  'HP OMEN': { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', brand: 'HP', order: 3, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80' },
  'HP REFURBISHED / OPEN BOX': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'HP', order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'LENOVO BRAND NEW': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Lenovo', order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'MONITORS': { id: 'cat_monitors', name: 'Monitors', slug: 'monitors', brand: null, order: 7, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80' },
  'MSI BRAND NEW': { id: 'cat_gaming_laptops', name: 'Gaming Laptops', slug: 'gaming-laptops', brand: 'MSI', order: 3, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80' },
  'OPEN BOX REFURB': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: null, order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'SCANNER': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: null, order: 8, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80' },
  'UBIQUITI': { id: 'cat_networking', name: 'Networking', slug: 'networking', brand: 'Ubiquiti', order: 9, image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80' },
  'USED APPLE': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: 'Apple', order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'USED LAPTOP': { id: 'cat_laptops', name: 'Laptops', slug: 'laptops', brand: null, order: 1, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' },
  'Z ACCESSORIES': { id: 'cat_accessories', name: 'Accessories', slug: 'accessories', brand: null, order: 6, image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80' },
  'Z ADATA BRAND NEW': { id: 'cat_storage', name: 'Storage & Drives', slug: 'storage-drives', brand: 'ADATA', order: 10, image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80' },
  'Z CISCO': { id: 'cat_networking', name: 'Networking', slug: 'networking', brand: 'Cisco', order: 9, image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80' },
  'Z CPU': { id: 'cat_components', name: 'Components', slug: 'components', brand: 'Intel', order: 11, image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80' },
  'Z GAMING ACCESSORIES': { id: 'cat_gaming_accessories', name: 'Gaming Accessories', slug: 'gaming-accessories', brand: null, order: 12, image: 'https://images.unsplash.com/photo-1612287232230-05e8346f32e6?w=800&auto=format&fit=crop&q=80' },
  'Z HAND BAGS': { id: 'cat_bags_cases', name: 'Bags & Cases', slug: 'bags-cases', brand: null, order: 13, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80' },
  'Z HARD DISK DRIVE': { id: 'cat_storage', name: 'Storage & Drives', slug: 'storage-drives', brand: null, order: 10, image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80' },
  'Z IDEAL NETWORKS NETWORK CABLE TESTER': { id: 'cat_accessories', name: 'Accessories', slug: 'accessories', brand: null, order: 6, image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80' },
  'Z KEYBOARD & MOUSE': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: null, order: 8, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80' },
  'Z LOGITECH  ACCESSORIES': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: 'Logitech', order: 8, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80' },
  'Z MIKROTIK': { id: 'cat_networking', name: 'Networking', slug: 'networking', brand: 'MikroTik', order: 9, image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80' },
  'Z PEN': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: null, order: 8, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80' },
  'Z PROJECTOR': { id: 'cat_peripherals', name: 'Peripherals', slug: 'peripherals', brand: null, order: 8, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80' },
  'Z PULL OUT HDD SSD RAMS': { id: 'cat_components', name: 'Components', slug: 'components', brand: null, order: 11, image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80' },
  'Z RACK & CABINET': { id: 'cat_networking', name: 'Networking', slug: 'networking', brand: null, order: 9, image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80' },
  'Z RAMDOM ACCESS MEMORY': { id: 'cat_components', name: 'Components', slug: 'components', brand: null, order: 11, image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80' },
  'Z RANDOM ACCESS MEMORY': { id: 'cat_components', name: 'Components', slug: 'components', brand: null, order: 11, image: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80' },
  'Z SANDISK FLASH DRIVE': { id: 'cat_storage', name: 'Storage & Drives', slug: 'storage-drives', brand: 'SanDisk', order: 10, image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80' },
  'Z SOLID STATE DRIVE': { id: 'cat_storage', name: 'Storage & Drives', slug: 'storage-drives', brand: null, order: 10, image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80' },
  'Z UPS': { id: 'cat_ups', name: 'UPS & Power', slug: 'ups-power', brand: null, order: 14, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80' },
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
      // 1. Sanitize against null bytes
      const sanitized = customPath.trim().replace(/\0/g, '');

      // 2. Extract base filename to strip any directory traversal sequences
      const cleanFileName = path.basename(sanitized);

      // 3. Strict allowlist for inventory spreadsheet extensions
      const ext = path.extname(cleanFileName).toLowerCase();
      const allowedExtensions = ['.xls', '.xlsx', '.csv'];
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
      'ComNet_Inventory.xls',
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
   * Determine authentic hardware photography matching the actual product type.
   * Gives RAM pictures to RAM modules, SSD pictures to M.2/SSDs, Laptop pictures to Laptops, etc.
   */
  public resolveItemImage(text: string, categoryId: string, brandName: string): string {
    const t = text.toUpperCase();
    const b = (brandName || '').toUpperCase();

    // 1. Pull-out spare components (RAM, SSDs, HDDs pulled from machines)
    if (t.includes('PULL OUT') || b.includes('PULL OUT')) {
      if (t.includes('RAM') || t.includes('DDR') || t.includes('DIMM') || t.includes('SODIMM')) {
        return 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80';
      }
      if (t.includes('SSD') || t.includes('NVME') || t.includes('M.2') || t.includes('SOLID STATE')) {
        return 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80';
      }
      if (t.includes('HDD') || t.includes('HARD DISK') || t.includes('TB') || t.includes('3.5') || t.includes('PURPLE') || t.includes('SEAGATE') || t.includes('SATA')) {
        return 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&auto=format&fit=crop&q=80';
      }
      return 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80';
    }

    // 2. Gaming Laptops (Alienware, ROG, Omen, MSI Gaming, Nitro, Predator)
    if (
      categoryId === 'cat_gaming_laptops' ||
      t.includes('ALIENWARE') ||
      t.includes('OMEN') ||
      t.includes('ROG') ||
      t.includes('PREDATOR HELIOS') ||
      t.includes('NITRO') ||
      t.includes('LEGION') ||
      (t.includes('RTX') && (categoryId === 'cat_laptops' || t.includes('LAPTOP')))
    ) {
      return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80';
    }

    // 3. Apple MacBooks
    if (b.includes('APPLE') || t.includes('MACBOOK') || t.includes('APPLE M')) {
      return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80';
    }

    // 4. Laptops (Dell XPS, Asus ZenBook, Lenovo ThinkPad, HP EliteBook)
    if (categoryId === 'cat_laptops' || (t.includes('LAPTOP') && !t.includes('MOUSE') && !t.includes('BAG') && !t.includes('CASE'))) {
      if (b.includes('DELL') || t.includes('XPS') || t.includes('LATITUDE') || t.includes('INSPIRON')) {
        return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80';
      }
      if (b.includes('ASUS') || t.includes('ZENBOOK') || t.includes('VIVOBOOK') || t.includes('EXPERTBOOK')) {
        return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80';
      }
      if (b.includes('LENOVO') || t.includes('THINKPAD') || t.includes('YOGA') || t.includes('IDEAPAD')) {
        return 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80';
      }
      if (b.includes('HP') || t.includes('ELITEBOOK') || t.includes('PROBOOK') || t.includes('PAVILION') || t.includes('SPECTRE')) {
        return 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format&fit=crop&q=80';
      }
      return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80';
    }

    // 5. All-in-One PCs & Desktop Workstations
    if (categoryId === 'cat_all_in_one' || t.includes('ALL IN ONE') || t.includes('AIO')) {
      return 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&auto=format&fit=crop&q=80';
    }
    if (categoryId === 'cat_desktops' || t.includes('DESKTOP') || t.includes('TOWER') || t.includes('OPTIPLEX')) {
      return 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&auto=format&fit=crop&q=80';
    }

    // 6. Accessories / Mice / Bags / Peripherals
    if (categoryId === 'cat_gaming_accessories' || categoryId === 'cat_accessories' || t.includes('CESTUS') || t.includes('MOUSE') || t.includes('DOCKING')) {
      return 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80';
    }
    if (categoryId === 'cat_bags_cases' || t.includes('BAG') || t.includes('BACKPACK') || t.includes('CASE')) {
      return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80';
    }
    if (categoryId === 'cat_networking' || b.includes('CISCO') || b.includes('UBIQUITI') || b.includes('MIKROTIK')) {
      return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80';
    }
    if (categoryId === 'cat_monitors' || t.includes('MONITOR') || t.includes('DISPLAY')) {
      return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80';
    }
    if (categoryId === 'cat_headsets' || t.includes('HEADSET') || t.includes('HEADPHONE') || t.includes('EARPHONE')) {
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
    }
    if (categoryId === 'cat_ups' || t.includes('UPS') || t.includes('SANTAK') || t.includes('APC')) {
      return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80';
    }

    // 7. Core Components & Loose Storage (CPUs, RAM, SSDs, HDDs)
    if (categoryId === 'cat_components' && (t.includes('CPU') || t.includes('INTEL CORE') || t.includes('RYZEN') || t.includes('PROCESSOR'))) {
      return 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800&auto=format&fit=crop&q=80';
    }
    if (t.includes('RAM') || t.includes('DDR4') || t.includes('DDR5') || t.includes('SODIMM') || t.includes('DIMM')) {
      return 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&auto=format&fit=crop&q=80';
    }
    if (t.includes('SSD') || t.includes('NVME') || t.includes('M.2') || t.includes('SOLID STATE')) {
      return 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80';
    }
    if (t.includes('HDD') || t.includes('HARD DISK') || t.includes('SATA HARD')) {
      return 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=800&auto=format&fit=crop&q=80';
    }

    return CATEGORY_MAP[categoryId]?.image || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';
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
    const excelPath = this.resolveExcelPath(options.filePath);
    console.log(`[InventoryImport] Reading Excel file from: ${excelPath}`);

    const wb = XLSX.readFile(excelPath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
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
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
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

      // Resolve realistic hardware photography and computing device featured status
      const resolvedImage = this.resolveItemImage(text, catMapping.id, brand.name);
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
            images: [resolvedImage],
            thumbnail: resolvedImage,
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
          images: [resolvedImage],
          thumbnail: resolvedImage,
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
