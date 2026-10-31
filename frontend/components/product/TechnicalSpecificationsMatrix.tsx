'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Cpu,
  HardDrive,
  Monitor,
  Sparkles,
  Laptop,
  ShieldCheck,
  Search,
  Copy,
  Check,
  X,
  Sliders,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface TechnicalSpecificationsMatrixProps {
  specifications: Record<string, unknown>;
  productName: string;
  brandName?: string;
  categoryName?: string;
  sku?: string;
  features?: string[];
}

interface SpecItem {
  rawKey: string;
  label: string;
  value: string;
  category: string;
  priority: number;
}

interface CategoryConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'processor',
    title: 'Processor & Platform',
    subtitle: 'Compute cores, architecture & socket interface',
    icon: Cpu,
  },
  {
    id: 'memory_storage',
    title: 'Memory & Storage',
    subtitle: 'System memory bus, channel configuration & NVMe SSD',
    icon: HardDrive,
  },
  {
    id: 'display',
    title: 'Display & Visuals',
    subtitle: 'Panel diagonal, native resolution, refresh rate & touch',
    icon: Monitor,
  },
  {
    id: 'graphics',
    title: 'Graphics & GPU',
    subtitle: 'Integrated / dedicated GPU engine & video memory',
    icon: Sparkles,
  },
  {
    id: 'input_design',
    title: 'Design, Input & Mobility',
    subtitle: 'Chassis form factor, keyboard layout, biometric security & battery',
    icon: Laptop,
  },
  {
    id: 'system_warranty',
    title: 'System, OS & Warranty',
    subtitle: 'Model MPN, factory operating system, condition & warranty',
    icon: ShieldCheck,
  },
  {
    id: 'additional',
    title: 'Additional Specifications',
    subtitle: 'Supplementary hardware parameters & environmental compliance',
    icon: Sliders,
  },
];

// Priority rankings inside categories for logical executive ordering
const SPEC_ORDER_RANKING: Record<string, number> = {
  // Processor
  'processor brand': 10,
  'processorbrand': 10,
  'processor model': 20,
  'processormodel': 20,
  'processor': 20,
  'cpu': 20,
  'processor cores': 30,
  'processorcores': 30,
  'cores': 30,
  'execution threads': 40,
  'processorthreads': 40,
  'threads': 40,
  'base clock frequency': 50,
  'base clock': 50,
  'baseclock': 50,
  'max turbo frequency': 60,
  'max boost clock': 60,
  'boostclock': 60,
  'smart cache capacity': 70,
  'cache': 70,
  'socket type': 80,
  'socket form factor': 80,
  'socket': 80,
  'package / socket type': 80,
  'package': 80,
  'tdp': 90,
  'thermal design power (tdp)': 90,
  'wattage': 90,
  'chipset': 100,
  'motherboard chipset': 100,

  // Memory & Storage
  'ram capacity': 110,
  'ramcapacity': 110,
  'memory capacity': 110,
  'installed ram': 110,
  'memory': 110,
  'ram type': 120,
  'ramtype': 120,
  'memory type': 120,
  'ram speed / frequency': 130,
  'ram speed': 130,
  'ramspeed': 130,
  'storage capacity': 140,
  'storagecapacity': 140,
  'installed hard drive': 140,
  'storage': 140,
  'storage type': 150,
  'storagetype': 150,
  'storage interface': 160,
  'storageinterface': 160,
  'interface protocol': 160,

  // Display
  'screen size': 210,
  'screensize': 210,
  'display size': 210,
  'display resolution': 220,
  'resolution': 220,
  'display technology': 230,
  'displaytechnology': 230,
  'panel type': 230,
  'refresh rate': 240,
  'refreshrate': 240,
  'aspect ratio': 250,
  'aspectratio': 250,
  'touchscreen support': 260,
  'touchscreen': 260,
  'screen brightness': 270,
  'brightness': 270,

  // Graphics
  'graphics card (gpu)': 310,
  'graphicscard': 310,
  'gpu model': 310,
  'gpu': 310,
  'graphics card': 310,
  'graphics memory': 320,
  'graphicsmemory': 320,
  'dedicated vram': 320,
  'vram': 320,
  'gpu architecture': 330,
  'gputype': 330,

  // Design, Input & Mobility
  'computer form factor': 410,
  'form factor': 410,
  'formfactor': 410,
  'color': 420,
  'chassis': 420,
  'keyboard type': 430,
  'keyboardtype': 430,
  'backlit keyboard': 440,
  'backlit': 440,
  'keyboard language': 450,
  'keyboardlanguage': 450,
  'fingerprint reader': 460,
  'fingerprint': 460,
  'touchpad': 470,
  'webcam': 480,
  'camera': 480,
  'battery specification': 490,
  'battery': 490,
  'product weight': 500,
  'weight': 500,
  'physical dimensions': 510,
  'dimensions': 510,
  'included bag / case': 520,
  'included bag': 520,

  // System & Identifiers
  'model': 610,
  'model name': 610,
  'part number': 620,
  'partnumber': 620,
  'mpn': 620,
  'sku': 625,
  'product category': 630,
  'productcategory': 630,
  'category': 630,
  'computer intended use': 640,
  'intended use': 640,
  'operating system': 650,
  'operatingsystem': 650,
  'os': 650,
  'item condition': 660,
  'condition': 660,
  'warranty coverage': 670,
  'warranty': 670,
};

