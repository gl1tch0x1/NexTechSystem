import { SupplierCompanyDetails, BuyerCompanyDetails } from '@/types';

export interface VerifiedSupplier {
  id: string;
  brand: string;
  displayName: string;
  vendorCode: string;
  tier: string;
  category: string;
  details: SupplierCompanyDetails;
  supportedSkus: {
    sku: string;
    name: string;
    category: string;
    standardCost: number;
    leadTimeDays: number;
  }[];
}

export const NEXTECH_BUYER_DETAILS: BuyerCompanyDetails = {
  legalName: 'NexTech Systems Commercial Enterprise FZ-LLC',
  taxRegistrationNumber: '100984710200003',
  corporateAddress: 'Dubai Silicon Oasis, Tech Park Tower A, Suite 902, PO Box 341041, Dubai, United Arab Emirates',
  contactPerson: 'NexTech Executive Procurement Desk',
  contactEmail: 'procurement@nextechsystems.com',
  contactPhone: '+971 4 399 1000',
  billingCurrency: 'AED',
};

export const VERIFIED_SUPPLIERS: VerifiedSupplier[] = [
  {
    id: 'supp_asus',
    brand: 'ASUS',
    displayName: 'ASUS MENA Distribution Hub (JAFZA)',
    vendorCode: 'VND-ASUS-9901',
    tier: 'Tier-1 Direct OEM Partner',
    category: 'Graphics Processing Units & Mainboards',
    details: {
      legalName: 'ASUSTeK Computer Middle East FZCO',
      tradeLicenseNumber: 'JAFZA-TL-10492',
      taxRegistrationNumber: '100293847100003',
      country: 'United Arab Emirates',
      city: 'Dubai',
      addressLine: 'JAFZA South Zone 4, Warehouse 12B, PO Box 261888, Jebel Ali Free Zone, Dubai, UAE',
      contactPerson: 'Karim Al-Husseini (Director of Channel Distribution)',
      contactEmail: 'procurement.mena@asus.com',
      contactPhone: '+971 4 881 7400',
      paymentTerms: 'Net 30 Days Commercial Wire',
      incoterms: 'DDP - JAFZA Mega-Hub',
      vendorCode: 'VND-ASUS-9901',
    },
    supportedSkus: [
      {
        sku: 'ROG-STRIX-RTX4090-O24G-GAMING',
        name: 'ASUS ROG Strix GeForce RTX 4090 24GB GDDR6X OC Edition',
        category: 'Graphics Processing Units',
        standardCost: 7450,
        leadTimeDays: 1,
      },
      {
        sku: 'TUF-RTX4080S-O16G-GAMING',
        name: 'ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB OC',
        category: 'Graphics Processing Units',
        standardCost: 4650,
        leadTimeDays: 2,
      },
      {
        sku: 'ROG-MAXIMUS-Z790-HERO',
        name: 'ASUS ROG Maximus Z790 Hero Dark LGA1700 Motherboard',
        category: 'Motherboards & Platforms',
        standardCost: 2450,
        leadTimeDays: 2,
      }
    ],
  },
  {
    id: 'supp_intel',
    brand: 'Intel',
    displayName: 'Intel Technology GCC (Dubai Media City)',
    vendorCode: 'VND-INTEL-1049',
    tier: 'Intel Titanium Tier-1 Distributor',
    category: 'Processors & Enterprise Server Compute',
    details: {
      legalName: 'Intel Corporation (UK) Ltd - Middle East Branch',
      tradeLicenseNumber: 'DMC-55910',
      taxRegistrationNumber: '100492817200003',
      country: 'United Arab Emirates',
      city: 'Dubai',
      addressLine: 'Dubai Media City, Building 2, 4th Floor, Suite 402, PO Box 500044, Dubai, UAE',
      contactPerson: 'Marcus Vance (Enterprise Allocation Lead)',
      contactEmail: 'gcc.enterprise.orders@intel.com',
      contactPhone: '+971 4 391 8000',
      paymentTerms: 'Net 45 Days Corporate Escrow',
      incoterms: 'DDP - Silicon Oasis Express',
      vendorCode: 'VND-INTEL-1049',
    },
    supportedSkus: [
      {
        sku: 'INTEL-CORE-I9-14900KS',
        name: 'Intel Core i9-14900KS Special Edition 24-Core Desktop Processor',
        category: 'Processors',
        standardCost: 2740,
        leadTimeDays: 3,
      },
      {
        sku: 'INTEL-CORE-I7-14700K',
        name: 'Intel Core i7-14700K 20-Core 5.6GHz Desktop Processor',
        category: 'Processors',
        standardCost: 1680,
        leadTimeDays: 2,
      },
      {
        sku: 'INTEL-XEON-PLATINUM-8480',
        name: 'Intel Xeon Platinum 8480+ 56-Core Enterprise Workstation CPU',
        category: 'Server Hardware',
        standardCost: 28500,
        leadTimeDays: 7,
      }
    ],
  },
  {
    id: 'supp_nvidia',
    brand: 'NVIDIA',
    displayName: 'NVIDIA Direct MENA (Internet City)',
    vendorCode: 'VND-NVDA-4090',
    tier: 'NVIDIA Elite Partner Network',
    category: 'AI Acceleration & Workstation GPUs',
    details: {
      legalName: 'NVIDIA Direct Distribution FZ-LLC',
      tradeLicenseNumber: 'DIC-COMM-89104',
      taxRegistrationNumber: '100829104800003',
      country: 'United Arab Emirates',
      city: 'Dubai',
      addressLine: 'Dubai Internet City, Building 14, Executive Wing, PO Box 73000, Dubai, UAE',
      contactPerson: 'Elena Rostova (AI & Enterprise Channel Manager)',
      contactEmail: 'middleeast.procurement@nvidia.com',
      contactPhone: '+971 4 454 9900',
      paymentTerms: 'Letter of Credit (LC) / Advance Wire',
      incoterms: 'CIF Dubai Logistics Port',
      vendorCode: 'VND-NVDA-4090',
    },
    supportedSkus: [
      {
        sku: 'NVIDIA-RTX-6000-ADA-48GB',
        name: 'NVIDIA RTX 6000 Ada Generation 48GB GDDR6 Workstation GPU',
        category: 'AI Acceleration',
        standardCost: 28000,
        leadTimeDays: 5,
      },
      {
        sku: 'NVIDIA-A100-80GB-PCIE',
        name: 'NVIDIA A100 80GB PCIe Tensor Core Enterprise Accelerator',
        category: 'Server Hardware',
        standardCost: 45000,
        leadTimeDays: 10,
      }
    ],
  },
  {
    id: 'supp_corsair',
    brand: 'Corsair',
    displayName: 'Corsair Enterprise ME (KIZAD Hub)',
    vendorCode: 'VND-CORSAIR-8820',
    tier: 'Authorized Regional Distributor',
    category: 'Memory, Power Supplies & Cooling',
    details: {
      legalName: 'Corsair Components MENA FZE',
      tradeLicenseNumber: 'KIZAD-IC-33104',
      taxRegistrationNumber: '100572910400003',
      country: 'United Arab Emirates',
      city: 'Abu Dhabi',
      addressLine: 'KIZAD Logistics Park, Warehouse Block C-09, Khalifa Port, Abu Dhabi, UAE',
      contactPerson: 'Zaid Mansoor (Supply Chain Operations Lead)',
      contactEmail: 'enterprise.supply@corsair.com',
      contactPhone: '+971 2 690 1200',
      paymentTerms: 'PDC 30 Days (Post-Dated Cheque)',
      incoterms: 'DDP - KIZAD Hub',
      vendorCode: 'VND-CORSAIR-8820',
    },
    supportedSkus: [
      {
        sku: 'CORSAIR-DOMINATOR-TITANIUM-64GB',
        name: 'Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5 6000MHz C30',
        category: 'Memory & RAM',
        standardCost: 1170,
        leadTimeDays: 1,
      },
      {
        sku: 'CORSAIR-AX1600I-TITANIUM',
        name: 'Corsair AX1600i 1600W 80 PLUS Titanium Fully Modular PSU',
        category: 'Power Supplies',
        standardCost: 1950,
        leadTimeDays: 2,
      }
    ],
  },
  {
    id: 'supp_kingston',
    brand: 'Kingston',
    displayName: 'Kingston Technology ME (DAFZA)',
    vendorCode: 'VND-KINGSTON-4040',
    tier: 'Certified Direct Supplier',
    category: 'Enterprise NVMe & Industrial Memory',
    details: {
      legalName: 'Kingston Technology Europe Co LLP - Middle East',
      tradeLicenseNumber: 'DAFZA-L-20491',
      taxRegistrationNumber: '100381940200003',
      country: 'United Arab Emirates',
      city: 'Dubai',
      addressLine: 'Dubai Airport Freezone (DAFZA), Building 6WB, Suite 330, PO Box 54555, Dubai, UAE',
      contactPerson: 'Rashid Al-Khouri (Commercial Accounts Director)',
      contactEmail: 'middleeast_orders@kingston.com',
      contactPhone: '+971 4 299 5550',
      paymentTerms: 'Net 30 Days Commercial Credit',
      incoterms: 'DDP - JAFZA Mega-Hub',
      vendorCode: 'VND-KINGSTON-4040',
    },
    supportedSkus: [
      {
        sku: 'KINGSTON-FURY-RENEGADE-4TB',
        name: 'Kingston FURY Renegade 4TB PCIe Gen4 NVMe M.2 2280 Internal SSD',
        category: 'Storage & SSDs',
        standardCost: 1273,
        leadTimeDays: 1,
      },
      {
        sku: 'KINGSTON-SERVER-PREMIER-64GB',
        name: 'Kingston Server Premier 64GB DDR5 4800MHz ECC Registered DIMM',
        category: 'Memory & RAM',
        standardCost: 1050,
        leadTimeDays: 3,
      }
    ],
  },
  {
    id: 'supp_samsung',
    brand: 'Samsung',
    displayName: 'Samsung Electronics MENA (JAFZA)',
    vendorCode: 'VND-SAMSUNG-9900',
    tier: 'Samsung Semiconductor Direct Distributor',
    category: 'Enterprise V-NAND & Storage Infrastructure',
    details: {
      legalName: 'Samsung Gulf Electronics Co. FZE',
      tradeLicenseNumber: 'JAFZA-TL-00219',
      taxRegistrationNumber: '100192847100003',
      country: 'United Arab Emirates',
      city: 'Dubai',
      addressLine: 'Jebel Ali Free Zone Authority (JAFZA), LOB 15, Suite 401, PO Box 61222, Dubai, UAE',
      contactPerson: 'Min-Soo Park (Enterprise Storage Division Lead)',
      contactEmail: 'b2b.memory.me@samsung.com',
      contactPhone: '+971 4 883 0000',
      paymentTerms: 'Net 60 Days Structured Corporate Line',
      incoterms: 'DDP - Dubai Silicon Oasis',
      vendorCode: 'VND-SAMSUNG-9900',
    },
    supportedSkus: [
      {
        sku: 'SSD-SAM-990PRO-4TB',
        name: 'Samsung 990 PRO 4TB PCIe Gen4 NVMe M.2 2280 Internal SSD',
        category: 'Storage & SSDs',
        standardCost: 1100,
        leadTimeDays: 2,
      },
      {
        sku: 'SSD-SAM-PM1733-15TB',
        name: 'Samsung PM1733 15.36TB Enterprise PCIe Gen4 NVMe U.2 SSD',
        category: 'Server Hardware',
        standardCost: 9200,
        leadTimeDays: 7,
      }
    ],
  }
];

