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
  ShieldCheck,
  Store,
  CheckCircle2,
  Check,
  ArrowRight,
  Eye,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  Truck
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

  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);
  const isOutOfStock = product.stock === 0;

  // Extract key technical spec highlights
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
    <div className="group relative bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-slate-800 hover:border-tech-blue/80 dark:hover:border-cyan-400/80 hover:shadow-2xl dark:hover:shadow-[0_12px_36px_rgba(0,212,255,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1.5">
      {/* Visual Accent Glow on Hover */}
      <div className="absolute -top-24 -right-24 w-52 h-52 bg-gradient-to-br from-tech-blue/15 to-cyan-400/10 dark:from-cyan-400/15 dark:to-blue-600/10 rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity duration-500 pointer-events-none" />

      {/* Top Image Stage Container */}
      <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-50 dark:from-[#0B0F19] dark:via-[#0E1527] dark:to-[#070B14] p-5 flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800/80">
        {/* Ambient Spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tech-blue/8 dark:from-cyan-400/15 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges (Left) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          {discountPercent > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg shadow-sm font-mono tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>SAVE {discountPercent}%</span>
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-tech-blue text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg shadow-sm font-mono tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>FEATURED</span>
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
          className={`absolute top-3 right-3 z-10 p-2.5 rounded-xl backdrop-blur-md transition-all ${
            inWishlist
              ? 'bg-red-500/20 text-red-500 border border-red-500/40 shadow-sm scale-110'
              : 'bg-white/90 dark:bg-slate-900/80 text-slate-400 hover:text-red-500 hover:scale-110 border border-slate-200 dark:border-slate-700 shadow-sm'
          }`}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current text-red-500' : ''}`} />
        </button>

        {/* Product Image */}
        <Link href={`/products/${product.slug}`} className="w-full h-full flex items-center justify-center relative z-0">
          <img
            src={displayImage}
            alt={product.name}
            className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-108 transition-transform duration-500"
          />
        </Link>
      </div>

      {/* Details Container */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900/95">
        <div className="space-y-2.5">
          {/* Brand & Seller Attribution */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-mono font-bold text-tech-blue dark:text-cyan-400 uppercase tracking-wider">
              {product.brandName}
            </span>
            {product.sellerType === 'RESELLER' ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded-md text-[10px]">
                <Store className="w-3 h-3" />
                {product.resellerCode || 'Partner'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-2 py-0.5 rounded-md text-[10px] font-mono">
                <ShieldCheck className="w-3 h-3" />
                OEM Direct
              </span>
            )}
          </div>

          {/* Product Name */}
          <Link
            href={`/products/${product.slug}`}
            className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 hover:text-tech-blue dark:hover:text-cyan-400 transition-colors leading-snug"
          >
            {product.name}
          </Link>

          {/* Technical Specs Tags (Ant Design Spec Chips) */}
          {specEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {specEntries.map(([key, val]) => (
                <span
                  key={key}
                  className="text-[10px] font-mono font-medium bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200/80 dark:border-slate-800"
                >
                  <span className="text-slate-400 uppercase text-[9px] mr-1">{key.slice(0, 5)}:</span>
                  {val}
                </span>
              ))}
            </div>
          )}

          {/* Ratings & Stock Status Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                {(product.rating || 4.9).toFixed(1)}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">({product.reviewCount || 18})</span>
            </div>

            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-red-500 font-mono bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Only {product.stock} Left
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                In Stock ({product.stock})
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Interactive Instant Action Bar */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatPrice(price)}
            </div>
            {originalPrice && originalPrice > price ? (
              <div className="text-xs text-slate-400 line-through font-mono">
                {formatPrice(originalPrice)}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 font-sans">
                Inc. 5% UAE VAT
              </div>
            )}
          </div>

          <button
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm ${
              isOutOfStock
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-500/25 scale-105'
                : 'bg-tech-blue hover:bg-blue-600 text-white shadow-tech-blue/20 hover:shadow-tech-glow'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added!</span>
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
