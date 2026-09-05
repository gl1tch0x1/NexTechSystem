'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { ApiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { Order, PaymentMethod, Address, Wallet } from '@/types';
import {
  ShieldCheck,
  CreditCard,
  Wallet as WalletIcon,
  Truck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, token } = useAuth();
  const { cart, cartItems, cartCount, clearCart } = useCart();

  const [shippingAddress, setShippingAddress] = useState<Address>({
    id: 'addr_temp',
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: user?.addresses?.[0]?.addressLine1 || '',
    city: 'Dubai',
    state: 'Dubai',
    country: 'United Arab Emirates',
    postalCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWalletAmount, setUseWalletAmount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch customer wallet balance
  useEffect(() => {
    if (token) {
      ApiClient.get<{ wallet: Wallet }>('/wallet', { token })
        .then(res => {
          if (res?.wallet) setWalletBalance(res.wallet.balance);
        })
        .catch(() => {});
    }
  }, [token]);

  // If cart is empty, redirect
  useEffect(() => {
    if (cartCount === 0 && !isSubmitting) {
      router.push('/cart');
    }
  }, [cartCount, isSubmitting, router]);

  const handleWalletToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const maxApplicable = Math.min(walletBalance, cart.total);
      setUseWalletAmount(maxApplicable);
    } else {
      setUseWalletAmount(0);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!token) {
        setErrorMessage('Please sign in or create an account to complete your order.');
        router.push('/login');
        setIsSubmitting(false);
        return;
      }

      const activeToken = token;

      const orderPayload = {
        items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress,
        billingAddress: shippingAddress,
        paymentMethod,
        couponCode: cart.couponCode,
        walletAmountToUse: useWalletAmount > 0 ? useWalletAmount : undefined,
        notes: orderNotes || undefined,
        customerPhone: shippingAddress.phone,
      };

      const createdOrder = await ApiClient.post<Order>('/orders', orderPayload, { token: activeToken });
      clearCart();
      router.push(`/account/orders/${createdOrder.id}`);
    } catch (err: any) {
      console.error('Order submission failed:', err);
      setErrorMessage(err.message || 'Failed to process order. Please verify details.');
      setIsSubmitting(false);
    }
  };

  const finalPayable = Math.max(0, Math.round((cart.total - useWalletAmount) * 100) / 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-tech-slate">
        <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
          <Link href="/cart" className="hover:text-tech-blue">Cart</Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-200 font-bold">Secure Checkout</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Lock className="w-6 h-6 text-emerald-500" />
          Enterprise Checkout & Order Confirmation
        </h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Delivery Address & Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Address */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Truck className="w-4 h-4 text-tech-cyan" />
              1. Delivery & Consignee Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Full Name / Company</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.fullName}
                  onChange={e => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white focus:border-tech-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.phone}
                  onChange={e => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white focus:border-tech-blue focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-bold mb-1">Street Address / Building / Suite</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.addressLine1}
                  onChange={e => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white focus:border-tech-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">City / Emirate</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white focus:border-tech-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.country}
                  onChange={e => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                  className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-white focus:border-tech-blue focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <CreditCard className="w-4 h-4 text-tech-cyan" />
              2. Payment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Credit Card */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-tech-blue bg-blue-950/40 text-white shadow-tech-sm'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <CreditCard className="w-5 h-5 text-tech-blue" />
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'CREDIT_CARD'}
                    onChange={() => setPaymentMethod('CREDIT_CARD')}
                  />
                </div>
                <div>
                  <div className="font-bold text-xs">Credit / Debit Card</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Visa, Mastercard, AMEX</div>
                </div>
              </label>

              {/* Customer Wallet */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'WALLET'
                    ? 'border-tech-blue bg-blue-950/40 text-white shadow-tech-sm'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <WalletIcon className="w-5 h-5 text-tech-cyan" />
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'WALLET'}
                    onChange={() => setPaymentMethod('WALLET')}
                  />
                </div>
                <div>
                  <div className="font-bold text-xs">Direct Wallet</div>
                  <div className="text-[10px] text-tech-cyan mt-0.5">Balance: {formatPrice(walletBalance)}</div>
                </div>
              </label>

              {/* Cash On Delivery */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-tech-blue bg-blue-950/40 text-white shadow-tech-sm'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Truck className="w-5 h-5 text-amber-500" />
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                </div>
                <div>
                  <div className="font-bold text-xs">Cash on Delivery (COD)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pay on delivery in UAE</div>
                </div>
              </label>
            </div>

            {/* Optional Wallet Partial Deduction */}
            {paymentMethod !== 'WALLET' && walletBalance > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-tech-cyan" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      Redeem Customer Wallet Balance ({formatPrice(walletBalance)} available)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Apply up to {formatPrice(Math.min(walletBalance, cart.total))} directly toward this invoice
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useWalletAmount > 0}
                  onChange={handleWalletToggle}
                  className="w-4 h-4 rounded text-tech-blue cursor-pointer"
                />
              </div>
            )}

            {/* Delivery Instructions */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-400 mb-1">
                Delivery Instructions / Courier Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Fragile server hardware. Please call before arrival."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-white focus:border-tech-blue focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Sticky Checkout Summary */}
        <div className="lg:col-span-4 sticky top-24 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-tech">
            <h3 className="text-sm font-black text-white pb-3 border-b border-slate-800">
              Itemized Invoice Summary
            </h3>

            {/* Items mini list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cartItems.map(it => (
                <div key={it.productId} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-400 truncate max-w-[180px]">
                    {it.quantity}x {it.productName}
                  </span>
                  <span className="font-bold text-white">{formatPrice(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-bold text-white">{formatPrice(cart.subtotal)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Discount:</span>
                  <span>-{formatPrice(cart.discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-400">
                <span>Shipping:</span>
                <span className="font-bold text-white">
                  {cart.shippingFee === 0 ? 'FREE' : formatPrice(cart.shippingFee)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>UAE VAT (5%):</span>
                <span className="font-bold text-white">{formatPrice(cart.tax)}</span>
              </div>
              {useWalletAmount > 0 && (
                <div className="flex items-center justify-between text-tech-cyan font-bold">
                  <span>Wallet Deduction:</span>
                  <span>-{formatPrice(useWalletAmount)}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between">
              <div>
                <div className="text-xs text-slate-400 font-bold">Final Amount to Pay</div>
                <div className="text-2xl font-black text-white">
                  {formatPrice(finalPayable)}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-tech-blue hover:bg-blue-600 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-tech-glow transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming Order & Generating E-Bill...' : 'Confirm & Place Order'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
