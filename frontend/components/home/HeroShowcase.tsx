'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product, HeroHighlight } from '@/types';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import {
  Cpu,
  Zap,
  Server,
  HardDrive,
  ShieldCheck,
  ArrowRight,
  Layers,
  ShoppingCart,
  Clock,
  ExternalLink,
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
};

export function HeroShowcase({ products = [], highlights }: HeroShowcaseProps) {
  const activeHighlights: HeroHighlight[] = (highlights && highlights.length > 0)
    ? highlights
    : (products || []).slice(0, 4).map((p, idx) => ({
      id: p.id,
      tabLabel: p.categoryName?.split(' ')[0]?.toUpperCase() || `ITEM ${idx + 1}`,
      name: p.name,
      brand: p.brandName,
      category: p.categoryName,
      badge: p.isFeatured ? 'Featured Hardware' : 'Enterprise Grade',
      iconName: 'Zap',
      specs: Object.entries(p.specifications || {}).slice(0, 4).map(([label, value]) => ({ label, value: String(value) })),
      matchQueries: [p.name.toLowerCase(), p.sku.toLowerCase()],
      defaultImage: p.thumbnail || p.images?.[0] || '',
      defaultPrice: p.salePrice || p.price,
      tagline: p.description?.slice(0, 100) || '',
      powerRating: (p.specifications as any)?.wattage || 'Enterprise Spec',
      order: idx + 1,
      isActive: true,
    }));

  if (activeHighlights.length === 0) {
    return null;
  }

  const [selectedTabId, setSelectedTabId] = useState<string>(activeHighlights[0]?.id || '');
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();
  const { formatPrice, convertPrice, currentCurrency } = useCurrency();

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
  const stockCount = matchedProduct?.stock || 25;
  const displayImage = matchedProduct?.images?.[0] || matchedProduct?.thumbnail || currentHighlight.defaultImage;

  const convertedCurrent = convertPrice(currentPrice);
  const formattedCurrentAmount = convertedCurrent.toLocaleString('en-US', {
    minimumFractionDigits: currentCurrency.decimals,
    maximumFractionDigits: currentCurrency.decimals,
  });

  let resolvedImage = displayImage;
  const lowerName = (displayName || '').toLowerCase();
  const lowerId = (selectedTabId || '').toLowerCase();
  if (lowerId.includes('gpu') || lowerName.includes('4090')) {
    resolvedImage = '/images/hero_rtx4090.jpg';
  } else if (lowerId.includes('cpu') || lowerName.includes('14900k') || lowerName.includes('intel')) {
    resolvedImage = '/images/intel_i9_14900k.jpg';
  } else if (lowerId.includes('ssd') || lowerName.includes('990') || lowerName.includes('samsung')) {
    resolvedImage = '/images/samsung_990_pro.jpg';
  } else if (lowerName.includes('7950x') || lowerName.includes('ryzen')) {
    resolvedImage = '/images/amd_ryzen_7950x.jpg';
  }

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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-9">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Left Column: Enterprise Narrative */}
          <div className="lg:col-span-6 space-y-5">
            {/* Main Headline */}
            <h1 className="font-heading text-[clamp(2.35rem,4.6vw,3.65rem)] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              Mission-Critical <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-tech-blue to-cyan-500">
                Compute Infrastructure.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Equip your enterprise with factory-authorized Intel Core i9-14900K CPUs, NVIDIA RTX 4090 24GB GPUs, 2U Dell PowerEdge Xeon Servers, and 100GbE Cisco Infrastructure. Insured GCC same-day dispatch with 5-year ProSupport.
            </p>

            {/* Primary Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <Link
                href="/products"
                className="px-5 py-3 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all group text-center"
              >
                <span>Browse Hardware Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pc-builder"
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-2xs text-center"
              >
                <Cpu className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Launch PC Builder Studio</span>
              </Link>
            </div>

            {/* Statistics / Live Telemetry Row */}
            <div className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1 font-mono">
                  <span>100%</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Official Warranty</div>
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                  5-Year
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">ProSupport Included</div>
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono">
                  0-Defect
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">24h Burn-in Tested</div>
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>12-Hour</span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">GCC Express Dispatch</div>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Sleek Hardware Showcase Terminal */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-[480px] relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-white dark:bg-[#0B101D] border border-slate-200/90 dark:border-slate-800/90 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all space-y-3">
              {/* Top Navigation Bar: Rounded Full Pill Segmented Switcher */}
              <div className="flex items-center justify-between gap-2 pb-0.5">
                <div className="inline-flex items-center gap-1 p-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-x-auto no-scrollbar max-w-full">
                  {activeHighlights.map(item => {
                    const ItemIcon = ICON_MAP[item.iconName] || Zap;
                    const isActive = item.id === selectedTabId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedTabId(item.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                      >
                        <ItemIcon className="w-3 h-3" />
                        <span>{item.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="shrink-0 flex items-center gap-1.5 ml-auto text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>In Stock ({stockCount})</span>
                </div>
              </div>

              {/* Hardware Visual Presentation Stage */}
              <div className="relative aspect-[16/9] max-h-[220px] rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-950 via-[#0A0F1D] to-slate-950 border border-slate-800/90 overflow-hidden group shadow-inner flex items-center justify-center">
                {/* Ambient Radial Spotlight */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.22)_0%,_transparent_70%)] pointer-events-none" />

                {/* Top Right Floating Power Tag */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900/85 border border-slate-700/80 text-amber-300 text-[9.5px] font-mono font-bold backdrop-blur-md shadow-xs">
                    ⚡ {currentHighlight.powerRating}
                  </span>
                </div>

                {/* Hardware Photo Canvas */}
                <img
                  src={resolvedImage}
                  alt={displayName}
                  className="w-full h-full object-contain p-2 filter brightness-105 contrast-105 group-hover:scale-102 transition-transform duration-500 rounded-xl"
                />
              </div>

              {/* Hardware Metadata & Title/Price Row */}
              <div className="space-y-0.5">
                {/* Brand & Category Breadcrumb / GCC Stock */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[10.5px] font-semibold tracking-normal text-blue-600 dark:text-cyan-400 truncate max-w-[260px]">
                    {currentHighlight.brand} • {currentHighlight.category}
                  </span>
                  <span className="text-[10px] sm:text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                    Official GCC Stock
                  </span>
                </div>

                {/* Title and Price Side-by-Side */}
                <div className="flex items-start justify-between gap-3 pt-0.5">
                  <h3
                    className="font-heading text-[13.5px] sm:text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight leading-snug line-clamp-1 flex-1 min-w-0"
                    title={displayName}
                  >
                    {displayName}
                  </h3>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[15px] sm:text-base font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap leading-none">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mr-1">
                        AED
                      </span>
                      {formattedCurrentAmount}
                    </div>
                    {originalPrice && originalPrice > currentPrice && (
                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 line-through whitespace-nowrap mt-0.5">
                        {formatPrice(originalPrice)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Separate Technical Spec Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                {currentHighlight.specs?.map((spec, i) => (
                  <div
                    key={i}
                    className="p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs flex flex-col justify-center min-w-0"
                  >
                    <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium">
                      {spec.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] mt-0.5 truncate tracking-tight font-sans" title={spec.value}>
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons Bar */}
              <div className="pt-1.5 flex items-center gap-2">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${justAdded
                    ? 'bg-emerald-600 text-white scale-101 shadow-emerald-600/25'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-md'
                    }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Order!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Order ({formatPrice(currentPrice)})</span>
                    </>
                  )}
                </button>

                <Link
                  href={matchedProduct?.slug ? `/products/${matchedProduct.slug}` : '/products'}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
                >
                  <span>Datasheet</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
