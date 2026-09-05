'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  Store,
  Tag,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    cartItems,
    cartCount,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    couponCode,
    isCalculating,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      await applyCoupon(inputCoupon.trim().toUpperCase());
      setInputCoupon('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  if (cartCount === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6 transition-colors duration-200">
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your Shopping Cart is Empty</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            Explore our enterprise hardware catalog, configurable PC Builder matrix, or high-performance servers.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/products"
            className="px-6 py-3 bg-tech-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm"
          >
            Browse Products
          </Link>
          <Link
            href="/pc-builder"
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Launch PC Builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-200">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Shopping Cart ({cartCount} {cartCount === 1 ? 'Item' : 'Items'})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Authoritative server-side calculated pricing & VAT breakdown</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-slate-500 hover:text-red-500 font-semibold transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Cart Items Table */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map(item => (
            <div
              key={item.productId}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-2 shrink-0 flex items-center justify-center">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=200&q=80'}
                    alt={item.productName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.sellerType === 'RESELLER' ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Store className="w-3 h-3" /> Reseller: {item.resellerCode}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> NexTech Official Store
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>
                  </div>

                  <Link
                    href={`/products/${item.slug}`}
                    className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-tech-blue dark:hover:text-tech-cyan truncate block transition-colors"
                  >
                    {item.productName}
                  </Link>

                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {formatPrice(item.salePrice || item.price)} each
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Subtotal */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-1 hover:bg-white dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {formatPrice(item.subtotal)}
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove from cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Coupon Input Form */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-tech-blue dark:text-tech-cyan" />
              Promotional Discount Coupon
            </h3>

            {couponCode ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    Coupon &ldquo;{couponCode}&rdquo; Applied (Saving {formatPrice(cart.discount)})
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-red-500 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter code (e.g. TECH10, SUMMER50)"
                  value={inputCoupon}
                  onChange={e => setInputCoupon(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl text-xs font-mono uppercase text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-tech-blue"
                />
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="px-5 py-2.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {couponLoading ? 'Applying...' : 'Apply Code'}
                </button>
              </form>
            )}
            {couponError && (
              <p className="text-xs text-red-500 mt-2 font-medium">{couponError}</p>
            )}
          </div>
        </div>

        {/* Right Sticky Order Summary */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Authoritative Order Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({cartCount} items):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatPrice(cart.subtotal)}</span>
              </div>

              {cart.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Coupon Discount:</span>
                  <span>-{formatPrice(cart.discount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Shipping (Insured):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {cart.shippingFee === 0 ? 'FREE' : formatPrice(cart.shippingFee)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>UAE VAT ({cart.taxRate}%):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatPrice(cart.tax)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Amount Due</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {formatPrice(cart.total)}
                </div>
              </div>
              <span className="text-[10px] text-slate-400">AED Currency</span>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3.5 bg-tech-blue hover:bg-blue-600 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-tech-glow transition-all"
            >
              <span>Proceed to Secure Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="text-[11px] text-slate-400 text-center">
              🔒 256-Bit SSL Encrypted Checkout • Tax Invoice Generated Automatically
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