export const WAREHOUSE_HUBS = [
  {
    id: 'hub_dxb01',
    code: 'DXB-01 (JAFZA Mega-Hub)',
    name: 'JAFZA Bonded Mega-Hub',
    facilityType: 'Primary Bonded Freezone Logistics Center',
    address: 'Bay 3, Gate 7, Jebel Ali Free Zone South, Dubai, UAE',
    receivingLead: 'Tariq Al-Sabah (Logistics Dock Master)',
    phone: '+971 4 889 1234',
    dockingBays: 'Bays 12-16 (Heavy Cargo & Container Access)',
  },
  {
    id: 'hub_dxb02',
    code: 'DXB-02 (Silicon Oasis Express)',
    name: 'Dubai Silicon Oasis Express Center',
    facilityType: 'Rapid B2B Assembly & Component Staging Facility',
    address: 'Warehouse 4, Light Industrial Zone 2, Dubai Silicon Oasis, Dubai, UAE',
    receivingLead: 'Omar Siddiqui (Technical Assembly Lead)',
    phone: '+971 4 501 5678',
    dockingBays: 'Bays 2-4 (Climate Controlled Anti-Static)',
  },
  {
    id: 'hub_auh01',
    code: 'AUH-01 (KIZAD Enterprise Center)',
    name: 'Abu Dhabi KIZAD Center',
    facilityType: 'Government & Heavy Compute Cluster Storage',
    address: 'Sector B, Area 5, Khalifa Industrial Zone Abu Dhabi (KIZAD), Abu Dhabi, UAE',
    receivingLead: 'Sultan Al-Mansouri (Defense & Enterprise Logistics)',
    phone: '+971 2 690 9876',
    dockingBays: 'Bays 8-10 (High-Security Perimeter)',
  }
];