// Formatter to standardize parameter labels
function formatSpecLabel(key: string): string {
  const normalized = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const dictionary: Record<string, string> = {
    condition: 'Item Condition',
    itemcondition: 'Item Condition',
    productcategory: 'Product Category',
    category: 'Product Category',
    processorbrand: 'Processor Brand',
    processormodel: 'Processor Model',
    processorcores: 'Processor Cores',
    processorthreads: 'Execution Threads',
    cores: 'Processor Cores',
    threads: 'Execution Threads',
    socket: 'Socket Form Factor',
    sockettype: 'Socket Form Factor',
    package: 'Package / Socket Type',
    ramcapacity: 'RAM Capacity',
    ramtype: 'RAM Type',
    ramspeed: 'RAM Speed / Frequency',
    memory: 'Installed RAM',
    memorycapacity: 'Memory Capacity',
    memorytype: 'Memory Type',
    storagecapacity: 'Storage Capacity',
    storagetype: 'Storage Type',
    storageinterface: 'Storage Interface',
    screensize: 'Screen Size',
    displaytechnology: 'Display Technology',
    resolution: 'Display Resolution',
    displayresolution: 'Display Resolution',
    refreshrate: 'Refresh Rate',
    aspectratio: 'Aspect Ratio',
    brightness: 'Screen Brightness',
    touchscreen: 'Touchscreen Support',
    touchscreensupport: 'Touchscreen Support',
    operatingsystem: 'Operating System',
    os: 'Operating System',
    graphicscard: 'Graphics Card (GPU)',
    graphicscardgpu: 'Graphics Card (GPU)',
    gpu: 'GPU Model',
    gpumodel: 'GPU Model',
    gputype: 'GPU Architecture',
    dedicatedvram: 'Dedicated VRAM',
    graphicsmemory: 'Graphics Memory',
    powersupply: 'Power Supply Unit (PSU)',
    tdp: 'Thermal Design Power (TDP)',
    wattage: 'TDP / Power Consumption',
    computerformfactor: 'Computer Form Factor',
    formfactor: 'Form Factor',
    motherboardchipset: 'Motherboard Chipset',
    chipset: 'Chipset',
    maxboostclock: 'Max Turbo Frequency',
    boostclock: 'Max Boost Clock',
    baseclock: 'Base Clock Frequency',
    cache: 'Smart Cache Capacity',
    smartcachecapacity: 'Smart Cache Capacity',
    wireless: 'Wi-Fi & Bluetooth',
    network: 'Networking & Ethernet',
    ports: 'I/O Ports & Interfaces',
    battery: 'Battery Specification',
    batteryspecification: 'Battery Specification',
    weight: 'Product Weight',
    productweight: 'Product Weight',
    dimensions: 'Physical Dimensions',
    physicaldimensions: 'Physical Dimensions',
    warranty: 'Warranty Coverage',
    warrantycoverage: 'Warranty Coverage',
    partnumber: 'Part Number (MPN)',
    model: 'Model Name',
    computerintendeduse: 'Intended Use',
    keyboardtype: 'Keyboard Type',
    backlitkeyboard: 'Backlit Keyboard',
    keyboardlanguage: 'Keyboard Language',
    fingerprintreader: 'Fingerprint Reader',
    includedbagcase: 'Included Bag / Case',
    color: 'Chassis Color',
  };

  if (dictionary[normalized]) {
    return dictionary[normalized];
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b(ram|ssd|hdd|nvme|pcie|gpu|cpu|tdp|os|ips|led|oled|wuxga|fhd|uhd|rgb|psu|io|lan|usb|hdmi|vram|ddr|lpddr|sodimm|mpn|sku)\b/gi, m => m.toUpperCase())
    .replace(/\b\w/g, c => c.toUpperCase());
}

