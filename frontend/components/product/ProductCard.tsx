'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import {
  ShoppingCart,
  Heart,
  Star,
  Check,
  Zap,
  Sparkles,
} from 'lucide-react';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { formatPrice, convertPrice, currentCurrency } = useCurrency();
  const [justAdded, setJustAdded] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const price = product.salePrice || product.price;
  const originalPrice = product.compareAtPrice || (product.salePrice ? product.price : null);
  const discountPercent = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const isOutOfStock = product.stock === 0;

  const convertedPrice = convertPrice(price);
  const formattedPriceAmount = convertedPrice.toLocaleString('en-US', {
    minimumFractionDigits: currentCurrency.decimals,
    maximumFractionDigits: currentCurrency.decimals,
  });

  // Extract key technical spec values with intelligent label formatting
  const specEntries = Object.entries(product.specifications || {}).slice(0, 3).map(([key, val]) => {
    let strVal = String(val);
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('core') && !strVal.toLowerCase().includes('core')) {
      strVal = `${strVal} Cores`;
    } else if (lowerKey.includes('thread') && !strVal.toLowerCase().includes('thread')) {
      strVal = `${strVal} Threads`;
    }
    return { key, label: strVal };
  });

  // Clean brand name to avoid awkward truncation
  const cleanBrandName = product.brandName === 'Samsung Semiconductor'
    ? 'Samsung'
    : (product.brandName || '').replace(/ Semiconductor/i, '').trim();

  // Authentic hardware photography mapping
  const isIntelI9 = (product.slug?.includes('14900k') || product.name?.toLowerCase().includes('14900k'));
  const isRyzen7950X = (product.slug?.includes('7950x') || product.name?.toLowerCase().includes('7950x'));
  const isSamsung990 = (product.slug?.includes('990-pro') || product.name?.toLowerCase().includes('990 pro'));
  const isRtx4090 = (product.slug?.includes('4090') || product.name?.toLowerCase().includes('rtx 4090'));

  const rawImage = product.thumbnail || product.images?.[0] || '';
  let displayImage = rawImage || '/images/intel_i9_14900k.jpg';
  if (isIntelI9) {
    displayImage = '/images/intel_i9_14900k.jpg';
  } else if (isRyzen7950X) {
    displayImage = '/images/amd_ryzen_7950x.jpg';
  } else if (isSamsung990) {
    displayImage = '/images/samsung_990_pro.jpg';
  } else if (isRtx4090) {
    displayImage = '/images/hero_rtx4090.jpg';
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="group relative bg-white dark:bg-[#0B101D] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-500/60 dark:hover:border-cyan-500/50 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1">
      {/* Top Image Stage Container */}
      <div className="relative aspect-[4/3] w-full bg-gradient-to-b from-slate-900 to-slate-950 p-3 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
        {/* Top Badges (Left) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
              <Zap className="w-2.5 h-2.5 fill-current" />
              <span>-{discountPercent}%</span>
            </span>
          )}
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/85 dark:bg-slate-800/90 text-white backdrop-blur-xs shadow-xs border border-white/10">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>Featured</span>
            </span>
          )}
        </div>

        {/* Wishlist Button (Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            inWishlist
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-500 border border-rose-200 dark:border-rose-800 shadow-xs scale-105'
              : 'bg-slate-900/75 hover:bg-slate-900 text-slate-300 hover:text-rose-400 border border-white/10 backdrop-blur-xs shadow-2xs'
          }`}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current text-rose-500' : ''}`} />
        </button>

        {/* Product Image */}
        <Link href={`/products/${product.slug}`} className="w-full h-full flex items-center justify-center relative z-0">
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-104 transition-transform duration-500"
          />
        </Link>
      </div>

      {/* Details Container */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-[#0B101D]">
        <div className="space-y-2">
          {/* Brand & Category Row */}
          <div className="flex items-center justify-between gap-2 text-[11px] h-5 leading-none">
            <span className="font-mono font-bold text-[10px] tracking-wider text-blue-600 dark:text-cyan-400 uppercase bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/50 shrink-0">
              {cleanBrandName}
            </span>
            {product.categoryName && (
              <span className="text-slate-400 dark:text-slate-400 font-medium text-[11px] truncate text-right">
                {product.categoryName}
              </span>
            )}
          </div>

          {/* Product Name (Crisp font-heading with 2-line clamped height for perfect grid alignment) */}
          <Link
            href={`/products/${product.slug}`}
            className="font-heading text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[36px] group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors leading-snug block"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Technical Specs Tags (Uniform height for row alignment across cards) */}
          <div className="h-6 overflow-hidden flex items-center gap-1.5">
            {specEntries.slice(0, 3).map(({ key, label }) => (
              <span
                key={key}
                className="text-[9.5px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 truncate max-w-[120px] border border-slate-200/60 dark:border-slate-700/60"
                title={`${key}: ${label}`}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Ratings & Stock Row */}
          <div className="flex items-center justify-between text-xs pt-0.5 h-5">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                {(product.rating || 4.9).toFixed(1)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({product.reviewCount || 18})
              </span>
            </div>

            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-md font-mono">
                Sold Out
              </span>
            ) : (
              <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Add to Cart Action Bar - Perfectly Aligned */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2.5 mt-auto">
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {currentCurrency.symbol}
              </span>
              <span className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-white font-mono tracking-tight leading-none">
                {formattedPriceAmount}
              </span>
            </div>
            <div className="h-4 flex items-center mt-1">
              {originalPrice && originalPrice > price ? (
                <span className="text-[10.5px] text-slate-400 dark:text-slate-500 line-through font-mono leading-none">
                  {formatPrice(originalPrice)}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                  Official GCC Warranty
                </span>
              )}
            </div>
          </div>

          <button
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-500/25 scale-102'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:shadow-md active:scale-95'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
