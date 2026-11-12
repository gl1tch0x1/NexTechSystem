const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const now = new Date().toISOString();

const product1 = {
  id: 'prod_asus_b1502cva_b7acjl',
  name: 'ASUS ExpertBook B1502CVA-NJ3464W',
  slug: 'asus-expertbook-b1502cva-nj3464w-b7acjl',
  sku: 'B7ACJL',
  barcode: '729183920193',
  brandId: 'brand_asus',
  brandName: 'ASUS',
  categoryId: 'cat_laptops',
  categoryName: 'Laptops in Computers',
  sellerType: 'ADMIN',
  condition: 'Brand New (Factory Sealed)',
  price: 2199,
  salePrice: 2199,
  compareAtPrice: 2499,
  costPrice: 1850,
  currency: 'AED',
  stock: 5,
  reservedStock: 0,
  lowStockThreshold: 3,
  warranty: '1 Year Manufacturer Warranty Only',
  warrantyYears: 1,
  shortDescription: 'ASUS ExpertBook B1502CVA-NJ3464W 13th Gen Intel Core i3-1315U, 8GB RAM, 256GB SSD, 15.6" FHD, Windows 11 Home',
  description: 'ASUS ExpertBook B1502CVA-NJ3464W - B7ACJL BRAND NEW 13th GEN. Features Intel Core i3-1315U Processor, 8GB RAM, 256GB SSD, Intel UHD Graphics, 15.6" Full HD (1920x1080) Anti-Glare Display, Gentle Grey Finish, English Keyboard, Windows 11 Home. Manufacturer Part Number: 90NX0801-M04XV0. Manufacturer Warranty Only.',
  specifications: {
    'LAPTOP | Brand': 'ASUS',
    'LAPTOP | Model': 'ExpertBook B1502CVA-NJ3464W',
    'LAPTOP | Part Number': 'B7ACJL',
    'LAPTOP | Manufacturer Part Number': '90NX0801-M04XV0',
    'LAPTOP | Generation': '13th Gen Intel Core',
    'LAPTOP | Processor': 'Intel Core i3-1315U',
    'LAPTOP | Memory (RAM)': '8GB DDR4',
    'LAPTOP | Storage': '256GB PCIe NVMe SSD',
    'LAPTOP | Graphics': 'Intel UHD Graphics',
    'LAPTOP | Screen Size': '15.6"',
    'LAPTOP | Display Resolution': 'FHD (1920 x 1080)',
    'LAPTOP | Display Technology': 'Anti-glare LED Backlit',
    'LAPTOP | Touchscreen': 'No',
    'LAPTOP | Color': 'Gentle Grey',
    'LAPTOP | Keyboard': 'English (ENG KB)',
    'LAPTOP | Operating System': 'Windows 11 Home',
    'LAPTOP | Warranty': 'Manufacturer Warranty Only'
  },
  features: [
    '13th Generation Intel Core i3-1315U Processor',
    '15.6-inch Full HD (1920x1080) NanoEdge Display',
    '8GB RAM & Fast 256GB NVMe SSD Storage',
    'Lightweight Gentle Grey Chassis for Business & Everyday Productivity',
    'Official Manufacturer Warranty'
  ],
  tags: ['ASUS', 'ExpertBook', 'Laptop', '13th Gen', 'Intel i3', 'FHD', 'ComNet'],
  collections: ['Laptops', 'ASUS', 'Business Laptops'],
  images: [
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8'
  ],
  thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef',
  locations: [
    {
      locationId: 'loc_dxb_main',
      locationName: 'Dubai Logistics Hub (JAFZA)',
      city: 'Dubai',
      quantity: 3,
      available: 3,
      committed: 0,
      unavailable: 0,
      onHand: 3
    },
    {
      locationId: 'loc_deira_tech',
      locationName: 'Deira Showroom & Tech Center',
      city: 'Dubai',
      quantity: 2,
      available: 2,
      committed: 0,
      unavailable: 0,
      onHand: 2
    }
  ],
  rating: 5,
  reviewCount: 0,
  isFeatured: false,
  isActive: true,
  approvalStatus: 'APPROVED',
  isPhysical: true,
  chargeTax: true,
  inventoryTracked: true,
  allowBackorder: false,
  hasVariants: false,
  createdAt: now,
  updatedAt: now
};