function assignCategory(key: string): string {
  const k = key.toLowerCase();
  if (
    k.includes('processor') || k.includes('cpu') || k.includes('socket') || k.includes('core') ||
    k.includes('thread') || k.includes('generation') || k.includes('clock') || k.includes('frequency') ||
    k.includes('tdp') || k.includes('wattage') || k.includes('package') || k.includes('chipset') ||
    k.includes('boost') || k.includes('cache')
  ) {
    return 'processor';
  }
  if (
    k.includes('ram') || k.includes('memory') || k.includes('ddr') || k.includes('lpddr') ||
    k.includes('storage') || k.includes('ssd') || k.includes('nvme') || k.includes('hdd') ||
    k.includes('hard drive') || k.includes('spindle') || k.includes('rpm') || k.includes('sodimm')
  ) {
    return 'memory_storage';
  }
  if (
    k.includes('screen') || k.includes('display') || k.includes('resolution') || k.includes('panel') ||
    k.includes('refresh') || k.includes('wuxga') || k.includes('fhd') || k.includes('uhd') ||
    k.includes('oled') || k.includes('ips') || k.includes('touchscreen') || k.includes('aspect') ||
    k.includes('brightness') || k.includes('anti-glare') || k.includes('color gamut')
  ) {
    return 'display';
  }
  if (
    k.includes('graphics') || k.includes('gpu') || k.includes('vram') || k.includes('video') ||
    k.includes('discrete') || k.includes('integrated') || k.includes('cuda') || k.includes('geforce') ||
    k.includes('radeon') || k.includes('intel arc') || k.includes('rtx') || k.includes('gtx')
  ) {
    return 'graphics';
  }
  if (
    k.includes('form factor') || k.includes('formfactor') || k.includes('chassis') || k.includes('color') ||
    k.includes('keyboard') || k.includes('backlit') || k.includes('fingerprint') || k.includes('touchpad') ||
    k.includes('battery') || k.includes('power source') || k.includes('dimensions') || k.includes('weight') ||
    k.includes('bag') || k.includes('case') || k.includes('camera') || k.includes('webcam') ||
    k.includes('audio') || k.includes('speaker') || k.includes('mic')
  ) {
    return 'input_design';
  }
  if (
    k.includes('os') || k.includes('operating') || k.includes('warranty') || k.includes('condition') ||
    k.includes('category') || k.includes('part number') || k.includes('model') || k.includes('sku') ||
    k.includes('mpn') || k.includes('intended use') || k.includes('origin') || k.includes('compliance')
  ) {
    return 'system_warranty';
  }
  return 'additional';
}

