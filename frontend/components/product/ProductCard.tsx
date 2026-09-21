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
  const { formatPrice } = useCurrency();
  const [justAdded, setJustAdded] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const price = product.salePrice || product.price;
  const originalPrice = product.compareAtPrice || (product.salePrice ? product.price : null);
  const discountPercent = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const isOutOfStock = product.stock === 0;

  // Extract key technical spec values
  const specEntries = Object.entries(product.specifications || {}).slice(0, 3);

  // Check if product is Intel i9 14900k to ensure authentic Intel hardware render
  const isIntelI9 = (product.slug?.includes('14900k') || product.name?.toLowerCase().includes('14900k'));
  const rawImage = product.thumbnail || product.images?.[0] || '';
  const displayImage = isIntelI9 && (!rawImage || rawImage.includes('photo-1591799264318'))
    ? '/images/intel_i9_14900k.jpg'
    : (rawImage || '/images/intel_i9_14900k.jpg');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1">
      {/* Visual Ambient Glow on Hover */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-tech-blue/10 dark:bg-cyan-500/10 rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500 pointer-events-none" />

      {/* Top Image Stage Container */}
      <div className="relative aspect-[4/3] bg-slate-50/70 dark:bg-slate-950/60 p-4 sm:p-5 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
        {/* Top Badges (Left) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-xs">
              <Zap className="w-2.5 h-2.5 fill-current" />
              <span>-{discountPercent}%</span>
            </span>
          )}
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/85 dark:bg-slate-800/90 text-white backdrop-blur-xs shadow-xs">
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
              : 'bg-white/90 dark:bg-slate-900/80 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xs shadow-2xs'
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
            className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      {/* Details Container */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-900">
        <div className="space-y-2">
          {/* Brand & Category Row */}
          <div className="flex items-center justify-between gap-2 text-[11px] h-4 leading-none">
            <span className="font-bold text-tech-blue dark:text-cyan-400 uppercase tracking-wider truncate max-w-[130px]">
              {product.brandName}
            </span>
            {product.categoryName && (
              <span className="text-slate-400 dark:text-slate-500 font-medium truncate max-w-[120px] text-right">
                {product.categoryName}
              </span>
            )}
          </div>

          {/* Product Name (Consistent 2-line clamped height for perfect grid alignment) */}
          <Link
            href={`/products/${product.slug}`}
            className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 h-10 hover:text-tech-blue dark:hover:text-cyan-400 transition-colors leading-snug block"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Technical Specs Tags */}
          {specEntries.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 min-h-[1.5rem] pt-0.5">
              {specEntries.map(([key, val]) => (
                <span
                  key={key}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[170px] border border-slate-200/60 dark:border-slate-700/60"
                  title={`${key}: ${val}`}
                >
                  {val}
                </span>
              ))}
            </div>
          )}

          {/* Ratings Row (In-Stock completely removed per user request) */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                {(product.rating || 4.9).toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({product.reviewCount || 18})
              </span>
            </div>

            {isOutOfStock && (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-md font-mono">
                Sold Out
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Add to Cart Action Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none whitespace-nowrap">
              {formatPrice(price)}
            </div>
            {originalPrice && originalPrice > price ? (
              <div className="text-[11px] text-slate-400 line-through font-mono mt-1 whitespace-nowrap">
                {formatPrice(originalPrice)}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 font-medium mt-1 whitespace-nowrap">
                Inc. 5% UAE VAT
              </div>
            )}
          </div>

          <button
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 scale-102'
                : 'bg-tech-blue hover:bg-blue-600 text-white shadow-tech-blue/20 hover:shadow-md'
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