const product2 = {
  id: 'prod_dell_pv15250_j1a0bg',
  name: 'Dell Pro 15 Essential PV15250',
  slug: 'dell-pro-15-essential-pv15250-j1a0bg',
  sku: 'J1A0BG',
  barcode: '729183920194',
  brandId: 'brand_dell',
  brandName: 'Dell',
  categoryId: 'cat_laptops',
  categoryName: 'Laptops in Computers',
  sellerType: 'ADMIN',
  condition: 'Brand New (Factory Sealed)',
  price: 2499,
  salePrice: 2499,
  compareAtPrice: 2799,
  costPrice: 2050,
  currency: 'AED',
  stock: 5,
  reservedStock: 0,
  lowStockThreshold: 3,
  warranty: '1 Year Manufacturer Warranty Only',
  warrantyYears: 1,
  shortDescription: 'Dell Pro 15 Essential PV15250 13th Gen Intel Core i5-1334U, 8GB RAM, 512GB SSD, Fingerprint, 15.6" FHD, DOS',
  description: 'Dell Pro 15 Essential PV15250 - J1A0BG BRAND NEW 13th GEN. Features Intel Core i5-1334U Processor, 8GB RAM, 512GB SSD, Intel UHD Graphics, Integrated Fingerprint Reader, 15.6" Full HD (1920x1080) Anti-Glare Display, Black Finish, English Keyboard with Numeric Keypad, DOS. Manufacturer Part Number: PV15250 i5. Manufacturer Warranty Only.',
  specifications: {
    'LAPTOP | Brand': 'Dell',
    'LAPTOP | Model': 'Pro 15 Essential PV15250',
    'LAPTOP | Part Number': 'J1A0BG',
    'LAPTOP | Manufacturer Part Number': 'PV15250 i5',
    'LAPTOP | Generation': '13th Gen Intel Core',
    'LAPTOP | Processor': 'Intel Core i5-1334U',
    'LAPTOP | Memory (RAM)': '8GB DDR4',
    'LAPTOP | Storage': '512GB PCIe NVMe SSD',
    'LAPTOP | Graphics': 'Intel UHD Graphics',
    'LAPTOP | Screen Size': '15.6"',
    'LAPTOP | Display Resolution': 'FHD (1920 x 1080)',
    'LAPTOP | Display Technology': 'Anti-glare LED Backlit',
    'LAPTOP | Fingerprint Reader': 'Yes',
    'LAPTOP | Touchscreen': 'No',
    'LAPTOP | Color': 'Black',
    'LAPTOP | Keyboard': 'English with Dedicated Numeric Keypad',
    'LAPTOP | Operating System': 'DOS',
    'LAPTOP | Warranty': 'Manufacturer Warranty Only'
  },
  features: [
    '13th Generation Intel Core i5-1334U 10-Core Processor',
    '15.6-inch Full HD (1920x1080) Narrow Border Display',
    '8GB RAM & Spacious 512GB NVMe Solid State Drive',
    'Built-in Biometric Fingerprint Reader on Power Button',
    'Full-size Keyboard with Dedicated Numeric Keypad',
    'Official Manufacturer Warranty'
  ],
  tags: ['Dell', 'Pro 15', 'PV15250', 'Laptop', '13th Gen', 'Intel i5', 'Fingerprint', 'ComNet'],
  collections: ['Laptops', 'Dell', 'Business Laptops'],
  images: [
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8'
  ],
  thumbnail: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
  locations: [
    {
      locationId: 'loc_dxb_main',
      locationName: 'Dubai Logistics Hub (JAFZA)',
      city: 'Dubai',
      quantity: 3,
      available: 3,
      committed: 0,
      unavailable: 0,
      onHand: 3
    },
    {
      locationId: 'loc_deira_tech',
      locationName: 'Deira Showroom & Tech Center',
      city: 'Dubai',
      quantity: 2,
      available: 2,
      committed: 0,
      unavailable: 0,
      onHand: 2
    }
  ],
  rating: 5,
  reviewCount: 0,
  isFeatured: false,
  isActive: true,
  approvalStatus: 'APPROVED',
  isPhysical: true,
  chargeTax: true,
  inventoryTracked: true,
  allowBackorder: false,
  hasVariants: false,
  createdAt: now,
  updatedAt: now
};

