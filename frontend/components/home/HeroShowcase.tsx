'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Product, HeroHighlight } from '@/types';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import {
  ShieldCheck,
  ArrowRight,
  ShoppingCart,
  Clock,
  ExternalLink,
  Check,
  ChevronUp,
  X,
  ZoomIn
} from 'lucide-react';
import { getAuthenticProductImage, DEFAULT_PRODUCT_PLACEHOLDER } from '@/lib/product-image-url';

interface HeroShowcaseProps {
  products: Product[];
  highlights?: HeroHighlight[];
}


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
  const [isHovered, setIsHovered] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [rotationDirection, setRotationDirection] = useState<1 | -1>(1);
  const { addToCart } = useCart();
  const { formatPrice, convertPrice, currentCurrency } = useCurrency();

  // Close lightbox on Escape key
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  // Automatic 10-second hardware rotation (GPU -> CPU -> Server -> SSD and vice versa)
  useEffect(() => {
    // Pause auto-rotation when user is interacting with card or inspecting in lightbox
    if (isHovered || isLightboxOpen || activeHighlights.length <= 1) return;

    const timer = setInterval(() => {
      setSelectedTabId((prevId) => {
        const currentIndex = activeHighlights.findIndex(h => h.id === prevId);
        const idx = currentIndex >= 0 ? currentIndex : 0;

        let nextIdx = idx + rotationDirection;

        // Bounce back and forth smoothly between ends
        if (nextIdx >= activeHighlights.length - 1) {
          nextIdx = activeHighlights.length - 1;
          setRotationDirection(-1);
        } else if (nextIdx <= 0) {
          nextIdx = 0;
          setRotationDirection(1);
        }

        return activeHighlights[nextIdx]?.id || prevId;
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [isHovered, isLightboxOpen, rotationDirection, activeHighlights]);

  // Interactive 3D perspective tilt & parallax physics
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [0, 1], [5, -5]);
  const rotateY = useTransform(smoothMouseX, [0, 1], [-5, 5]);
  const imageX = useTransform(smoothMouseX, [0, 1], [-8, 8]);
  const imageY = useTransform(smoothMouseY, [0, 1], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

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
  const resolvedImage = matchedProduct
    ? getAuthenticProductImage(matchedProduct)
    : (currentHighlight.defaultImage || DEFAULT_PRODUCT_PLACEHOLDER);

  const convertedCurrent = convertPrice(currentPrice);
  const formattedCurrentAmount = convertedCurrent.toLocaleString('en-US', {
    minimumFractionDigits: currentCurrency.decimals,
    maximumFractionDigits: currentCurrency.decimals,
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    let added = false;
    if (matchedProduct) {
      added = addToCart(matchedProduct, 1);
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
        images: [resolvedImage],
        thumbnail: resolvedImage,
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
      added = addToCart(tempProduct, 1);
    }
    if (added) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#060A13] border-b border-slate-200/90 dark:border-slate-800 transition-colors duration-200">
      {/* Precision Engineered Background Grid Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" 
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Enterprise Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-6 space-y-6"
          >
            {/* Enterprise Tag */}
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-mono font-semibold">
              <span>GCC AUTHORIZED ENTERPRISE HARDWARE</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-[clamp(2.4rem,4.8vw,3.85rem)] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.06]">
              Mission-Critical <br />
              <span className="text-blue-600 dark:text-blue-400">
                Compute Infrastructure.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl font-normal leading-relaxed">
              Equip your enterprise with factory-authorized Intel Core i9-14900K CPUs, NVIDIA RTX 4090 24GB GPUs, 2U Dell PowerEdge Xeon Servers, and 100GbE Cisco Infrastructure. Insured GCC same-day dispatch with 5-year ProSupport.
            </p>

            {/* Primary Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
              <Link
                href="/products"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all group text-center tracking-wide"
              >
                <span>Browse Hardware Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pc-builder"
                className="px-6 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-cyan-400 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xs text-center"
              >
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
          </motion.div>

          {/* Right Column: Unified Sleek Hardware Showcase Terminal */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                perspective: 1000,
              }}
              className="w-full max-w-[540px] h-[480px] sm:h-[520px] relative rounded-3xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.55)] transition-colors duration-200 select-none group"
            >
              {/* Diffused Depth-of-Field Blur Ring: focuses 100% on foreground hardware */}
              <div className="absolute inset-8 rounded-3xl bg-slate-500/5 dark:bg-white/5 backdrop-blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.06)_0%,transparent_70%)] pointer-events-none dark:opacity-60" />

              {/* Floating Architectural Segmented Switcher & Stock Radar */}
              <div className="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between gap-2 pointer-events-auto">
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/70 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-x-auto no-scrollbar max-w-[calc(100%-115px)] relative">
                  {activeHighlights.map((item, idx) => {
                    const isActive = item.id === selectedTabId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTabId(item.id);
                          if (idx === 0) setRotationDirection(1);
                          else if (idx === activeHighlights.length - 1) setRotationDirection(-1);
                        }}
                        className={`relative px-3 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer shrink-0 z-10 ${isActive
                          ? 'text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="activeHeroTabIndicator"
                            className="absolute inset-0 rounded-lg bg-blue-600 shadow-md shadow-blue-600/30 -z-10 overflow-hidden"
                            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                          >
                            {!isHovered && !isLightboxOpen && (
                              <motion.span
                                key={selectedTabId}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 10, ease: 'linear' }}
                                style={{ originX: 0 }}
                                className="absolute bottom-0 inset-x-0 h-[2px] bg-white/50 pointer-events-none"
                              />
                            )}
                          </motion.span>
                        )}
                        <span>{item.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/70 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>In Stock ({stockCount})</span>
                </div>
              </div>

              {/* Top Right Realistic Spec Tag */}
              <div className="absolute top-14 right-3.5 z-10 pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={selectedTabId}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-900/75 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 text-[10px] font-mono font-semibold shadow-xs backdrop-blur-md"
                  >
                    <span>{currentHighlight.powerRating}</span>
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Full-Card Immersive Hardware Visual Stage with 3D Parallax & Depth */}
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="absolute inset-0 flex items-center justify-center p-6 sm:p-8 pt-14 pb-14 pointer-events-auto cursor-zoom-in"
                title="Click to inspect full-resolution hardware image"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedTabId}
                    src={resolvedImage}
                    alt={displayName}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{
                      opacity: 1,
                      scale: isHovered ? 1.09 : 1,
                      y: isHovered ? -14 : 0,
                    }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    style={{
                      x: imageX,
                      y: imageY,
                    }}
                    transition={{
                      scale: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                      y: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.22 },
                    }}
                    className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_25px_45px_rgba(0,0,0,0.75)] select-none pointer-events-none"
                  />
                </AnimatePresence>

                {/* Subtle visual zoom affordance badge on hover */}
                <motion.div
                  initial={false}
                  animate={{ opacity: isHovered ? 0.9 : 0, scale: isHovered ? 1 : 0.85 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-16 right-4 px-2.5 py-1 rounded-full bg-slate-900/75 dark:bg-white/10 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1 border border-white/20 pointer-events-none shadow-md"
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>Click to expand</span>
                </motion.div>
              </div>

              {/* Bottom Slide-Up Hardware Intelligence & Telemetry Drawer with Frosted Glassmorphic Depth */}
              <motion.div
                initial={false}
                animate={{
                  y: isHovered ? 0 : 'calc(100% - 54px)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 32,
                  mass: 0.8,
                }}
                className="absolute inset-x-0 bottom-0 z-30 rounded-b-3xl bg-white/45 dark:bg-slate-950/55 backdrop-blur-3xl border-t border-white/60 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_-15px_35px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_-20px_45px_rgba(0,0,0,0.6)] p-4 sm:p-5 text-slate-900 dark:text-white pointer-events-auto overflow-hidden"
              >
                {/* Internal Frosted Gradient Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/20 to-white/40 dark:from-white/5 dark:via-transparent dark:to-slate-950/40 pointer-events-none rounded-b-3xl -z-10" />

                {/* Micro Grab Handle Indicator */}
                <div className="w-9 h-1 rounded-full bg-slate-300/80 dark:bg-slate-600/80 mx-auto -mt-1 mb-2.5 transition-opacity" />

                {/* Always-visible top handle bar */}
                <div
                  onClick={() => setIsHovered(prev => !prev)}
                  className="flex items-center justify-between gap-3 pb-1 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={selectedTabId}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.18 }}
                        className="font-heading text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight drop-shadow-xs"
                      >
                        {displayName}
                      </motion.h3>
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={selectedTabId}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.18 }}
                        className="font-mono text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap"
                      >
                        AED {formattedCurrentAmount}
                      </motion.span>
                    </AnimatePresence>
                    <motion.div
                      animate={{ rotate: isHovered ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-white transition-colors" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded Hardware Specs & Actions Drawer */}
                <motion.div
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.22, delay: isHovered ? 0.06 : 0 }}
                  className="space-y-3 pt-2"
                >
                  {/* Category & Official Stock Badge */}
                  <div className="flex items-center justify-between gap-2 text-[10.5px]">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[240px]">
                      {currentHighlight.brand} • {currentHighlight.category}
                    </span>
                    <div className="flex items-center gap-2">
                      {originalPrice && originalPrice > currentPrice && (
                        <span className="font-mono text-slate-400 dark:text-slate-500 line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      )}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        Official GCC Stock
                      </span>
                    </div>
                  </div>

                  {/* 4 Technical Spec Cards in 2x2 grid - Frosted Translucent Glass */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {currentHighlight.specs?.map((spec, i) => (
                      <div
                        key={i}
                        className="p-1.5 px-2.5 rounded-xl bg-white/55 dark:bg-slate-900/45 backdrop-blur-md border border-white/70 dark:border-slate-800/70 text-xs flex flex-col justify-center min-w-0 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none hover:bg-white/75 dark:hover:bg-slate-800/60 transition-all"
                      >
                        <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                          {spec.label}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] mt-0.5 truncate tracking-tight font-sans" title={spec.value}>
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-1 flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                        justAdded
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
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
                    </motion.button>

                    <Link
                      href={matchedProduct?.slug ? `/products/${matchedProduct.slug}` : '/products'}
                      className="py-2.5 px-3.5 rounded-xl bg-white/60 hover:bg-white/80 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0 border border-white/70 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 backdrop-blur-md"
                    >
                      <span>Datasheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* High-Resolution Hardware Inspection Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 cursor-zoom-out select-none"
          >
            {/* Top Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl flex items-center justify-between gap-4 py-2.5 px-4 rounded-2xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border border-white/15 text-white z-10 cursor-default"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-[10px] font-mono font-bold tracking-wider uppercase">
                  High-Res OEM
                </span>
                <div className="min-w-0">
                  <h4 className="font-heading text-sm sm:text-base font-bold truncate text-white">
                    {displayName}
                  </h4>
                  <p className="text-[11px] text-slate-300 dark:text-slate-400 truncate">
                    {currentHighlight.brand} • {currentHighlight.category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Central High-Resolution Inspection Stage */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full h-[62vh] sm:h-[70vh] flex items-center justify-center p-4 cursor-default select-none my-auto"
            >
              <img
                src={resolvedImage}
                alt={displayName}
                className="max-w-full max-h-full object-contain filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.85)]"
              />
            </motion.div>

            {/* Bottom Bar: Specs & Actions */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 py-3 px-5 rounded-2xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border border-white/15 text-white z-10 cursor-default"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-300">Authorized Price:</span>
                <span className="font-mono text-base sm:text-lg font-bold text-white">
                  AED {formattedCurrentAmount}
                </span>
                <span className="text-[11px] text-emerald-400 ml-2 font-medium font-mono">
                  • In Stock ({stockCount} units)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Order</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
