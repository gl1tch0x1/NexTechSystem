/**
 * Enterprise Computer & Hardware Specification Presets
 * Synchronized with backend/src/constants/specifications.ts
 */

export const SPECIFICATION_FIELDS = [
  'Brand',
  'Model',
  'Part Number',
  'Condition',
  'Product Category',
  'Processor Brand',
  'Processor Model',
  'Processor Generation',
  'Socket Type',
  'RAM Capacity',
  'RAM Type',
  'Storage Capacity',
  'Storage Type',
  'Graphics Card',
  'Graphics Memory',
  'Form Factor',
  'Power Supply Wattage',
  'Screen Size',
  'Resolution',
  'Keyboard Language',
  'Operating System',
  'Warranty',
  'Country of Origin',
  'Notes',
] as const;

export type SpecificationField = typeof SPECIFICATION_FIELDS[number];

export const SPECIFICATION_PRESETS: Record<string, string[]> = {
  Brand: [
    'ASUS',
    'Acer',
    'AMD',
    'Apple',
    'Corsair',
    'Dell',
    'EVGA',
    'Gigabyte',
    'HP Enterprise',
    'Intel',
    'Kingston',
    'Lenovo',
    'Microsoft',
    'MSI',
    'NVIDIA',
    'Samsung',
    'Seagate',
    'Western Digital',
  ],
  Condition: [
    'Brand New (Factory Sealed)',
    'Open Box',
    'Refurbished',
    'Enterprise Recertified',
    'Used (Tested & Cleaned)',
  ],
  'Product Category': [
    'Processors (CPUs)',
    'Graphics Cards (GPUs)',
    'Enterprise Rackmount Servers',
    'Motherboards',
    'Memory (RAM)',
    'Storage (NVMe/SSD/HDD)',
    'Power Supplies (PSUs)',
    'Laptops & Workstations',
    'All-in-One Desktops',
    'Enterprise Networking',
    'Monitors & Displays',
  ],
  'Processor Brand': ['Intel', 'AMD', 'Apple Silicon', 'Qualcomm Snapdragon'],
  'Processor Generation': [
    '12th Gen Alder Lake',
    '13th Gen Raptor Lake',
    '14th Gen Raptor Lake Refresh',
    'Core Ultra Series 1 (Meteor Lake)',
    'Core Ultra Series 2 (Arrow Lake)',
    'AMD Ryzen 7000 Series',
    'AMD Ryzen 8000 Series',
    'AMD Ryzen 9000 Series',
    'AMD EPYC 9004/9005 Series',
    'Intel Xeon Scalable (Emerald Rapids)',
  ],
  'Socket Type': [
    'LGA1700',
    'LGA1851',
    'AM4',
    'AM5',
    'LGA4677',
    'SP5',
  ],
  'RAM Capacity': ['8GB', '16GB', '24GB', '32GB', '48GB', '64GB', '96GB', '128GB', '256GB'],
  'RAM Type': [
    'DDR4 3200MHz',
    'DDR4 3600MHz',
    'DDR5 5600MHz',
    'DDR5 6000MHz',
    'DDR5 6400MHz',
    'LPDDR5X',
    'DDR5 ECC Registered',
  ],
  'Storage Capacity': [
    '256GB',
    '512GB',
    '1TB',
    '2TB',
    '4TB',
    '8TB',
    '15.36TB (Enterprise)',
  ],
  'Storage Type': [
    'NVMe PCIe 4.0 SSD',
    'NVMe PCIe 5.0 SSD',
    'SATA III 2.5" SSD',
    'Enterprise SAS 12G HDD',
    'Enterprise U.2 / U.3 NVMe',
  ],
  'Graphics Memory': [
    'Integrated',
    '6GB GDDR6',
    '8GB GDDR6',
    '12GB GDDR6X',
    '16GB GDDR6X',
    '24GB GDDR6X',
    '48GB GDDR6 (Enterprise)',
  ],
  'Form Factor': [
    'ATX',
    'Micro-ATX',
    'Mini-ITX',
    'E-ATX',
    '1U Rackmount',
    '2U Rackmount',
    '4U Rackmount',
  ],
  'Keyboard Language': [
    'English (US)',
    'English / Arabic (Bilingual GCC)',
    'English / Russian',
    'English / French',
  ],
  'Operating System': [
    'No OS / FreeDOS',
    'Windows 11 Home',
    'Windows 11 Pro',
    'Windows Server 2022',
    'Red Hat Enterprise Linux',
    'Ubuntu Server LTS',
  ],
  Warranty: [
    '3 Years Official Manufacturer Warranty',
    '2 Years Regional GCC Warranty',
    '1 Year Official Warranty',
    '3 Months Reseller Replacement Warranty',
    'Lifetime Limited Warranty (RAM/SSD)',
  ],
  'Country of Origin': [
    'Taiwan',
    'United States',
    'Japan',
    'South Korea',
    'Germany',
    'China',
    'Malaysia',
    'Vietnam',
  ],
};