const product3 = {
  id: 'prod_dell_dc15250_kn4ipb',
  name: 'Dell 15 DC15250-5434BLK-PUS Touchscreen',
  slug: 'dell-15-dc15250-5434blk-pus-touch-kn4ipb',
  sku: 'KN4IPB',
  barcode: '729183920195',
  brandId: 'brand_dell',
  brandName: 'Dell',
  categoryId: 'cat_laptops',
  categoryName: 'Laptops in Computers',
  sellerType: 'ADMIN',
  condition: 'Brand New (Factory Sealed)',
  price: 2699,
  salePrice: 2699,
  compareAtPrice: 2999,
  costPrice: 2250,
  currency: 'AED',
  stock: 5,
  reservedStock: 0,
  lowStockThreshold: 3,
  warranty: '1 Year Manufacturer Warranty Only',
  warrantyYears: 1,
  shortDescription: 'Dell 15 DC15250 Touchscreen 13th Gen Intel Core i5-1334U, 8GB RAM, 512GB SSD, 15.6" Touch FHD, Windows 11 Home',
  description: 'Dell 15 DC15250-5434BLK-PUS - KN4IPB BRAND NEW 13th GEN. Features Intel Core i5-1334U Processor, 8GB RAM, 512GB SSD, Intel UHD Graphics, 15.6" Touchscreen Full HD (1920x1080) Display, Carbon Black Finish, English Keyboard, Windows 11 Home. Manufacturer Part Number: M4CFY. Manufacturer Warranty Only.',
  specifications: {
    'LAPTOP | Brand': 'Dell',
    'LAPTOP | Model': 'DC15250-5434BLK-PUS',
    'LAPTOP | Part Number': 'KN4IPB',
    'LAPTOP | Manufacturer Part Number': 'M4CFY',
    'LAPTOP | Generation': '13th Gen Intel Core',
    'LAPTOP | Processor': 'Intel Core i5-1334U',
    'LAPTOP | Memory (RAM)': '8GB DDR4',
    'LAPTOP | Storage': '512GB PCIe NVMe SSD',
    'LAPTOP | Graphics': 'Intel UHD Graphics',
    'LAPTOP | Screen Size': '15.6"',
    'LAPTOP | Display Resolution': 'FHD (1920 x 1080)',
    'LAPTOP | Display Technology': 'Touchscreen LED Backlit',
    'LAPTOP | Touchscreen': 'Yes (10-point Multi-touch)',
    'LAPTOP | Color': 'Carbon Black',
    'LAPTOP | Keyboard': 'English (ENG KB)',
    'LAPTOP | Operating System': 'Windows 11 Home',
    'LAPTOP | Warranty': 'Manufacturer Warranty Only'
  },
  features: [
    '13th Generation Intel Core i5-1334U Processor',
    '15.6-inch Full HD (1920x1080) Interactive Touchscreen Display',
    '8GB RAM & Fast 512GB NVMe SSD Storage',
    'Sleek Carbon Black Finish with Lift-Hinge Ergonomics',
    'Pre-installed Windows 11 Home with Full Microsoft Ecosystem Support',
    'Official Manufacturer Warranty'
  ],
  tags: ['Dell', '15 DC15250', 'Touchscreen', 'Laptop', '13th Gen', 'Intel i5', 'Windows 11', 'ComNet'],
  collections: ['Laptops', 'Dell', 'Touchscreen Laptops'],
  images: [
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8'
  ],
  thumbnail: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45',
  locations: [
    {
      locationId: 'loc_dxb_main',
      locationName: 'Dubai Logistics Hub (JAFZA)',
      city: 'Dubai',
      quantity: 3,
      available: 3,
      committed: 0,
      unavailable: 0,
      onHand: 3
    },
    {
      locationId: 'loc_deira_tech',
      locationName: 'Deira Showroom & Tech Center',
      city: 'Dubai',
      quantity: 2,
      available: 2,
      committed: 0,
      unavailable: 0,
      onHand: 2
    }
  ],
  rating: 5,
  reviewCount: 0,
  isFeatured: false,
  isActive: true,
  approvalStatus: 'APPROVED',
  isPhysical: true,
  chargeTax: true,
  inventoryTracked: true,
  allowBackorder: false,
  hasVariants: false,
  createdAt: now,
  updatedAt: now
};

// 1. Update products.json
const prodPath = 'e:/eCommerce_Store/backend/data_store/products.json';
const data = JSON.parse(fs.readFileSync(prodPath, 'utf8'));
const list = data.value || data;

const filteredList = list.filter(p => !['prod_asus_b1502cva_b7acjl', 'prod_dell_pv15250_j1a0bg', 'prod_dell_dc15250_kn4ipb'].includes(p.id));
filteredList.push(product1, product2, product3);

fs.writeFileSync(prodPath, JSON.stringify(filteredList, null, 2), 'utf8');
console.log('Successfully updated products.json! Total products:', filteredList.length);

// 2. Prepare and export fixed Excel & CSV files
const importsDir = 'e:/eCommerce_Store/backend/data_store/product_imports';
if (!fs.existsSync(importsDir)) {
  fs.mkdirSync(importsDir, { recursive: true });
}

