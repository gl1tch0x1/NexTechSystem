// Resilient fallback data for standalone Next.js deployment (Vercel serverless runtime)
import {
  Product,
  Category,
  Brand,
  HeroHighlight,
  EnterpriseSolution,
  HardwareBenchmarkCategory,
  ClientTestimonial,
  BentoFeature,
  BuilderPreset,
  Coupon,
  StoreSettings,
  HomePageContent,
} from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_BRANDS } from './default-taxonomy';

export const FALLBACK_PRODUCTS: Product[] = [
  {
    "id": "prod_cpu_14900k",
    "name": "Intel Core i9-14900K 24-Core Desktop Processor",
    "slug": "intel-core-i9-14900k-processor",
    "sku": "BX8071514900K",
    "barcode": "735858547285",
    "brandId": "brand_intel",
    "brandName": "Intel",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 2249,
    "salePrice": 2099,
    "compareAtPrice": 2499,
    "costPrice": 1850,
    "currency": "AED",
    "stock": 41,
    "reservedStock": 2,
    "lowStockThreshold": 5,
    "images": [
      "/images/intel_i9_14900k.jpg",
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "/images/intel_i9_14900k.jpg",
    "specifications": {
      "processor": "Intel Core i9-14900K",
      "socket": "LGA1700",
      "cores": "24 (8P + 16E)",
      "threads": "32",
      "maxBoostClock": "6.0 GHz",
      "wattage": "125W Base / 253W Boost",
      "cache": "36MB Intel Smart Cache"
    },
    "features": [
      "Thermal Velocity Boost up to 6.0 GHz",
      "PCIe 5.0 and DDR5/DDR4 Support",
      "Intel UHD Graphics 770 Integrated"
    ],
    "tags": [
      "Intel",
      "Core i9",
      "LGA1700",
      "CPU",
      "Gaming"
    ],
    "warranty": "3 Years Intel Manufacturer Warranty",
    "rating": 4.9,
    "reviewCount": 38,
    "isFeatured": true,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-12T14:17:27.213Z"
  },
  {
    "id": "prod_cpu_7950x",
    "name": "AMD Ryzen 9 7950X 16-Core 32-Thread Processor",
    "slug": "amd-ryzen-9-7950x-processor",
    "sku": "100-100000514WOF",
    "barcode": "730143314541",
    "brandId": "brand_amd",
    "brandName": "AMD",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 2199,
    "salePrice": 1999,
    "compareAtPrice": 2399,
    "costPrice": 1750,
    "currency": "AED",
    "stock": 30,
    "reservedStock": 0,
    "lowStockThreshold": 5,
    "images": [
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "processor": "AMD Ryzen 9 7950X",
      "socket": "AM5",
      "cores": "16",
      "threads": "32",
      "maxBoostClock": "5.7 GHz",
      "wattage": "170W TDP",
      "cache": "80MB Total Cache"
    },
    "features": [
      "Zen 4 Architecture on 5nm",
      "Requires DDR5 Memory",
      "AMD EXPO Profile Support"
    ],
    "tags": [
      "AMD",
      "Ryzen 9",
      "AM5",
      "Zen 4",
      "CPU"
    ],
    "warranty": "3 Years AMD Box Warranty",
    "rating": 4.8,
    "reviewCount": 29,
    "isFeatured": true,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_mb_z790",
    "name": "ASUS ROG Maximus Z790 Dark Hero Motherboard",
    "slug": "asus-rog-maximus-z790-dark-hero",
    "sku": "ROG-MAX-Z790-DH",
    "brandId": "brand_asus",
    "brandName": "ASUS",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 2599,
    "compareAtPrice": 2799,
    "costPrice": 2100,
    "currency": "AED",
    "stock": 20,
    "reservedStock": 1,
    "lowStockThreshold": 4,
    "images": [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "socket": "LGA1700",
      "ramType": "DDR5",
      "chipset": "Intel Z790",
      "formFactor": "ATX",
      "memorySlots": "4x DDR5 (Up to 192GB, 8000+ MHz)",
      "pcieSlots": "2x PCIe 5.0 x16",
      "wifi": "Wi-Fi 7 + 2.5Gb LAN"
    },
    "features": [
      "20+1+2 Power Stages",
      "PCIe 5.0 M.2 Support",
      "Dual Thunderbolt 4 Type-C Ports"
    ],
    "tags": [
      "ASUS",
      "ROG",
      "Motherboard",
      "Z790",
      "LGA1700",
      "DDR5"
    ],
    "warranty": "3 Years Manufacturer Warranty",
    "rating": 4.9,
    "reviewCount": 19,
    "isFeatured": false,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_mb_x670e",
    "name": "ASUS ROG Crosshair X670E Hero Motherboard",
    "slug": "asus-rog-crosshair-x670e-hero",
    "sku": "ROG-X670E-HERO",
    "brandId": "brand_asus",
    "brandName": "ASUS",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 2499,
    "compareAtPrice": 2699,
    "costPrice": 2050,
    "currency": "AED",
    "stock": 18,
    "reservedStock": 0,
    "lowStockThreshold": 3,
    "images": [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "socket": "AM5",
      "ramType": "DDR5",
      "chipset": "AMD X670E",
      "formFactor": "ATX",
      "memorySlots": "4x DDR5 (Up to 192GB)",
      "pcieSlots": "2x PCIe 5.0 x16",
      "wifi": "Wi-Fi 6E + 2.5G Intel LAN"
    },
    "features": [
      "18+2 Teamed Power Stages",
      "Dual USB4 Type-C Ports",
      "Polymo Lighting"
    ],
    "tags": [
      "ASUS",
      "Motherboard",
      "AM5",
      "X670E",
      "DDR5"
    ],
    "warranty": "3 Years Warranty",
    "rating": 4.8,
    "reviewCount": 14,
    "isFeatured": false,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_gpu_4090",
    "name": "ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB GDDR6X",
    "slug": "asus-rog-strix-geforce-rtx-4090-oc-24gb",
    "sku": "ROG-RTX4090-O24G-GAMING",
    "barcode": "195553927429",
    "brandId": "brand_asus",
    "brandName": "ASUS",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 7899,
    "salePrice": 7499,
    "compareAtPrice": 8299,
    "costPrice": 6900,
    "currency": "AED",
    "stock": 12,
    "reservedStock": 1,
    "lowStockThreshold": 3,
    "images": [
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "gpu": "NVIDIA GeForce RTX 4090",
      "vram": "24GB GDDR6X",
      "memoryBus": "384-bit",
      "wattage": "450W",
      "recommendedPsu": "1000W",
      "length": "357.6 mm (3.5-Slot)",
      "connectors": "1x 16-pin 12VHPWR"
    },
    "features": [
      "3.5-slot design with massive vapor chamber",
      "Patented axial-tech fans with 23% more airflow",
      "Diecast shroud, frame, and backplate"
    ],
    "tags": [
      "NVIDIA",
      "RTX 4090",
      "24GB",
      "ASUS",
      "ROG",
      "Flagship"
    ],
    "warranty": "3 Years Official UAE Distributor Warranty",
    "rating": 5,
    "reviewCount": 42,
    "isFeatured": true,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_ram_64gb",
    "name": "Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5 6000MHz CL30",
    "slug": "corsair-dominator-titanium-rgb-64gb-ddr5-6000mhz",
    "sku": "CMP64GX5M2B6000C30",
    "brandId": "brand_corsair",
    "brandName": "Corsair",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 1199,
    "salePrice": 1049,
    "compareAtPrice": 1299,
    "costPrice": 850,
    "currency": "AED",
    "stock": 35,
    "reservedStock": 0,
    "lowStockThreshold": 5,
    "images": [
      "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "ramType": "DDR5",
      "capacity": "64GB (2x32GB)",
      "speed": "6000 MHz",
      "timings": "CL30-36-36-76",
      "voltage": "1.40V",
      "profile": "Intel XMP 3.0 & AMD EXPO"
    },
    "features": [
      "Forged aluminum construction with patented DHX cooling",
      "11 vibrant addressable RGB LEDs",
      "Interchangeable top bars"
    ],
    "tags": [
      "Corsair",
      "DDR5",
      "64GB",
      "RAM",
      "RGB"
    ],
    "warranty": "Lifetime Limited Warranty",
    "rating": 4.9,
    "reviewCount": 16,
    "isFeatured": false,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_ssd_990pro_4tb",
    "name": "Samsung 990 PRO 4TB PCIe Gen4 x4 M.2 NVMe SSD",
    "slug": "samsung-990-pro-4tb-nvme-ssd",
    "sku": "MZ-V9P4T0BW",
    "barcode": "887276785234",
    "brandId": "brand_samsung",
    "brandName": "Samsung Semiconductor",
    "categoryId": "cat_storage",
    "categoryName": "Storage & Drives",
    "sellerType": "ADMIN",
    "price": 1449,
    "salePrice": 1299,
    "compareAtPrice": 1599,
    "costPrice": 1100,
    "currency": "AED",
    "stock": 40,
    "reservedStock": 2,
    "lowStockThreshold": 5,
    "images": [
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "capacity": "4TB",
      "interface": "PCIe Gen 4.0 x4, NVMe 2.0",
      "readSpeed": "Up to 7,450 MB/s",
      "writeSpeed": "Up to 6,900 MB/s",
      "formFactor": "M.2 2280",
      "endurance": "2,400 TBW"
    },
    "features": [
      "In-house Samsung Pascal controller",
      "Nickel-coated controller and heat spreader label",
      "Samsung Magician software optimization"
    ],
    "tags": [
      "Samsung",
      "990 PRO",
      "SSD",
      "NVMe",
      "4TB",
      "PCIe 4.0"
    ],
    "warranty": "5 Years Manufacturer Warranty",
    "rating": 5,
    "reviewCount": 51,
    "isFeatured": true,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_psu_1000w",
    "name": "Corsair RM1000x Shift 1000W 80 PLUS Gold Fully Modular ATX 3.0 PSU",
    "slug": "corsair-rm1000x-shift-1000w-gold-power-supply",
    "sku": "CP-9020253-NA",
    "brandId": "brand_corsair",
    "brandName": "Corsair",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 899,
    "salePrice": 799,
    "compareAtPrice": 949,
    "costPrice": 620,
    "currency": "AED",
    "stock": 25,
    "reservedStock": 1,
    "lowStockThreshold": 4,
    "images": [
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "wattage": "1000W",
      "efficiency": "80 PLUS Gold Certified",
      "formFactor": "ATX 3.0 & PCIe 5.0 Compliant",
      "modular": "Fully Modular (Side Interface)",
      "fanSize": "140mm Fluid Dynamic Bearing"
    },
    "features": [
      "Revolutionary side-mounted cable interface",
      "Native 12VHPWR cable included",
      "Zero RPM fan mode at low loads"
    ],
    "tags": [
      "Corsair",
      "PSU",
      "1000W",
      "Gold",
      "Modular",
      "ATX 3.0"
    ],
    "warranty": "10 Years Corsair Warranty",
    "rating": 4.9,
    "reviewCount": 22,
    "isFeatured": false,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_case_h9",
    "name": "NZXT H9 Flow Dual-Chamber ATX Mid-Tower Case - Black",
    "slug": "nzxt-h9-flow-mid-tower-case-black",
    "sku": "CM-H91FB-01",
    "brandId": "brand_asus",
    "brandName": "ASUS",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 699,
    "compareAtPrice": 749,
    "costPrice": 510,
    "currency": "AED",
    "stock": 15,
    "reservedStock": 0,
    "lowStockThreshold": 3,
    "images": [
      "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "formFactor": "ATX Mid-Tower (Dual-Chamber)",
      "gpuClearance": "Up to 435 mm",
      "coolerClearance": "Up to 165 mm",
      "radiatorSupport": "Up to 360mm Top / Side / Bottom",
      "frontPorts": "2x USB 3.2 Gen 1, 1x USB 3.2 Gen 2 Type-C"
    },
    "features": [
      "Seamless uninterrupted tempered glass front and side panels",
      "Perforated top panel for maximum airflow",
      "Intuitive cable routing channel system"
    ],
    "tags": [
      "NZXT",
      "Case",
      "Dual Chamber",
      "Glass",
      "ATX"
    ],
    "warranty": "2 Years Manufacturer Warranty",
    "rating": 4.8,
    "reviewCount": 31,
    "isFeatured": false,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_cooler_kraken360",
    "name": "NZXT Kraken Elite 360 RGB 360mm AIO Liquid Cooler with LCD Display",
    "slug": "nzxt-kraken-elite-360-rgb-liquid-cooler",
    "sku": "RL-KR36E-B1",
    "brandId": "brand_asus",
    "brandName": "ASUS",
    "categoryId": "cat_components",
    "categoryName": "PC Components",
    "sellerType": "ADMIN",
    "price": 1199,
    "salePrice": 1099,
    "compareAtPrice": 1299,
    "costPrice": 880,
    "currency": "AED",
    "stock": 22,
    "reservedStock": 1,
    "lowStockThreshold": 4,
    "images": [
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "coolerType": "360mm AIO Liquid Cooler",
      "socketCompatibility": "Intel LGA 1700, 1200, 115X / AMD AM5, AM4",
      "lcdDisplay": "2.36\" Wide-Angle TFT-LCD (640x640, 60 Hz)",
      "radiatorSize": "394 x 120 x 27 mm",
      "fans": "3x F120 RGB Core Fans"
    },
    "features": [
      "High-performance Asetek 7th Gen V2 pump (800 - 2800 RPM)",
      "Customizable GIF & live thermal display via NZXT CAM",
      "Reinforced extended rubber tubing"
    ],
    "tags": [
      "Cooler",
      "AIO",
      "360mm",
      "Liquid Cooling",
      "RGB",
      "LCD"
    ],
    "warranty": "6 Years Warranty",
    "rating": 4.9,
    "reviewCount": 27,
    "isFeatured": false,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_laptop_zephyrus16",
    "name": "ASUS ROG Zephyrus G16 (2026) 16\" 2.5K OLED 240Hz Gaming Laptop",
    "slug": "asus-rog-zephyrus-g16-oled-gaming-laptop",
    "sku": "GU605MY-QR042W",
    "brandId": "brand_asus",
    "brandName": "ASUS",
    "categoryId": "cat_laptops",
    "categoryName": "Laptops",
    "sellerType": "ADMIN",
    "price": 11499,
    "salePrice": 10899,
    "compareAtPrice": 12299,
    "costPrice": 9600,
    "currency": "AED",
    "stock": 8,
    "reservedStock": 1,
    "lowStockThreshold": 2,
    "images": [
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "processor": "Intel Core Ultra 9 185H",
      "gpu": "NVIDIA GeForce RTX 4090 16GB GDDR6 (115W TGP)",
      "ram": "32GB LPDDR5X-7467 MHz",
      "storage": "2TB PCIe 4.0 NVMe SSD",
      "display": "16-inch 2.5K (2560x1600) ROG Nebula OLED 240Hz 0.2ms",
      "weight": "1.85 kg CNC Aluminum Chassis"
    },
    "features": [
      "Ultra-sleek 1.49cm CNC aluminum unibody",
      "Slash Lighting array on lid",
      "ROG Intelligent Cooling with vapor chamber"
    ],
    "tags": [
      "Laptop",
      "ASUS",
      "Zephyrus",
      "OLED",
      "RTX 4090",
      "Ultra 9"
    ],
    "warranty": "2 Years ASUS International Warranty with Perfect Warranty Accidental Protection",
    "rating": 5,
    "reviewCount": 18,
    "isFeatured": true,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_server_r760",
    "name": "Dell PowerEdge R760 2U Rack Server (Dual Intel Xeon Gold 6430 / 128GB ECC / 8x 3.84TB NVMe SSD)",
    "slug": "dell-poweredge-r760-2u-enterprise-rack-server",
    "sku": "DELL-PE-R760-ENT",
    "brandId": "brand_dell",
    "brandName": "Dell Technologies",
    "categoryId": "cat_servers",
    "categoryName": "Servers & Enterprise",
    "sellerType": "RESELLER",
    "resellerId": "reseller_comnet_101",
    "resellerCode": "comnet101",
    "resellerName": "ComNet Hardware Store",
    "price": 34999,
    "salePrice": 32500,
    "compareAtPrice": 36999,
    "costPrice": 28500,
    "currency": "AED",
    "stock": 5,
    "reservedStock": 0,
    "lowStockThreshold": 2,
    "images": [
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "processor": "2x Intel Xeon Gold 6430 (64 Cores Total, 2.1 GHz Base)",
      "ram": "128GB (4x 32GB) DDR5-4800 ECC Registered RDIMM",
      "storage": "8x 3.84TB Enterprise NVMe U.2 Read Intensive SSDs (30TB Raw)",
      "raidController": "PERC H755 Front SAS/SATA/NVMe RAID (RAID 0, 1, 5, 6, 10, 50, 60)",
      "powerSupply": "Dual 1400W Titanium Hot-Plug Redundant PSUs",
      "management": "iDRAC9 Enterprise 16G with OpenManage"
    },
    "features": [
      "High-density compute for AI inferencing and virtualization workloads",
      "Multi-vector cooling architecture with dynamic airflow",
      "Zero-Trust security architecture with cyber-resilient silicon"
    ],
    "tags": [
      "Server",
      "Dell",
      "PowerEdge",
      "Xeon",
      "Enterprise",
      "Rackmount",
      "NVMe"
    ],
    "warranty": "5 Years Dell ProSupport Plus 24x7 4-Hour Onsite Service",
    "rating": 5,
    "reviewCount": 9,
    "isFeatured": true,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "id": "prod_net_c9300",
    "name": "Cisco Catalyst 9300 Series 48-Port PoE+ Managed Network Switch",
    "slug": "cisco-catalyst-9300-48-port-poe-managed-switch",
    "sku": "C9300-48P-A",
    "brandId": "brand_cisco",
    "brandName": "Cisco Systems",
    "categoryId": "cat_networking",
    "categoryName": "Networking Devices",
    "sellerType": "RESELLER",
    "resellerId": "reseller_comnet_101",
    "resellerCode": "comnet101",
    "resellerName": "ComNet Hardware Store",
    "price": 18499,
    "compareAtPrice": 19800,
    "costPrice": 15200,
    "currency": "AED",
    "stock": 7,
    "reservedStock": 0,
    "lowStockThreshold": 2,
    "images": [
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80",
    "specifications": {
      "ports": "48x 10/100/1000 Gigabit Ethernet PoE+ Ports",
      "poeBudget": "437W (Expandable to 1440W with secondary PSU)",
      "switchingCapacity": "256 Gbps (Stacking up to 480 Gbps with StackWise-480)",
      "software": "Cisco DNA Advantage License Included"
    },
    "features": [
      "High density enterprise access layer switch",
      "Hardware support for Cisco TrustSec and MACsec 256-bit encryption",
      "Encrypted Traffic Analytics (ETA) built-in"
    ],
    "tags": [
      "Cisco",
      "Catalyst",
      "Switch",
      "PoE+",
      "Enterprise",
      "Networking"
    ],
    "warranty": "Enhanced Limited Lifetime Warranty (E-LLW)",
    "rating": 4.9,
    "reviewCount": 12,
    "isFeatured": false,
    "isActive": true,
    "approvalStatus": "APPROVED",
    "createdAt": "2026-09-10T14:19:10.776Z",
    "updatedAt": "2026-09-10T14:19:10.776Z"
  },
  {
    "name": "Enterprise Ultra NVMe 4TB SSD Module",
    "sku": "COM-NVME-4TB-01",
    "brandName": "ComNet Tech",
    "categoryName": "Storage & Drives",
    "categoryId": "cat_storage",
    "price": 1499,
    "stock": 35,
    "description": "High performance PCIe 5.0 Enterprise Grade NVMe drive with 14,000 MB/s read speeds.",
    "sellerType": "RESELLER",
    "resellerId": "reseller_50895e9a-ee8e-4b9e-9a10-c303de840934",
    "resellerCode": "code130355",
    "resellerName": "Test Partner Store 130355",
    "approvalStatus": "APPROVED",
    "isActive": true,
    "id": "prod_7d40e8df-f58f-4eee-a81a-458ac362682a",
    "slug": "enterprise-ultra-nvme-4tb-ssd-module-mtyg2c8y",
    "rating": 5,
    "reviewCount": 0,
    "reservedStock": 0,
    "lowStockThreshold": 5,
    "isFeatured": false,
    "specifications": {},
    "features": [],
    "tags": [],
    "images": [
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    "createdAt": "2026-09-12T13:52:10.882Z",
    "updatedAt": "2026-09-12T13:52:10.899Z",
    "brandId": "brand_comnettech",
    "currency": "AED"
  },
  {
    "name": "Rejected Sample Product",
    "sku": "REJ-SAMPLE-01",
    "brandName": "Test Brand",
    "categoryName": "Components",
    "categoryId": "cat_components",
    "price": 99,
    "stock": 5,
    "description": "Test Description",
    "sellerType": "RESELLER",
    "resellerId": "reseller_50895e9a-ee8e-4b9e-9a10-c303de840934",
    "resellerCode": "code130355",
    "resellerName": "Test Partner Store 130355",
    "approvalStatus": "REJECTED",
    "isActive": false,
    "id": "prod_b221f8dd-5772-488b-bd99-7155ebf2e3dd",
    "slug": "rejected-sample-product-mtyg2ca5",
    "rating": 5,
    "reviewCount": 0,
    "reservedStock": 0,
    "lowStockThreshold": 5,
    "isFeatured": false,
    "specifications": {},
    "features": [],
    "tags": [],
    "images": [
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    "createdAt": "2026-09-12T13:52:10.925Z",
    "updatedAt": "2026-09-12T13:52:10.928Z",
    "rejectionReason": "Incomplete warranty and technical specifications",
    "brandId": "brand_testbrand",
    "currency": "AED"
  },
  {
    "name": "Enterprise Ultra NVMe 4TB SSD Module",
    "sku": "COM-NVME-4TB-01",
    "brandName": "ComNet Tech",
    "categoryName": "Storage & Drives",
    "categoryId": "cat_storage",
    "price": 1499,
    "stock": 35,
    "description": "High performance PCIe 5.0 Enterprise Grade NVMe drive with 14,000 MB/s read speeds.",
    "sellerType": "RESELLER",
    "resellerId": "reseller_6c968a4c-7cdd-4d08-9bb9-e439e3d76c43",
    "resellerCode": "code206206",
    "resellerName": "Test Partner Store 206206",
    "approvalStatus": "APPROVED",
    "isActive": true,
    "id": "prod_5f16c8e7-f421-48d2-8c0c-bffc0dc2b75e",
    "slug": "enterprise-ultra-nvme-4tb-ssd-module-mtyg3yko",
    "rating": 5,
    "reviewCount": 0,
    "reservedStock": 0,
    "lowStockThreshold": 5,
    "isFeatured": false,
    "specifications": {},
    "features": [],
    "tags": [],
    "images": [
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    "createdAt": "2026-09-12T13:53:26.472Z",
    "updatedAt": "2026-09-12T13:53:26.491Z",
    "brandId": "brand_comnettech",
    "currency": "AED"
  },
  {
    "name": "Rejected Sample Product",
    "sku": "REJ-SAMPLE-01",
    "brandName": "Test Brand",
    "categoryName": "Components",
    "categoryId": "cat_components",
    "price": 99,
    "stock": 5,
    "description": "Test Description",
    "sellerType": "RESELLER",
    "resellerId": "reseller_6c968a4c-7cdd-4d08-9bb9-e439e3d76c43",
    "resellerCode": "code206206",
    "resellerName": "Test Partner Store 206206",
    "approvalStatus": "REJECTED",
    "isActive": false,
    "id": "prod_b1058c03-cf30-411d-8c55-4d2d7571c261",
    "slug": "rejected-sample-product-mtyg3ym8",
    "rating": 5,
    "reviewCount": 0,
    "reservedStock": 0,
    "lowStockThreshold": 5,
    "isFeatured": false,
    "specifications": {},
    "features": [],
    "tags": [],
    "images": [
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    "createdAt": "2026-09-12T13:53:26.528Z",
    "updatedAt": "2026-09-12T13:53:26.532Z",
    "rejectionReason": "Incomplete warranty and technical specifications",
    "brandId": "brand_testbrand",
    "currency": "AED"
  },
  {
    "name": "Enterprise Ultra NVMe 4TB SSD Module",
    "sku": "COM-NVME-4TB-01",
    "brandName": "ComNet Tech",
    "categoryName": "Storage & Drives",
    "categoryId": "cat_storage",
    "price": 1499,
    "stock": 35,
    "description": "High performance PCIe 5.0 Enterprise Grade NVMe drive with 14,000 MB/s read speeds.",
    "sellerType": "RESELLER",
    "resellerId": "reseller_52ac85fa-509c-48b3-b156-1ab34d70a0b5",
    "resellerCode": "code646617",
    "resellerName": "Test Partner Store 646617",
    "approvalStatus": "APPROVED",
    "isActive": true,
    "id": "prod_59107602-cf80-4fc9-8865-37fd3389b0fd",
    "slug": "enterprise-ultra-nvme-4tb-ssd-module-mtygyuas",
    "rating": 5,
    "reviewCount": 0,
    "reservedStock": 0,
    "lowStockThreshold": 5,
    "isFeatured": false,
    "specifications": {},
    "features": [],
    "tags": [],
    "images": [
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    "createdAt": "2026-09-12T14:17:27.269Z",
    "updatedAt": "2026-09-12T14:17:27.351Z",
    "brandId": "brand_comnettech",
    "currency": "AED"
  },
  {
    "name": "Rejected Sample Product",
    "sku": "REJ-SAMPLE-01",
    "brandName": "Test Brand",
    "categoryName": "Components",
    "categoryId": "cat_components",
    "price": 99,
    "stock": 5,
    "description": "Test Description",
    "sellerType": "RESELLER",
    "resellerId": "reseller_52ac85fa-509c-48b3-b156-1ab34d70a0b5",
    "resellerCode": "code646617",
    "resellerName": "Test Partner Store 646617",
    "approvalStatus": "REJECTED",
    "isActive": false,
    "id": "prod_5aaebbf8-252d-4739-8d59-c1ee41cd2e83",
    "slug": "rejected-sample-product-mtygyueq",
    "rating": 5,
    "reviewCount": 0,
    "reservedStock": 0,
    "lowStockThreshold": 5,
    "isFeatured": false,
    "specifications": {},
    "features": [],
    "tags": [],
    "images": [
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80"
    ],
    "thumbnail": "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80",
    "createdAt": "2026-09-12T14:17:27.410Z",
    "updatedAt": "2026-09-12T14:17:27.415Z",
    "rejectionReason": "Incomplete warranty and technical specifications",
    "brandId": "brand_testbrand",
    "currency": "AED"
  }
];

export const FALLBACK_HERO_HIGHLIGHTS: HeroHighlight[] = [
  {
    "id": "hero_gpu",
    "tabLabel": "GPU",
    "name": "ASUS ROG Strix RTX 4090 OC 24GB",
    "brand": "ASUS ROG",
    "category": "Graphics Processing Unit (GPU)",
    "badge": "AI & Render Flagship",
    "iconName": "Zap",
    "specs": [
      {
        "label": "Architecture",
        "value": "Ada Lovelace 4nm"
      },
      {
        "label": "VRAM",
        "value": "24GB GDDR6X 384-bit"
      },
      {
        "label": "CUDA Cores",
        "value": "16,384 Cores"
      },
      {
        "label": "TDP Power",
        "value": "450W (1000W Req)"
      }
    ],
    "matchQueries": [
      "rtx 4090",
      "4090",
      "rtx-4090",
      "geforce"
    ],
    "defaultImage": "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80",
    "defaultPrice": 7499,
    "tagline": "World-leading graphics compute for 4K ray tracing & LLM inference.",
    "powerRating": "450W TDP",
    "order": 1,
    "isActive": true
  },
  {
    "id": "hero_cpu",
    "tabLabel": "CPU",
    "name": "Intel Core i9-14900K 24-Core Desktop CPU",
    "brand": "Intel",
    "category": "Processor (CPU)",
    "badge": "Compute Benchmark King",
    "iconName": "Cpu",
    "specs": [
      {
        "label": "Cores / Threads",
        "value": "24C (8P+16E) / 32T"
      },
      {
        "label": "Max Frequency",
        "value": "Up to 6.0 GHz"
      },
      {
        "label": "Socket Type",
        "value": "LGA1700 (Z790)"
      },
      {
        "label": "Memory Support",
        "value": "DDR5 5600 / DDR4"
      }
    ],
    "matchQueries": [
      "14900k",
      "i9-14900k",
      "intel core i9"
    ],
    "defaultImage": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80",
    "defaultPrice": 2099,
    "tagline": "Extreme single-thread frequency and 32-thread multi-tasking power.",
    "powerRating": "253W Max",
    "order": 2,
    "isActive": true
  },
  {
    "id": "hero_server",
    "tabLabel": "SERVER",
    "name": "Dell PowerEdge R760 2U Rackmount Server",
    "brand": "Dell Technologies",
    "category": "Enterprise Server Node",
    "badge": "Mission-Critical Node",
    "iconName": "Server",
    "specs": [
      {
        "label": "Dual Socket",
        "value": "Intel Xeon Scalable 4th Gen"
      },
      {
        "label": "Memory",
        "value": "Up to 8TB DDR5 ECC Reg"
      },
      {
        "label": "Form Factor",
        "value": "2U Rack with iDRAC9"
      },
      {
        "label": "Redundancy",
        "value": "Dual 1400W Titanium"
      }
    ],
    "matchQueries": [
      "poweredge",
      "r760",
      "rack server",
      "dell poweredge"
    ],
    "defaultImage": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    "defaultPrice": 18499,
    "tagline": "Redundant high-density virtualization and enterprise database compute.",
    "powerRating": "Dual 1400W",
    "order": 3,
    "isActive": true
  },
  {
    "id": "hero_ssd",
    "tabLabel": "SSD",
    "name": "Samsung 990 PRO 4TB PCIe 4.0 NVMe SSD",
    "brand": "Samsung Semiconductor",
    "category": "High-Throughput Storage",
    "badge": "Gen4 Speed Benchmark",
    "iconName": "HardDrive",
    "specs": [
      {
        "label": "Seq. Read Speed",
        "value": "Up to 7,450 MB/s"
      },
      {
        "label": "Seq. Write Speed",
        "value": "Up to 6,900 MB/s"
      },
      {
        "label": "Controller",
        "value": "Samsung Pascal Controller"
      },
      {
        "label": "Durability",
        "value": "2,400 TBW 5-Year"
      }
    ],
    "matchQueries": [
      "990 pro",
      "samsung 990",
      "990-pro"
    ],
    "defaultImage": "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80",
    "defaultPrice": 1699,
    "tagline": "Instant boot times, sub-second 4K video asset scrubbing, and gaming speed.",
    "powerRating": "7.8W Max",
    "order": 4,
    "isActive": true
  }
];

export const FALLBACK_ENTERPRISE_SOLUTIONS: EnterpriseSolution[] = [
  {
    "id": "sol_ai",
    "title": "AI, LLM & Deep Learning Workstations",
    "badge": "Compute Dense",
    "badgeColor": "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-300",
    "glowColor": "from-purple-600/10 via-indigo-600/5 to-transparent",
    "borderColor": "group-hover:border-purple-500/50",
    "iconName": "BrainCircuit",
    "benchmarkScore": "120 TFLOPS Tensor Compute",
    "description": "Dedicated high-performance compute architectures engineered for local LLM inference, Stable Diffusion, and PyTorch/CUDA training clusters with zero thermal throttling.",
    "specs": [
      "Multi-GPU PCIe 5.0 x16 Topology with RTX 4090 / RTX 6000 Ada",
      "Direct Die & 360mm AIO Liquid Cooling with 1200W+ Platinum PSUs",
      "Up to 192GB DDR5 Dual/Quad-Channel Low-Latency Workstation RAM",
      "Direct GCC On-Site Setup and 5-Year Hardware Replacement"
    ],
    "popularSku": "Intel i9-14900K + RTX 4090 24GB AI Tower",
    "skuPrice": "From AED 14,899",
    "link": "/products?search=4090",
    "order": 1,
    "isActive": true
  },
  {
    "id": "sol_servers",
    "title": "Mission-Critical Virtualization & Rack Servers",
    "badge": "2U Rackmount Node",
    "badgeColor": "bg-tech-blue/15 border-tech-blue/30 text-tech-blue dark:text-tech-cyan",
    "glowColor": "from-blue-600/10 via-cyan-600/5 to-transparent",
    "borderColor": "group-hover:border-tech-blue/50",
    "iconName": "Server",
    "benchmarkScore": "99.999% HA Uptime Architecture",
    "description": "Enterprise 1U and 2U rack nodes for VMware ESXi, Proxmox, and Kubernetes clusters with hot-swap U.2 NVMe drives and redundant titanium power supplies.",
    "specs": [
      "Dual Socket 4th Gen Intel Xeon Scalable / AMD EPYC 9004",
      "Hot-Swap NVMe Gen4 Backplanes with hardware RAID 0/1/5/10",
      "Integrated Lights-Out Management (iDRAC9 Enterprise / IPMI 2.0)",
      "Dual 1400W+ 80 PLUS Titanium Hot-Plug Redundant PSUs"
    ],
    "popularSku": "Dell PowerEdge R760 2U Dual Xeon Node",
    "skuPrice": "From AED 18,499",
    "link": "/products?search=poweredge",
    "order": 2,
    "isActive": true
  },
  {
    "id": "sol_networking",
    "title": "100GbE Switching & Enterprise PoE+ Fabric",
    "badge": "Zero-Latency Core",
    "badgeColor": "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300",
    "glowColor": "from-emerald-600/10 via-teal-600/5 to-transparent",
    "borderColor": "group-hover:border-emerald-500/50",
    "iconName": "Network",
    "benchmarkScore": "100Gbps Sub-Microsecond Fabric",
    "description": "Carrier-grade Layer 3 managed fiber switching, multi-gigabit PoE+ distribution, and enterprise gateway security for data centers and commercial campuses.",
    "specs": [
      "48-Port Multi-Gigabit PoE+ (802.3bt 90W) with 100G QSFP28 Uplinks",
      "Non-Blocking Switching Fabric with Sub-Microsecond Latency",
      "Full L3 Routing (BGP, OSPF, VRF-Lite) and Zero-Touch Provisioning",
      "Dual Redundant Hot-Swappable Fans and Power Inverters"
    ],
    "popularSku": "Cisco Catalyst 9300 48P PoE+ Fiber Switch",
    "skuPrice": "From AED 7,299",
    "link": "/products?search=cisco",
    "order": 3,
    "isActive": true
  }
];

export const FALLBACK_BENCHMARKS: HardwareBenchmarkCategory[] = [
  {
    "id": "bench_cpu",
    "label": "CPU Multithread Compute",
    "iconName": "Cpu",
    "title": "Cinebench 2024 Multi-Core Rendering Benchmark",
    "metric": "Points (Higher is Better)",
    "benchmarks": [
      {
        "name": "Intel Core i9-14900K (24C/32T 6.0GHz)",
        "score": 2280,
        "maxScore": 2400,
        "isTop": true,
        "badge": "Flagship"
      },
      {
        "name": "AMD Ryzen 9 7950X (16C/32T 5.7GHz)",
        "score": 2160,
        "maxScore": 2400
      },
      {
        "name": "Intel Core i7-14700K (20C/28T 5.6GHz)",
        "score": 1940,
        "maxScore": 2400
      },
      {
        "name": "Intel Core i9-13900K (24C/32T 5.8GHz)",
        "score": 2190,
        "maxScore": 2400
      }
    ],
    "note": "Tested on Z790 motherboard with 64GB DDR5-6000MHz memory and 360mm liquid AIO.",
    "order": 1,
    "isActive": true
  },
  {
    "id": "bench_gpu",
    "label": "GPU AI & 3D Rendering",
    "iconName": "Zap",
    "title": "3DMark TimeSpy Extreme Graphics Score",
    "metric": "Graphics Points (Higher is Better)",
    "benchmarks": [
      {
        "name": "NVIDIA GeForce RTX 4090 24GB GDDR6X",
        "score": 19850,
        "maxScore": 21000,
        "isTop": true,
        "badge": "1st in Class"
      },
      {
        "name": "NVIDIA GeForce RTX 4080 Super 16GB",
        "score": 14200,
        "maxScore": 21000
      },
      {
        "name": "NVIDIA GeForce RTX 4070 Ti Super 16GB",
        "score": 11950,
        "maxScore": 21000
      },
      {
        "name": "NVIDIA GeForce RTX 3090 24GB (Previous Gen)",
        "score": 10400,
        "maxScore": 21000
      }
    ],
    "note": "Direct 4K rasterization and ray-tracing performance tested with DLSS 3.5 frame gen.",
    "order": 2,
    "isActive": true
  },
  {
    "id": "bench_storage",
    "label": "NVMe Gen4/Gen5 Throughput",
    "iconName": "HardDrive",
    "title": "Sequential Read Speed Benchmark (CrystalDiskMark)",
    "metric": "MB/s (Higher is Better)",
    "benchmarks": [
      {
        "name": "Samsung 990 PRO 2TB PCIe 4.0 NVMe",
        "score": 7450,
        "maxScore": 8000,
        "isTop": true,
        "badge": "7,450 MB/s"
      },
      {
        "name": "Crucial T500 2TB PCIe 4.0 NVMe",
        "score": 7300,
        "maxScore": 8000
      },
      {
        "name": "Samsung 980 PRO 1TB PCIe 4.0 NVMe",
        "score": 7000,
        "maxScore": 8000
      },
      {
        "name": "Standard SATA 2.5\" SSD",
        "score": 550,
        "maxScore": 8000
      }
    ],
    "note": "Direct PCIe Gen 4.0 x4 M.2 slot test on aluminum thermal heatsink.",
    "order": 3,
    "isActive": true
  }
];

export const FALLBACK_TESTIMONIALS: ClientTestimonial[] = [
  {
    "id": "test_1",
    "name": "Tariq Al-Mansoor",
    "initials": "TA",
    "role": "Head of Infrastructure",
    "company": "Dubai Silicon Oasis AI Hub",
    "rating": 5,
    "workload": "8x RTX 4090 Deep Learning Node",
    "text": "NexTech delivered our AI training workstations within 24 hours to our Silicon Oasis facility. The pre-tested thermal burn-in saved us days of QA, and their live socket validator is the best tool in the GCC.",
    "badge": "Verified Enterprise Client",
    "avatarColor": "from-blue-600 to-cyan-500",
    "order": 1,
    "isActive": true
  },
  {
    "id": "test_2",
    "name": "Dr. Faisal Al-Husseini",
    "initials": "FH",
    "role": "Principal Systems Architect",
    "company": "Riyadh Cloud & Data Center",
    "rating": 5,
    "workload": "Dell PowerEdge R760 2U Dual Xeon Cluster",
    "text": "Procuring high-density rack servers used to take 6 weeks through traditional distributors. NexTech provided transparent pricing, automated VAT invoices, and insured logistics directly to Riyadh.",
    "badge": "Tier-1 Reseller Partner",
    "avatarColor": "from-purple-600 to-indigo-500",
    "order": 2,
    "isActive": true
  },
  {
    "id": "test_3",
    "name": "Elena Rostova",
    "initials": "ER",
    "role": "Lead Unreal Engine Developer",
    "company": "Abu Dhabi Hub71 VFX Studio",
    "rating": 5,
    "workload": "Intel i9-14900K 64GB DDR5 CAD Rigs",
    "text": "The PC Builder studio made configuring 12 animation workstations effortless. Every component fit perfectly with zero clearance or power supply issues. Customer service is top-notch.",
    "badge": "Verified Commercial Buyer",
    "avatarColor": "from-emerald-600 to-teal-500",
    "order": 3,
    "isActive": true
  }
];

export const FALLBACK_BENTO_FEATURES: BentoFeature[] = [
  {
    "id": "feat_logistics",
    "title": "Insured Regional Express Dispatch & Real-Time Tracking",
    "subtitle": "Insured GCC Freight",
    "description": "Complimentary insured delivery on all hardware orders exceeding AED 500. Same-day dispatch across Dubai & Abu Dhabi, with guaranteed 24-48 hour regional express transit to Riyadh, Doha, Kuwait, Muscat, and Manama.",
    "tag": "⚡ GCC EXPRESS LOGISTICS",
    "iconName": "Truck",
    "gridSpan": 7,
    "stats": [
      {
        "label": "Zero-Loss Protection",
        "value": "100% Insured"
      },
      {
        "label": "UAE Direct Hubs",
        "value": "Same-Day"
      },
      {
        "label": "GPS Route Tracking",
        "value": "Real-Time"
      }
    ],
    "order": 1,
    "isActive": true
  },
  {
    "id": "feat_credit",
    "title": "Net-30 Enterprise Credit & Digital Wallet Settlement",
    "subtitle": "Corporate Billing",
    "description": "Streamlined procurement for system integrators with automated Zakat/VAT compliant invoices, escrow settlement, and instant wallet balance margin top-ups.",
    "tag": "💼 RESELLER TERMS",
    "iconName": "CreditCard",
    "gridSpan": 5,
    "ctaText": "Apply for Enterprise Terms",
    "ctaLink": "/auth",
    "order": 2,
    "isActive": true
  },
  {
    "id": "feat_stress_test",
    "title": "24-Hour Prime95 & FurMark Thermal Burn-In",
    "subtitle": "Quality Assurance",
    "description": "Every assembled workstation and rack server node undergoes sustained load testing to verify VRM thermal efficiency and eliminate hardware defects before handover.",
    "tag": "🔥 24H TORTURE TEST",
    "iconName": "Flame",
    "gridSpan": 5,
    "statusBadge": "Certified Stable (0.02% Failure Rate)",
    "order": 3,
    "isActive": true
  },
  {
    "id": "feat_ai_specialist",
    "title": "Enterprise AI Hardware Specialist & Live Technical Support",
    "subtitle": "AI Engineering",
    "description": "Calculate PCIe lane distribution, check cooler clearances, or verify DDR5 ECC memory timings instantly with our datasheet-trained assistant and senior hardware engineering staff.",
    "tag": "🤖 24/7 AI SPECIALIST",
    "iconName": "Bot",
    "gridSpan": 7,
    "statusBadge": "Sub-second Datasheet Lookup • AI Engine Online",
    "order": 4,
    "isActive": true
  }
];

export const FALLBACK_BUILDER_PRESETS: BuilderPreset[] = [
  {
    "id": "preset_ai_extreme",
    "name": "AI & Deep Learning Station",
    "socket": "LGA1700 (Z790)",
    "cpu": "Intel Core i9-14900K (24C/32T)",
    "gpu": "NVIDIA RTX 4090 24GB GDDR6X",
    "ram": "64GB DDR5 6000MHz CL30",
    "psuWatts": 1200,
    "estTotalWatts": 740,
    "headroomPercent": 38,
    "order": 1,
    "isActive": true
  },
  {
    "id": "preset_render_studio",
    "name": "3D CAD & Unreal Engine Rig",
    "socket": "AM5 (X670E)",
    "cpu": "AMD Ryzen 9 7950X (16C/32T)",
    "gpu": "NVIDIA RTX 4080 Super 16GB",
    "ram": "32GB DDR5 6000MHz Low-Latency",
    "psuWatts": 1000,
    "estTotalWatts": 580,
    "headroomPercent": 42,
    "order": 2,
    "isActive": true
  },
  {
    "id": "preset_enterprise_node",
    "name": "Virtualization & High-TDP Node",
    "socket": "LGA4677 Xeon",
    "cpu": "Intel Xeon Platinum 8480+ (56C)",
    "gpu": "NVIDIA RTX A6000 48GB ECC",
    "ram": "128GB DDR5 ECC Registered",
    "psuWatts": 1600,
    "estTotalWatts": 980,
    "headroomPercent": 39,
    "order": 3,
    "isActive": true
  }
];

export const FALLBACK_COUPON: Coupon = {
  "id": "coupon_tech10",
  "code": "TECH10",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "minOrderAmount": 1000,
  "maxDiscountAmount": 500,
  "usageLimit": 1000,
  "usageCount": 42,
  "perUserLimit": 2,
  "startDate": "2026-01-01T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "isActive": true
};

export const FALLBACK_STORE_SETTINGS: StoreSettings = {
  "storeName": "NexTech Systems",
  "supportEmail": "support@nextechsystems.ae",
  "supportPhone": "+971 4 800 6398",
  "defaultCurrency": "AED",
  "currencySymbol": "AED",
  "taxRate": 5,
  "standardShippingFee": 25,
  "freeShippingThreshold": 500,
  "address": "NexTech Systems Tower, Silicon Oasis Tech Park, Dubai, UAE",
  "taxRegistrationNumber": "TRN-100294819200003",
  "announcementText": "GCC EXPRESS DISPATCH: Free Insured Shipping on Workstations, CPUs & Servers over AED 500",
  "isAnnouncementActive": true,
  "isLandingDiscountBannerActive": false,
  "featuredLandingCouponCode": "SUMMER50"
};

export const FALLBACK_HOMEPAGE_CONTENT: HomePageContent = {
  heroHighlights: FALLBACK_HERO_HIGHLIGHTS,
  solutions: FALLBACK_ENTERPRISE_SOLUTIONS,
  benchmarks: FALLBACK_BENCHMARKS,
  testimonials: FALLBACK_TESTIMONIALS,
  features: FALLBACK_BENTO_FEATURES,
  builderPresets: FALLBACK_BUILDER_PRESETS,
  activeCoupon: FALLBACK_COUPON,
  storeSettings: FALLBACK_STORE_SETTINGS,
  stats: {
    totalProducts: 19,
    totalCategories: DEFAULT_CATEGORIES.length,
    totalBrands: DEFAULT_BRANDS.length,
    authorizedPartnersCount: 3,
  },
};
