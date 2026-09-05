'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product, HeroHighlight } from '@/types';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import {
  Cpu,
  Zap,
  Server,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  ShoppingCart,
  Clock,
  ExternalLink,
  ChevronRight,
  Activity,
  Check
} from 'lucide-react';

interface HeroShowcaseProps {
  products: Product[];
  highlights?: HeroHighlight[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  Cpu,
  Server,
  HardDrive,
  Layers,
  Sparkles
};

const DEFAULT_HIGHLIGHTS: HeroHighlight[] = [
  {
    id: 'hero_gpu',
    tabLabel: 'GPU',
    name: 'ASUS ROG Strix RTX 4090 OC 24GB',
    brand: 'ASUS ROG',
    category: 'Graphics Processing Unit (GPU)',
    badge: 'AI & Render Flagship',
    iconName: 'Zap',
    specs: [
      { label: 'Architecture', value: 'Ada Lovelace 4nm' },
      { label: 'VRAM', value: '24GB GDDR6X 384-bit' },
      { label: 'CUDA Cores', value: '16,384 Cores' },
      { label: 'TDP Power', value: '450W (1000W Req)' },
    ],
    matchQueries: ['rtx 4090', '4090', 'rtx-4090', 'geforce'],
    defaultImage: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
    defaultPrice: 7499,
    tagline: 'World-leading graphics compute for 4K ray tracing & LLM inference.',
    powerRating: '450W TDP',
    order: 1,
    isActive: true
  },
  {
    id: 'hero_cpu',
    tabLabel: 'CPU',
    name: 'Intel Core i9-14900K 24-Core Desktop CPU',
    brand: 'Intel',
    category: 'Processor (CPU)',
    badge: 'Compute Benchmark King',
    iconName: 'Cpu',
    specs: [
      { label: 'Cores / Threads', value: '24C (8P+16E) / 32T' },
      { label: 'Max Frequency', value: 'Up to 6.0 GHz' },
      { label: 'Socket Type', value: 'LGA1700 (Z790)' },
      { label: 'Memory Support', value: 'DDR5 5600 / DDR4' },
    ],
    matchQueries: ['14900k', 'i9-14900k', 'intel core i9'],
    defaultImage: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=800&q=80',
    defaultPrice: 2099,
    tagline: 'Extreme single-thread frequency and 32-thread multi-tasking power.',
    powerRating: '253W Max',
    order: 2,
    isActive: true
  },
  {
    id: 'hero_server',
    tabLabel: 'SERVER',
    name: 'Dell PowerEdge R760 2U Rackmount Server',
    brand: 'Dell Technologies',
    category: 'Enterprise Server Node',
    badge: 'Mission-Critical Node',
    iconName: 'Server',
    specs: [
      { label: 'Dual Socket', value: 'Intel Xeon Scalable 4th Gen' },
      { label: 'Memory', value: 'Up to 8TB DDR5 ECC Reg' },
      { label: 'Form Factor', value: '2U Rack with iDRAC9' },
      { label: 'Redundancy', value: 'Dual 1400W Titanium' },
    ],
    matchQueries: ['poweredge', 'r760', 'rack server', 'dell poweredge'],
    defaultImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    defaultPrice: 18499,
    tagline: 'Redundant high-density virtualization and enterprise database compute.',
    powerRating: 'Dual 1400W',
    order: 3,
    isActive: true
  },
  {
    id: 'hero_ssd',
    tabLabel: 'SSD',
    name: 'Samsung 990 PRO 4TB PCIe 4.0 NVMe SSD',
    brand: 'Samsung Semiconductor',
    category: 'High-Throughput Storage',
    badge: 'Gen4 Speed Benchmark',
    iconName: 'HardDrive',
    specs: [
      { label: 'Seq. Read Speed', value: 'Up to 7,450 MB/s' },
      { label: 'Seq. Write Speed', value: 'Up to 6,900 MB/s' },
      { label: 'Controller', value: 'Samsung Pascal Controller' },
      { label: 'Durability', value: '2,400 TBW 5-Year' },
    ],
    matchQueries: ['990 pro', 'samsung 990', '990-pro'],
    defaultImage: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=800&q=80',
    defaultPrice: 1699,
    tagline: 'Instant boot times, sub-second 4K video asset scrubbing, and gaming speed.',
    powerRating: '7.8W Max',
    order: 4,
    isActive: true
  }
];

export function HeroShowcase({ products, highlights }: HeroShowcaseProps) {
  const activeHighlights = highlights && highlights.length > 0 ? highlights : DEFAULT_HIGHLIGHTS;
  const [selectedTabId, setSelectedTabId] = useState<string>(activeHighlights[0]?.id || 'hero_gpu');
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();

  const currentHighlight = activeHighlights.find(h => h.id === selectedTabId) || activeHighlights[0];

  // Resolve matching product in database accurately
  const matchedProduct = products.find(p => {
    const name = (p.name || '').toLowerCase();
    const slug = (p.slug || '').toLowerCase();
    return currentHighlight.matchQueries?.some(q => name.includes(q) || slug.includes(q));
  });

  const displayName = matchedProduct ? matchedProduct.name : currentHighlight.name;
  const currentPrice = matchedProduct?.salePrice || matchedProduct?.price || currentHighlight.defaultPrice;
  const originalPrice = matchedProduct?.compareAtPrice || (matchedProduct?.salePrice ? matchedProduct?.price : currentPrice + 400);
  const inStock = matchedProduct ? (matchedProduct.stock > 0) : true;
  const stockCount = matchedProduct?.stock || 25;
  const displayImage = matchedProduct?.images?.[0] || matchedProduct?.thumbnail || currentHighlight.defaultImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (matchedProduct) {
      addToCart(matchedProduct, 1);
    } else {
      const tempProduct: Product = {
        id: `prod_${currentHighlight.id}_flagship`,
        name: currentHighlight.name,
        slug: currentHighlight.matchQueries?.[0] || 'hardware',
        sku: `NX-${currentHighlight.id.toUpperCase()}-01`,
        brandId: 'brand_official',
        brandName: currentHighlight.brand,
        categoryId: 'cat_components',
        categoryName: currentHighlight.category,
        sellerType: 'ADMIN',
        price: currentPrice,
        currency: 'AED',
        stock: 15,
        lowStockThreshold: 3,
        images: [displayImage],
        thumbnail: displayImage,
        specifications: {},
        features: [],
        tags: [],
        rating: 5.0,
        reviewCount: 20,
        isFeatured: true,
        isActive: true,
        approvalStatus: 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addToCart(tempProduct, 1);
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#060A13] border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      {/* Background Radial Ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/10 dark:from-blue-600/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-tech-blue/10 dark:bg-tech-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-tech-cyan/10 dark:bg-tech-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Enterprise Narrative */}
          <div className="lg:col-span-6 space-y-6">
            {/* Top Chip */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tech-blue/10 dark:bg-tech-blue/20 border border-tech-blue/30 text-tech-blue dark:text-tech-cyan text-xs font-extrabold tracking-wide uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-tech-cyan animate-ping" />
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Enterprise Computing Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.06]">
              Mission-Critical <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-tech-blue via-indigo-500 to-tech-cyan">
                Compute Infrastructure.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Equip your enterprise with factory-authorized Intel Core i9-14900K CPUs, NVIDIA RTX 4090 24GB GPUs, 2U Dell PowerEdge Xeon Servers, and 100GbE Cisco Infrastructure. Insured GCC same-day dispatch with 5-year ProSupport.
            </p>

            {/* Primary Action CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/products"
                className="px-6 py-3.5 rounded-xl bg-tech-blue text-white text-sm font-extrabold hover:bg-blue-600 shadow-lg shadow-tech-blue/25 hover:shadow-tech-glow flex items-center gap-2 transition-all group"
              >
                <span>Browse Hardware Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pc-builder"
                className="px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm font-bold border border-slate-200 dark:border-slate-700 hover:border-tech-blue dark:hover:border-tech-cyan hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xs"
              >
                <Cpu className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
                <span>Launch PC Builder Studio</span>
              </Link>
            </div>

            {/* Ant Design Statistics / Live Telemetry Row */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="space-y-0.5">
                <div className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-1 font-mono">
                  <span>100%</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">OEM Direct Supply</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  5-Year
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">ProSupport Available</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  0-Defect
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">24h Burn-in Tested</div>
              </div>

              <div className="space-y-0.5">
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                  <Clock className="w-4 h-4" />
                  <span>12-Hour</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">GCC Express Dispatch</div>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Sleek Hardware Showcase Terminal */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#0B101D] border border-slate-200/90 dark:border-slate-800 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all space-y-5">
              {/* Top Navigation Bar: Minimalist Pill Tab Switcher */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  {activeHighlights.map(item => {
                    const ItemIcon = ICON_MAP[item.iconName] || Zap;
                    const isActive = item.id === selectedTabId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedTabId(item.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isActive
                            ? 'bg-tech-blue text-white shadow-md'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ItemIcon className="w-3.5 h-3.5" />
                        <span>{item.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    In Stock ({stockCount})
                  </span>
                </div>
              </div>

              {/* Hardware Visual Presentation Stage (Clean, Open & Seamless) */}
              <div className="relative aspect-[16/9] sm:aspect-[2/1] rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-50 dark:from-[#0E1527] dark:via-[#090D18] dark:to-[#0B101D] border border-slate-100 dark:border-slate-800/80 p-4 flex items-center justify-center overflow-hidden group">
                {/* Ambient Radial Spotlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tech-blue/10 dark:from-tech-blue/20 via-transparent to-transparent pointer-events-none" />

                {/* Top Corner Floating Tags */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-2.5 py-1 rounded-lg bg-tech-blue/10 dark:bg-tech-blue/20 border border-tech-blue/30 text-tech-blue dark:text-tech-cyan text-[10px] font-mono font-extrabold uppercase tracking-wider backdrop-blur-md">
                    {currentHighlight.badge}
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 dark:bg-slate-900/90 border border-slate-700/80 text-amber-300 text-[10px] font-mono font-bold backdrop-blur-md shadow-xs">
                    ⚡ {currentHighlight.powerRating}
                  </span>
                </div>

                {/* Hardware Photo Canvas */}
                <div className="relative z-0 w-full h-full flex items-center justify-center pt-4">
                  <img
                    src={displayImage}
                    alt={displayName}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] group-hover:scale-106 transition-transform duration-500"
                  />
                </div>
              </div>

              {/* Hardware Title, Brand & Price Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-bold text-tech-blue dark:text-tech-cyan uppercase tracking-wider">
                    {currentHighlight.brand} • {currentHighlight.category}
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    Official UAE Distributor
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 pt-1">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-1 tracking-tight">
                    {displayName}
                  </h3>

                  <div className="text-right shrink-0">
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {formatPrice(currentPrice, matchedProduct?.currency || 'AED')}
                    </div>
                    {originalPrice && originalPrice > currentPrice && (
                      <div className="text-[11px] text-slate-400 line-through font-mono">
                        {formatPrice(originalPrice, matchedProduct?.currency || 'AED')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Spec Badges Grid (Clean 4-column / 2x2 Ant Design HUD Chips) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {currentHighlight.specs?.map((spec, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs flex flex-col justify-center"
                  >
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400">{spec.label}</span>
                    <span className="font-black text-slate-900 dark:text-slate-200 truncate mt-0.5 text-[11px] font-mono">{spec.value}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
                    justAdded
                      ? 'bg-emerald-600 text-white scale-102 shadow-emerald-600/25'
                      : 'bg-tech-blue hover:bg-blue-600 text-white shadow-tech-blue/20 hover:shadow-tech-glow'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Order!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Order ({formatPrice(currentPrice, 'AED')})</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/products/${matchedProduct?.slug || 'products'}`}
                  className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <span>Datasheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
