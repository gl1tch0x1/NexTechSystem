'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800">
      {/* Left Images Gallery */}
      <div className="lg:col-span-6 space-y-4">
        {/* Main Display Image */}
        <div className="aspect-[4/3] rounded-2xl bg-slate-950 p-6 flex items-center justify-center overflow-hidden border border-slate-800 relative">
          <img
            src={selectedImage || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'}
            alt={product.name}
            className="max-h-full max-w-full object-contain transition-all duration-300"
          />
          {product.isFeatured && (
            <span className="absolute top-4 left-4 bg-tech-blue text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow">
              Featured Flagship
            </span>
          )}
        </div>

        {/* Thumbnail Selector */}
        {product.images && product.images.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-16 h-16 rounded-xl bg-slate-950 p-2 border-2 transition-all shrink-0 ${
                  selectedImage === img
                    ? 'border-tech-blue shadow-tech-sm'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <img src={img} alt={`${product.name} thumbnail ${idx}`} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Product Details & Buy Box */}
      <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          {/* Seller Attribution & SKU */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-tech-cyan uppercase tracking-wider">{product.brandName}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-400">SKU: {product.sku}</span>
            </div>

            {product.sellerType === 'RESELLER' ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-800">
                <Store className="w-3.5 h-3.5" />
                Verified Reseller: {product.resellerName || product.resellerCode}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Direct from NexTech Official Store
              </span>
            )}
          </div>

          {/* Product Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-snug">
            {product.name}
          </h1>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {product.description}
          </p>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white">
                  {formatPrice(price, product.currency)}
                </span>
                {originalPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatPrice(originalPrice, product.currency)}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Includes 5% UAE VAT • Free shipping over AED 500
              </div>
            </div>

            <div className="text-right">
              {product.stock > 0 ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{product.stock} Units In Stock</span>
                </div>
              ) : (
                <div className="text-xs font-bold text-red-400">Currently Out of Stock</div>
              )}
            </div>
          </div>
        </div>

        {/* Quantity and Actions */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-xs font-bold text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className={`p-3 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold ${
                inWishlist
                  ? 'border-red-500/40 bg-red-500/20 text-red-400'
                  : 'border-slate-800 text-slate-300 hover:border-tech-blue'
              }`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-tech-blue text-white hover:bg-blue-600 shadow-tech'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{addedMessage ? '✓ Added to Cart!' : 'Add to Cart'}</span>
            </button>

            <button
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
                isOutOfStock
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-tech'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Instant Checkout</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-tech-cyan" />
              <span>{product.warranty || 'Official UAE Warranty'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-tech-cyan" />
              <span>Next-day courier dispatch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
