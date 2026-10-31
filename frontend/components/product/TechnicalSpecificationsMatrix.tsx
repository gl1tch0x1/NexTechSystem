'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Cpu,
  HardDrive,
  Monitor,
  Sparkles,
  Laptop,
  ShieldCheck,
  Layers,
  Search,
  Copy,
  Check,
  X,
  Zap,
  Award,
  Sliders,
  Shield,
  Boxes,
  Keyboard,
  Fingerprint,
  Palette,
  Battery
} from 'lucide-react';
import { NextechLogo } from '@/components/ui/NextechLogo';

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
  icon: React.ComponentType<{ className?: string }>;
}

interface SpecGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  pillColor: string;
  items: SpecItem[];
}

function formatSpecKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b(ram|ssd|hdd|nvme|pcie|gpu|cpu|tdp|os|ips|led|oled|wuxga|fhd|uhd|rgb|psu|io|lan|usb|hdmi|vram|ddr|lpddr)\b/gi, m => m.toUpperCase())
    .replace(/\b\w/g, c => c.toUpperCase());
}

function resolveItemIcon(key: string): React.ComponentType<{ className?: string }> {
  const k = key.toLowerCase();
  if (k.includes('processor') || k.includes('cpu') || k.includes('socket') || k.includes('core') || k.includes('thread') || k.includes('generation')) return Cpu;
  if (k.includes('ram') || k.includes('memory') || k.includes('ddr')) return Boxes;
  if (k.includes('storage') || k.includes('ssd') || k.includes('nvme') || k.includes('hdd') || k.includes('hard drive') || k.includes('rpm') || k.includes('cache')) return HardDrive;
  if (k.includes('screen') || k.includes('display') || k.includes('resolution') || k.includes('panel') || k.includes('refresh') || k.includes('wuxga') || k.includes('oled') || k.includes('ips')) return Monitor;
  if (k.includes('gpu') || k.includes('graphic') || k.includes('video') || k.includes('vram')) return Sparkles;
  if (k.includes('keyboard') || k.includes('backlit')) return Keyboard;
  if (k.includes('fingerprint') || k.includes('biometric')) return Fingerprint;
  if (k.includes('battery') || k.includes('power source') || k.includes('watt') || k.includes('tdp')) return Battery;
  if (k.includes('color') || k.includes('chassis')) return Palette;
  if (k.includes('form factor') || k.includes('laptop') || k.includes('dimensions') || k.includes('weight')) return Laptop;
  if (k.includes('os') || k.includes('operating') || k.includes('software')) return Sliders;
  if (k.includes('condition') || k.includes('warranty') || k.includes('sealed')) return ShieldCheck;
  return Layers;
}

function categorizeKey(key: string): string {
  const k = key.toLowerCase();
  if (
    k.includes('processor') || k.includes('cpu') || k.includes('socket') || k.includes('core') ||
    k.includes('thread') || k.includes('generation') || k.includes('clock') || k.includes('frequency') ||
    k.includes('tdp') || k.includes('wattage') || k.includes('package') || k.includes('chipset') ||
    k.includes('boost') || k.includes('cache')
  ) {
    return 'cpu';
  }
  if (
    k.includes('ram') || k.includes('memory') || k.includes('ddr') || k.includes('lpddr') ||
    k.includes('storage') || k.includes('ssd') || k.includes('nvme') || k.includes('hdd') ||
    k.includes('hard drive') || k.includes('spindle') || k.includes('rpm') || k.includes('interface protocol')
  ) {
    return 'memory_storage';
  }
  if (
    k.includes('screen') || k.includes('display') || k.includes('resolution') || k.includes('panel') ||
    k.includes('refresh') || k.includes('wuxga') || k.includes('fhd') || k.includes('uhd') ||
    k.includes('oled') || k.includes('ips') || k.includes('touchscreen') || k.includes('aspect') ||
    k.includes('brightness') || k.includes('anti-glare') || k.includes('color gamut') || k.includes('stylus')
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
    k.includes('form factor') || k.includes('chassis') || k.includes('color') || k.includes('keyboard') ||
    k.includes('backlit') || k.includes('fingerprint') || k.includes('touchpad') || k.includes('battery') ||
    k.includes('power source') || k.includes('dimensions') || k.includes('weight') || k.includes('bag') ||
    k.includes('case') || k.includes('camera') || k.includes('webcam') || k.includes('audio') ||
    k.includes('speaker') || k.includes('mic')
  ) {
    return 'chassis';
  }
  if (
    k.includes('os') || k.includes('operating') || k.includes('warranty') || k.includes('condition') ||
    k.includes('category') || k.includes('part number') || k.includes('model') || k.includes('sku') ||
    k.includes('mpn') || k.includes('intended use') || k.includes('origin') || k.includes('disclosures') ||
    k.includes('compliance')
  ) {
    return 'system';
  }
  return 'additional';
}

