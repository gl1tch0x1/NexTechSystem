'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import {
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Store,
  Share2,
  Minus,
  Plus,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { formatPrice } = useCurrency();
  const [selectedImage, setSelectedImage] = useState<string>(
    product.images?.[0] || product.thumbnail || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [addedMessage, setAddedMessage] = useState(false);

  const inWishlist = isInWishlist(product.id);
  const price = product.salePrice || product.price;
  const originalPrice = product.compareAtPrice || (product.salePrice ? product.price : null);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 2500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/checkout');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-slate-950/60 backdrop-blur-md transition-all">
      {/* Left Images Gallery */}
      <div className="lg:col-span-6 space-y-4">
        {/* Main Display Image */}
        <div className="aspect-[4/3] rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-50 dark:from-[#0B0F19] dark:via-[#0E1527] dark:to-[#070B14] p-6 sm:p-8 flex items-center justify-center overflow-hidden border border-slate-200/80 dark:border-slate-800 relative shadow-inner group">
          {/* Ambient Spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 dark:from-tech-cyan/15 via-transparent to-transparent pointer-events-none" />

          {/* Product Image */}
          <img
            src={
              selectedImage && !selectedImage.includes('1591799264318')
                ? selectedImage
                : product.slug.includes('14900k') || product.name.toLowerCase().includes('14900k')
                ? '/images/intel_i9_14900k.jpg'
                : selectedImage || '/images/intel_i9_14900k.jpg'
            }
            alt={product.name}
            className="max-h-full max-w-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-500 relative z-10"
          />

          {product.isFeatured && (
            <span className="absolute top-4 left-4 z-20 bg-tech-blue text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 fill-current" />
              <span>Flagship Hardware</span>
            </span>
          )}

          {/* Live High-Res Badge */}
          <span className="absolute bottom-3 right-3 z-20 text-[10px] font-mono font-bold bg-slate-900/80 dark:bg-slate-950/80 text-white px-2 py-0.5 rounded-md backdrop-blur-sm border border-slate-700/50">
            LGA1700 • 6.0 GHz
          </span>
        </div>

        {/* Thumbnail Selector */}
        {product.images && product.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {product.images.map((img, idx) => {
              const displayImg = img.includes('1591799264318') && product.slug.includes('14900k')
                ? '/images/intel_i9_14900k.jpg'
                : img;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(displayImg)}
                  className={`w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-950 p-2 border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImage === displayImg
                      ? 'border-tech-blue shadow-md scale-105'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <img src={displayImg} alt={`${product.name} thumbnail ${idx}`} className="w-full h-full object-contain" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Product Details & Buy Box */}
      <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {/* Seller Attribution & SKU */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-tech-blue dark:text-tech-cyan uppercase tracking-wider">{product.brandName}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">SKU: {product.sku}</span>
            </div>

            {product.sellerType === 'RESELLER' ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                <Store className="w-3.5 h-3.5 text-amber-500" />
                Verified Partner: {product.resellerName || product.resellerCode}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Direct from NexTech Official Store
              </span>
            )}
          </div>

          {/* Product Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {product.description}
          </p>

          {/* Price Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/90 dark:border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatPrice(price)}
                </span>
                {originalPrice && (
                  <span className="text-sm text-slate-400 dark:text-slate-500 line-through font-mono">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                {originalPrice && originalPrice > price && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                    -{Math.round(((originalPrice - price) / originalPrice) * 100)}% SAVE
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Includes 5% UAE VAT • Free GCC Express Delivery over AED 500
              </div>
            </div>

            <div className="sm:text-right">
              {product.stock > 0 ? (
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{product.stock} Units In Stock</span>
                </div>
              ) : (
                <div className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-200">
                  Currently Out of Stock
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quantity and Actions */}
        <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white font-mono">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                inWishlist
                  ? 'border-red-500/40 bg-red-500/10 text-red-500 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-tech-blue dark:hover:border-tech-cyan'
              }`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current text-red-500' : ''}`} />
              <span className="hidden sm:inline">{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isOutOfStock
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-tech-blue hover:bg-blue-600 text-white shadow-blue-500/20 active:scale-[0.98]'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{addedMessage ? '✓ Added to Cart!' : 'Add to Cart'}</span>
            </button>

            <button
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                isOutOfStock
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.98]'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Instant Checkout</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-tech-blue dark:text-tech-cyan shrink-0" />
              <span className="font-medium">{product.warranty || '3 Years Official Manufacturer Warranty'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-tech-blue dark:text-tech-cyan shrink-0" />
              <span className="font-medium">Same-Day UAE Courier Dispatch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