export function TechnicalSpecificationsMatrix({
  specifications,
  productName,
  brandName,
  categoryName,
  sku,
  features,
}: TechnicalSpecificationsMatrixProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Normalize, categorize, and prioritize all specifications
  const allItems = useMemo<SpecItem[]>(() => {
    if (!specifications || typeof specifications !== 'object') return [];

    return Object.entries(specifications)
      .filter(([_, val]) => val !== null && val !== undefined && val !== '')
      .map(([rawKey, val]) => {
        const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
        const category = assignCategory(rawKey);
        const normKey = rawKey.toLowerCase().trim();
        const priority = SPEC_ORDER_RANKING[normKey] ?? 999;

        return {
          rawKey,
          label: formatSpecLabel(rawKey),
          value: displayVal,
          category,
          priority,
        };
      })
      .sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
  }, [specifications]);

  // All grouped categories
  const allGroupedCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return CATEGORIES.map(cat => {
      let items = allItems.filter(item => item.category === cat.id);

      if (q) {
        items = items.filter(
          item =>
            item.label.toLowerCase().includes(q) ||
            item.value.toLowerCase().includes(q) ||
            item.rawKey.toLowerCase().includes(q)
        );
      }

      return {
        ...cat,
        items,
      };
    }).filter(group => group.items.length > 0);
  }, [allItems, searchQuery]);

  // Determine whether "Show More" disclosure should be active
  // By default, if not searching and not expanded, show top 3 primary categories (Processor, Memory, Display)
  const hasMoreCategories = allGroupedCategories.length > 3 || allItems.length > 12;
  const isSearchActive = searchQuery.trim().length > 0;

  const visibleCategories = useMemo(() => {
    // If user is searching or has clicked "Show More", show all matching categories
    if (isSearchActive || isExpanded || !hasMoreCategories) {
      return allGroupedCategories;
    }
    // Collapsed state: Show only the top 3 core hardware categories (clean, compact, professional)
    return allGroupedCategories.slice(0, 3);
  }, [allGroupedCategories, isSearchActive, isExpanded, hasMoreCategories]);

  // Copy Full Datasheet
  const handleCopyDatasheet = useCallback(() => {
    const rows = allItems.map(item => `| ${item.label} | ${item.value} |`).join('\n');
    const markdown = `# Technical Specifications: ${productName}\n${brandName ? `Brand: ${brandName} | ` : ''}${categoryName ? `Category: ${categoryName} | ` : ''}${sku ? `SKU: ${sku}` : ''}\n\n| Specification Parameter | Value |\n| --- | --- |\n${rows}\n\n*Verified by NexTech Systems Architecture Datasheet*`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(markdown).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }, [allItems, productName, brandName, categoryName, sku]);

  // Render stylized, high-legibility value
  const renderValue = (val: string, rawKey: string) => {
    const lowerVal = val.toLowerCase().trim();
    const lowerKey = rawKey.toLowerCase();

    // Condition
    if (lowerVal.includes('brand new') || lowerVal.includes('factory sealed')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          {val}
        </span>
      );
    }

    // Warranty
    if (lowerKey.includes('warranty') || lowerVal.includes('official warranty')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200/80 dark:border-blue-800/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          {val}
        </span>
      );
    }

    // Boolean Yes/True
    if (lowerVal === 'yes' || lowerVal === 'true' || lowerVal.startsWith('yes (')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>{val}</span>
        </span>
      );
    }

    // Boolean No/False
    if (lowerVal === 'no' || lowerVal === 'false') {
      return (
        <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">
          No
        </span>
      );
    }

    // Monospace codes: MPN, Part Number, Resolution, Socket
    if (
      lowerKey.includes('part number') ||
      lowerKey.includes('mpn') ||
      lowerKey.includes('resolution') ||
      lowerKey.includes('socket')
    ) {
      return (
        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
          {val}
        </span>
      );
    }

    // Standard high-legibility value
    return (
      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
        {val}
      </span>
    );
  };

  if (allItems.length === 0 && (!features || features.length === 0)) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
    >
      {/* 1. EXECUTIVE HEADER BAR */}
      <div className="p-6 sm:p-8 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Technical Specifications
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manufacturer specifications, hardware architecture, and system details
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Live Filter Input */}
            <div className="relative w-44 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter specs..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 pl-8 pr-7 py-1.5 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-tech-blue dark:focus:border-cyan-400 font-medium transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Copy Datasheet */}
            <button
              type="button"
              onClick={handleCopyDatasheet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              title="Copy markdown formatted datasheet"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. STRUCTURED SPECIFICATION TABLE SECTIONS */}
      {visibleCategories.length > 0 ? (
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
          {visibleCategories.map(group => {
            const GroupIcon = group.icon;

            return (
              <div
                key={group.id}
                className="grid grid-cols-1 lg:grid-cols-12 transition-colors"
              >
                {/* Category Sidebar Column (Desktop) / Header (Mobile) */}
                <div className="lg:col-span-4 p-5 sm:p-6 lg:p-7 bg-slate-50/40 dark:bg-slate-950/30 lg:border-r border-b lg:border-b-0 border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
                      <GroupIcon className="w-4 h-4 text-tech-blue dark:text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {group.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {group.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key-Value Specifications List (Desktop Right 2/3) */}
                <div className="lg:col-span-8 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {group.items.map(item => (
                    <div
                      key={item.rawKey}
                      className="grid grid-cols-1 sm:grid-cols-12 py-3.5 px-5 sm:px-6 lg:px-8 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors gap-1 sm:gap-4 items-center"
                    >
                      {/* Left: Parameter Name */}
                      <div className="sm:col-span-5 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                        {item.label}
                      </div>

                      {/* Right: Parameter Value */}
                      <div className="sm:col-span-7 break-words">
                        {renderValue(item.value, item.rawKey)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 space-y-3">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            No specifications found matching &ldquo;{searchQuery}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-tech-blue text-white hover:bg-tech-blue/90 dark:bg-cyan-500 dark:text-slate-950 transition-colors cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* 3. ARCHITECTURAL TECHNOLOGIES & CAPABILITIES (SHOWN WHEN EXPANDED OR NO MORE CATEGORIES) */}
      {features && features.length > 0 && (isExpanded || isSearchActive || !hasMoreCategories) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
          <div className="lg:col-span-4 p-5 sm:p-6 lg:p-7 bg-slate-50/40 dark:bg-slate-950/30 lg:border-r border-b lg:border-b-0 border-slate-100 dark:border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Technologies & Capabilities
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  Hardware acceleration, instruction sets &amp; integrated platform features
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 p-5 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60 dark:border-emerald-800/60">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPAND / COLLAPSE DISCLOSURE CONTROLLER */}
      {hasMoreCategories && !isSearchActive && (
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/50 border-t border-slate-200/80 dark:border-slate-850 flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              if (isExpanded && sectionRef.current) {
                sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
              setIsExpanded(!isExpanded);
            }}
            className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:text-tech-blue dark:hover:text-cyan-400 border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <span>
              {isExpanded
                ? 'Show Less Specifications'
                : 'View All Specifications'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-tech-blue dark:group-hover:text-cyan-400 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-tech-blue dark:group-hover:text-cyan-400 transition-transform" />
            )}
          </button>
        </div>
      )}
    </section>
  );
}