const CATEGORY_METADATA: Record<string, {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  pillColor: string;
}> = {
  cpu: {
    title: 'Processor & Architecture',
    subtitle: 'Compute cores, socket type, generation & thermal envelope',
    icon: Cpu,
    accentColor: 'text-blue-600 dark:text-cyan-400',
    pillColor: 'bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-500/20',
  },
  memory_storage: {
    title: 'Memory & High-Speed Storage',
    subtitle: 'System RAM bus, channel capacity & NVMe PCIe bandwidth',
    icon: HardDrive,
    accentColor: 'text-purple-600 dark:text-purple-400',
    pillColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  display: {
    title: 'Display & Visuals',
    subtitle: 'Panel diagonal, native resolution & anti-glare coatings',
    icon: Monitor,
    accentColor: 'text-amber-600 dark:text-amber-400',
    pillColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  graphics: {
    title: 'Graphics & GPU Accelerator',
    subtitle: 'Dedicated or integrated graphics engines & VRAM pool',
    icon: Sparkles,
    accentColor: 'text-rose-600 dark:text-rose-400',
    pillColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  chassis: {
    title: 'Design, Input & Mobility',
    subtitle: 'Form factor, keyboard layout, biometric security & battery',
    icon: Laptop,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    pillColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  system: {
    title: 'System, OS & Warranty',
    subtitle: 'Factory operating system, manufacturer warranty & MPN identifiers',
    icon: ShieldCheck,
    accentColor: 'text-sky-600 dark:text-sky-400',
    pillColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  },
  additional: {
    title: 'Additional Specifications',
    subtitle: 'Supplementary hardware parameters & environmental compliance',
    icon: Layers,
    accentColor: 'text-slate-600 dark:text-slate-400',
    pillColor: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
};

export function TechnicalSpecificationsMatrix({
  specifications,
  productName,
  brandName,
  categoryName,
  sku,
  features,
}: TechnicalSpecificationsMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // Normalize specifications into structured list
  const allItems = useMemo<SpecItem[]>(() => {
    if (!specifications || typeof specifications !== 'object') return [];
    return Object.entries(specifications)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([rawKey, val]) => {
        const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
        const category = categorizeKey(rawKey);
        return {
          rawKey,
          label: formatSpecKey(rawKey),
          value: displayVal,
          category,
          icon: resolveItemIcon(rawKey),
        };
      });
  }, [specifications]);

  // Extract Top 6 "Key Specs at a Glance"
  const keyHighlights = useMemo(() => {
    const map = new Map<string, string>();
    allItems.forEach(item => {
      map.set(item.rawKey.toLowerCase(), item.value);
    });

    const findVal = (...keys: string[]): string | null => {
      for (const k of keys) {
        const found = map.get(k.toLowerCase());
        if (found) return found;
      }
      return null;
    };

    const cpuModel = findVal('Processor Model', 'processor', 'CPU', 'Processor Brand');
    const cpuCores = findVal('Processor Cores');
    const ramCap = findVal('RAM Capacity', 'RAM', 'Memory');
    const ramType = findVal('RAM Type');
    const ssdCap = findVal('Storage Capacity', 'Storage', 'Installed Hard Drive');
    const ssdType = findVal('Storage Type');
    const displaySize = findVal('Screen Size', 'Display');
    const displayRes = findVal('Display Resolution', 'Resolution');
    const displayTech = findVal('Display Technology');
    const gpuName = findVal('Graphics Card (GPU)', 'Graphics Card', 'GPU');
    const osName = findVal('Operating System', 'OS');
    const warranty = findVal('Warranty Coverage', 'Warranty');

    const highlights: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }> }[] = [];

    if (cpuModel) {
      highlights.push({
        label: 'Processor Engine',
        value: cpuModel,
        sub: cpuCores ? `${cpuCores}` : undefined,
        icon: Cpu,
      });
    }

    if (ramCap) {
      highlights.push({
        label: 'System Memory',
        value: `${ramCap}${ramType ? ` ${ramType}` : ''}`,
        sub: ramType ? 'High-Bandwidth Configuration' : undefined,
        icon: Boxes,
      });
    }

    if (ssdCap) {
      highlights.push({
        label: 'Primary Storage',
        value: `${ssdCap}${ssdType ? ` ${ssdType}` : ''}`,
        sub: 'Solid State Architecture',
        icon: HardDrive,
      });
    }

    if (displaySize || displayRes) {
      highlights.push({
        label: 'Visual Display',
        value: `${displaySize || ''}${displaySize && displayRes ? ' • ' : ''}${displayRes || ''}`,
        sub: displayTech || undefined,
        icon: Monitor,
      });
    }

    if (gpuName) {
      highlights.push({
        label: 'Graphics Processor',
        value: gpuName,
        sub: findVal('Graphics Memory') || undefined,
        icon: Sparkles,
      });
    }

    if (osName || warranty) {
      highlights.push({
        label: 'OS & Official Protection',
        value: osName || warranty || 'Verified System',
        sub: warranty ? `Warranty: ${warranty}` : undefined,
        icon: ShieldCheck,
      });
    }

    return highlights;
  }, [allItems]);

  // Filter items by search query and category
  const filteredItems = useMemo(() => {
    let result = allItems;
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        item =>
          item.label.toLowerCase().includes(q) ||
          item.value.toLowerCase().includes(q) ||
          item.rawKey.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allItems, selectedCategory, searchQuery]);

  // Group filtered items into Category blocks
  const groupedCategories = useMemo<SpecGroup[]>(() => {
    const categoryOrder = ['cpu', 'memory_storage', 'display', 'graphics', 'chassis', 'system', 'additional'];
    const groups: SpecGroup[] = [];

    categoryOrder.forEach(catId => {
      const itemsInCat = filteredItems.filter(item => item.category === catId);
      if (itemsInCat.length > 0) {
        const meta = CATEGORY_METADATA[catId] || CATEGORY_METADATA.additional;
        groups.push({
          id: catId,
          title: meta.title,
          subtitle: meta.subtitle,
          icon: meta.icon,
          accentColor: meta.accentColor,
          pillColor: meta.pillColor,
          items: itemsInCat,
        });
      }
    });

    return groups;
  }, [filteredItems]);

  // Category Counts for navigation pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length };
    allItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [allItems]);

  // Copy Full Datasheet to Clipboard
  const handleCopyDatasheet = useCallback(() => {
    const rows = allItems.map(item => `| ${item.label} | ${item.value} |`).join('\n');
    const markdown = `# Technical Specifications: ${productName}\n${brandName ? `Brand: ${brandName} | ` : ''}${categoryName ? `Category: ${categoryName} | ` : ''}${sku ? `SKU: ${sku}` : ''}\n\n| Specification Parameter | Value |\n| --- | --- |\n${rows}\n\n*Verified by NexTech Systems Official Architecture Datasheet*`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(markdown).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  }, [allItems, productName, brandName, categoryName, sku]);

  // Render stylized value (e.g. badges for Condition, Yes/No, OS, Warranty)
  const renderSpecValue = (val: string, key: string) => {
    const lowerVal = val.toLowerCase().trim();
    const lowerKey = key.toLowerCase();

    if (lowerVal === 'yes' || lowerVal === 'true') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Check className="w-3 h-3 stroke-[3]" />
          Yes
        </span>
      );
    }

    if (lowerVal === 'no' || lowerVal === 'false') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <X className="w-3 h-3" />
          No
        </span>
      );
    }

    if (lowerVal.includes('brand new') || lowerVal.includes('factory sealed')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {val}
        </span>
      );
    }

    if (lowerKey.includes('warranty') || lowerVal.includes('official') || lowerVal.includes('warranty')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-tech-blue/10 text-tech-blue dark:text-cyan-400 border border-tech-blue/20">
          <Shield className="w-3.5 h-3.5" />
          {val}
        </span>
      );
    }

    if (lowerKey.includes('part number') || lowerKey.includes('model') || lowerKey.includes('sku') || lowerKey.includes('resolution')) {
      return (
        <span className="inline-block font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 tracking-wide bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
          {val}
        </span>
      );
    }

    return (
      <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
        {val}
      </span>
    );
  };

  return (
    <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-8 transition-all">
      {/* 1. SECTION HEADER & METADATA BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-indigo-500/10 flex items-center justify-center p-2 shrink-0 shadow-sm border border-tech-blue/20 dark:border-cyan-500/20">
            <NextechLogo className="w-full h-full text-tech-blue dark:text-cyan-400" size={26} alt="Specifications Matrix" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Technical Specifications Matrix
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-tech-blue/10 text-tech-blue dark:text-cyan-400 border border-tech-blue/20 px-2.5 py-0.5 rounded-full">
                OEM Architecture Datasheet
              </span>
              {allItems.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200/70 dark:border-slate-700/60">
                  {allItems.length} Verified Parameters
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verified OEM hardware benchmarks, socket compatibility, memory timings, and enterprise telemetry
            </p>
          </div>
        </div>

        {/* Right Action Tools: Copy Datasheet + OEM Verification Badge */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            onClick={handleCopyDatasheet}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            title="Copy structured datasheet in markdown format"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Copied Datasheet!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Copy Specs</span>
              </>
            )}
          </button>

          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>100% OEM Verified</span>
          </div>
        </div>
      </div>

      {/* 2. AT-A-GLANCE HARDWARE HIGHLIGHTS (HERO SNAPSHOT STRIP) */}
      {keyHighlights.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Zap className="w-3.5 h-3.5 text-tech-blue dark:text-cyan-400" />
            <span>Hardware Architecture Snapshot</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {keyHighlights.map((hl, idx) => {
              const IconComp = hl.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-50/90 to-slate-100/60 dark:from-slate-950/80 dark:to-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between hover:border-tech-blue/40 dark:hover:border-cyan-500/40 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                      {hl.label}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-tech-blue dark:text-cyan-400 shrink-0 shadow-2xs">
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight break-words line-clamp-2">
                      {hl.value}
                    </div>
                    {hl.sub && (
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {hl.sub}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SEARCH & CATEGORY FILTER BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Specs ({categoryCounts.all || 0})
          </button>

          {Object.entries(CATEGORY_METADATA).map(([catId, meta]) => {
            const count = categoryCounts[catId] || 0;
            if (count === 0) return null;
            const isSelected = selectedCategory === catId;
            const IconComp = meta.icon;

            return (
              <button
                key={catId}
                type="button"
                onClick={() => setSelectedCategory(catId)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-tech-blue text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{meta.title.split(' ')[0]}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Real-time Search Input */}
        <div className="relative min-w-[240px] md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search specs (e.g. Core, RAM, OLED)..."
            className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 pl-9 pr-8 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-tech-blue dark:focus:border-cyan-500 font-medium transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. GROUPED SPECIFICATION MATRIX CARDS */}
      {groupedCategories.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
          {groupedCategories.map(group => {
            const GroupIcon = group.icon;
            return (
              <div
                key={group.id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col"
              >
                {/* Group Header */}
                <div className="px-5 py-4 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-2 border ${group.pillColor} shrink-0`}>
                      <GroupIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {group.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {group.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0">
                    {group.items.length} {group.items.length === 1 ? 'Spec' : 'Specs'}
                  </span>
                </div>

                {/* Structured Key-Value List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {group.items.map(item => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.rawKey}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-5 hover:bg-slate-50/60 dark:hover:bg-slate-950/40 transition-colors gap-2 sm:gap-4"
                      >
                        {/* Spec Label */}
                        <div className="flex items-center gap-2.5 sm:max-w-[45%] shrink-0">
                          <ItemIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {item.label}
                          </span>
                        </div>

                        {/* Spec Value */}
                        <div className="sm:text-right sm:max-w-[55%] break-words">
                          {renderSpecValue(item.value, item.rawKey)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/60 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No specifications found matching &ldquo;{searchQuery}&rdquo;
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keyword or clearing the active filter to view all parameters.
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-tech-blue text-white hover:bg-tech-blue/90 dark:bg-cyan-500 dark:text-slate-950 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 5. ARCHITECTURAL CAPABILITIES & HARDWARE FEATURES */}
      {features && features.length > 0 && (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <Award className="w-4 h-4 text-tech-blue dark:text-cyan-400" />
              <span>Architectural Technologies &amp; Hardware Capabilities</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Active Verification
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 flex items-start gap-3 hover:border-emerald-500/40 hover:bg-white dark:hover:bg-slate-900/80 transition-all shadow-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {feat}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Hardware Acceleration &amp; Instruction Set
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