export interface SpecGroupDefinition {
  id: string;
  name: string;
  description: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    presetKey?: string;
    type: 'select' | 'text' | 'number';
  }[];
}

export const SPECIFICATION_GROUPS: SpecGroupDefinition[] = [
  {
    id: 'core',
    name: 'Platform & Architecture',
    description: 'Hardware generation, condition, processor socket, and categorization',
    fields: [
      { key: 'Condition', label: 'Condition', placeholder: 'Select hardware condition', presetKey: 'Condition', type: 'select' },
      { key: 'Product Category', label: 'Hardware Category', placeholder: 'Select product taxonomy', presetKey: 'Product Category', type: 'select' },
      { key: 'Processor Brand', label: 'Processor Brand', placeholder: 'Intel / AMD / etc.', presetKey: 'Processor Brand', type: 'select' },
      { key: 'Processor Generation', label: 'Processor Architecture', placeholder: 'e.g. 14th Gen Raptor Lake', presetKey: 'Processor Generation', type: 'select' },
      { key: 'Processor Model', label: 'Processor Model', placeholder: 'e.g. Core i9-14900K, Ryzen 9 7950X', type: 'text' },
      { key: 'Socket Type', label: 'Socket Architecture', placeholder: 'e.g. LGA1700, AM5', presetKey: 'Socket Type', type: 'select' },
    ],
  },
  {
    id: 'memory_storage',
    name: 'Memory & High-Speed Storage',
    description: 'RAM frequency, channel capacity, SSD bus protocols, and HDD capacity',
    fields: [
      { key: 'RAM Capacity', label: 'RAM Capacity', placeholder: 'e.g. 32GB, 64GB', presetKey: 'RAM Capacity', type: 'select' },
      { key: 'RAM Type', label: 'RAM Specification', placeholder: 'e.g. DDR5 6000MHz', presetKey: 'RAM Type', type: 'select' },
      { key: 'Storage Capacity', label: 'Storage Capacity', placeholder: 'e.g. 1TB, 2TB', presetKey: 'Storage Capacity', type: 'select' },
      { key: 'Storage Type', label: 'Storage Interface', placeholder: 'e.g. NVMe PCIe 5.0 SSD', presetKey: 'Storage Type', type: 'select' },
    ],
  },
  {
    id: 'graphics_power',
    name: 'Graphics, Chassis & Power Delivery',
    description: 'Discrete GPU chipset, VRAM buffer, power consumption, and chassis footprint',
    fields: [
      { key: 'Graphics Card', label: 'Graphics Accelerator', placeholder: 'e.g. NVIDIA RTX 4090 24GB', type: 'text' },
      { key: 'Graphics Memory', label: 'VRAM Pool', placeholder: 'e.g. 24GB GDDR6X', presetKey: 'Graphics Memory', type: 'select' },
      { key: 'Form Factor', label: 'Chassis / Board Form Factor', placeholder: 'e.g. ATX, 2U Rackmount', presetKey: 'Form Factor', type: 'select' },
      { key: 'Power Supply Wattage', label: 'PSU / TDP Rating', placeholder: 'e.g. 125W, 850W Titanium', type: 'text' },
    ],
  },
  {
    id: 'display_system',
    name: 'Display, OS & Regional Compliance',
    description: 'Display metrics, factory operating system, warranty terms, and origin',
    fields: [
      { key: 'Screen Size', label: 'Display Diagonal', placeholder: 'e.g. 27", 34" Ultrawide', type: 'text' },
      { key: 'Resolution', label: 'Native Resolution', placeholder: 'e.g. 3840x2160 4K UHD', type: 'text' },
      { key: 'Operating System', label: 'Factory OS', placeholder: 'e.g. Windows 11 Pro, Ubuntu', presetKey: 'Operating System', type: 'select' },
      { key: 'Keyboard Language', label: 'Keyboard Layout', placeholder: 'e.g. English / Arabic (GCC)', presetKey: 'Keyboard Language', type: 'select' },
      { key: 'Warranty', label: 'Warranty Coverage', placeholder: 'Select official warranty tier', presetKey: 'Warranty', type: 'select' },
      { key: 'Country of Origin', label: 'Country of Origin', placeholder: 'Select manufacturing origin', presetKey: 'Country of Origin', type: 'select' },
      { key: 'Part Number', label: 'Manufacturer Part No. (MPN)', placeholder: 'e.g. BX8071514900K', type: 'text' },
      { key: 'Model', label: 'Hardware Model Number', placeholder: 'e.g. ROG-STRIX-Z790-E', type: 'text' },
    ],
  },
];
