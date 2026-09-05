'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';

export default function WishlistPage() {
  const { wishlist, moveToCartFromWishlist, toggleWishlist } = useCart();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="pb-6 border-b border-slate-200 dark:border-tech-slate">
        <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
          <Link href="/account" className="hover:text-tech-blue">Account</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 font-bold">Saved Wishlist</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Saved Hardware Components ({wishlist.length})
        </h1>
      </div>

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <div
              key={product.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-tech-sm"
            >
              <div className="aspect-[4/3] rounded-2xl bg-slate-950 border border-slate-800 p-4 flex items-center justify-center">
                <img
                  src={product.thumbnail || product.images?.[0]}
                  alt={product.name}
                  className="max-h-full object-contain"
                />
              </div>

              <div>
                <div className="text-[10px] font-bold text-tech-cyan uppercase">{product.brandName}</div>
                <Link
                  href={`/products/${product.slug}`}
                  className="text-xs font-bold text-white line-clamp-2 hover:text-tech-cyan"
                >
                  {product.name}
                </Link>
                <div className="text-sm font-extrabold text-white mt-2">
                  {formatPrice(product.salePrice || product.price, product.currency)}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => moveToCartFromWishlist(product)}
                  className="flex-1 py-2 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
                <button
                  onClick={() => toggleWishlist(product)}
                  className="p-2 text-slate-400 hover:text-red-400 rounded-xl bg-slate-950 border border-slate-800"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 p-8">
          <Heart className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
            Save flagship GPUs, Xeon servers, and components for quick ordering later.
          </p>
          <Link href="/products" className="px-5 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-bold">
            Explore Hardware
          </Link>
        </div>
      )}
    </div>
  );
}
