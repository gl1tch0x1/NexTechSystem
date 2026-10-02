'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import { CustomerPortalHeader } from '@/components/account/CustomerPortalHeader';
import {
  Heart,
  ShoppingCart,
  Trash2,
  CheckCircle2
} from 'lucide-react';

function WishlistContent() {
  const { wishlist, moveToCartFromWishlist, toggleWishlist } = useCart();
  const { formatPrice } = useCurrency();
  const [movingAll, setMovingAll] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleMoveAllToCart = () => {
    if (wishlist.length === 0) return;
    setMovingAll(true);
    wishlist.forEach(prod => {
      moveToCartFromWishlist(prod);
    });
    setFeedback('All saved components moved to your active cart!');
    setTimeout(() => {
      setMovingAll(false);
      setFeedback(null);
    }, 4000);
  };

  const handleClearWishlist = () => {
    if (!confirm('Are you sure you want to remove all items from your wishlist?')) return;
    [...wishlist].forEach(prod => {
      toggleWishlist(prod);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Customer Portal Navigation Shell */}
      <CustomerPortalHeader />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Saved Hardware Wishlist ({wishlist.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Flagship GPUs, high-performance compute nodes, and components saved for future procurement
          </p>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearWishlist}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleMoveAllToCart}
              disabled={movingAll}
              className="px-4 py-2 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Move All to Cart</span>
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{feedback}</span>
        </div>
      )}

      {wishlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {wishlist.map(product => (
            <div
              key={product.id}
              className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-lg transition-all"
            >
              <div className="aspect-[4/3] rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 p-4 flex items-center justify-center relative overflow-hidden">
                <img
                  src={product.thumbnail || product.images?.[0] || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=300&q=80'}
                  alt={product.name}
                  className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700/80 transition-all shadow-xs"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-tech-blue dark:text-tech-cyan uppercase tracking-wider">
                    {product.brandName || 'Enterprise Hardware'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                    In Stock
                  </span>
                </div>

                <Link
                  href={`/products/${product.slug}`}
                  className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-tech-blue dark:hover:text-tech-cyan transition-colors"
                >
                  {product.name}
                </Link>

                <div className="text-base font-black text-slate-900 dark:text-white pt-1">
                  {formatPrice(product.salePrice || product.price, product.currency)}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => moveToCartFromWishlist(product)}
                  className="w-full py-2.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-4 shadow-xs">
          <Heart className="w-14 h-14 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Saved Wishlist is Empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Save GPUs, enterprise rack servers, and custom PC components for fast checkout and compatibility checking later.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/products"
              className="px-5 py-2.5 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
            >
              Explore Hardware
            </Link>
            <Link
              href="/pc-builder"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700"
            >
              PC Builder Matrix
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-400">Loading Wishlist...</div>}>
      <WishlistContent />
    </Suspense>
  );
}