const excelRows = [
  {
    'ID #': '1',
    'SKU / Part Number': 'B7ACJL',
    'Product Title': 'ASUS ExpertBook B1502CVA-NJ3464W',
    'Brand': 'ASUS',
    'Category': 'Laptops',
    'Condition': 'Brand New (Factory Sealed)',
    'Processor (CPU)': 'Intel Core i3-1315U (13th Gen)',
    'RAM (Memory)': '8GB',
    'Storage (SSD)': '256GB SSD',
    'Graphics (GPU)': 'Intel UHD Graphics',
    'Screen Size': '15.6"',
    'Display Resolution': 'FHD (1920x1080)',
    'Touchscreen': 'No',
    'Color': 'Gentle Grey',
    'Keyboard': 'English (ENG KB)',
    'Operating System': 'Windows 11 Home',
    'Manufacturer Part No': '90NX0801-M04XV0',
    'Warranty': 'Manufacturer Warranty Only',
    'Qty (Stock)': 5,
    'Low Stock Threshold': 3,
    'Price (AED)': 2199,
    'Price (USD)': 599,
    'Compare At Price (AED)': 2499,
    'Warehouse Location': 'Dubai Logistics Hub (JAFZA)',
    'Status': 'ACTIVE',
    'Notes': 'Qty and Price are placeholder defaults - adjust to your exact store inventory'
  },
  {
    'ID #': '2',
    'SKU / Part Number': 'J1A0BG',
    'Product Title': 'Dell Pro 15 Essential PV15250',
    'Brand': 'Dell',
    'Category': 'Laptops',
    'Condition': 'Brand New (Factory Sealed)',
    'Processor (CPU)': 'Intel Core i5-1334U (13th Gen)',
    'RAM (Memory)': '8GB',
    'Storage (SSD)': '512GB SSD',
    'Graphics (GPU)': 'Intel UHD Graphics',
    'Screen Size': '15.6"',
    'Display Resolution': 'FHD (1920x1080)',
    'Touchscreen': 'No',
    'Color': 'Black',
    'Keyboard': 'English with Numeric Keypad',
    'Operating System': 'DOS',
    'Manufacturer Part No': 'PV15250 i5',
    'Warranty': 'Manufacturer Warranty Only',
    'Qty (Stock)': 5,
    'Low Stock Threshold': 3,
    'Price (AED)': 2499,
    'Price (USD)': 680,
    'Compare At Price (AED)': 2799,
    'Warehouse Location': 'Dubai Logistics Hub (JAFZA)',
    'Status': 'ACTIVE',
    'Notes': 'Includes Fingerprint Reader'
  },
  {
    'ID #': '3',
    'SKU / Part Number': 'KN4IPB',
    'Product Title': 'Dell 15 DC15250-5434BLK-PUS Touchscreen',
    'Brand': 'Dell',
    'Category': 'Laptops',
    'Condition': 'Brand New (Factory Sealed)',
    'Processor (CPU)': 'Intel Core i5-1334U (13th Gen)',
    'RAM (Memory)': '8GB',
    'Storage (SSD)': '512GB SSD',
    'Graphics (GPU)': 'Intel UHD Graphics',
    'Screen Size': '15.6"',
    'Display Resolution': 'FHD (1920x1080)',
    'Touchscreen': 'Yes (Touch)',
    'Color': 'Carbon Black',
    'Keyboard': 'English (ENG KB)',
    'Operating System': 'Windows 11 Home',
    'Manufacturer Part No': 'M4CFY',
    'Warranty': 'Manufacturer Warranty Only',
    'Qty (Stock)': 5,
    'Low Stock Threshold': 3,
    'Price (AED)': 2699,
    'Price (USD)': 735,
    'Compare At Price (AED)': 2999,
    'Warehouse Location': 'Dubai Logistics Hub (JAFZA)',
    'Status': 'ACTIVE',
    'Notes': 'Touchscreen model with Windows 11 Home pre-installed'
  }
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(excelRows);
ws['!cols'] = Object.keys(excelRows[0]).map(() => ({ wch: 26 }));
xlsx.utils.book_append_sheet(wb, ws, 'Inventory');

const excelFilePath1 = path.join(importsDir, 'ComNet_Inventory_Fixed.xlsx');
const excelFilePath2 = 'e:/eCommerce_Store/ComNet_Inventory_Fixed.xlsx';
xlsx.writeFile(wb, excelFilePath1);
xlsx.writeFile(wb, excelFilePath2);
console.log('Saved fixed Excel files at:', excelFilePath1, 'and', excelFilePath2);

const csvContent = xlsx.utils.sheet_to_csv(ws);
fs.writeFileSync(path.join(importsDir, 'ComNet_Inventory_Fixed.csv'), csvContent, 'utf8');
fs.writeFileSync('e:/eCommerce_Store/ComNet_Inventory_Fixed.csv', csvContent, 'utf8');
console.log('Saved fixed CSV files!');

fs.writeFileSync(path.join(importsDir, 'comnet_inventory_template.json'), JSON.stringify(excelRows, null, 2), 'utf8');
console.log('Saved JSON template!');

