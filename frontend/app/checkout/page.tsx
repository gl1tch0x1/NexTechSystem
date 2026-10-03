'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useCurrency } from '@/lib/currency-context';
import { ApiClient } from '@/lib/api-client';
import { Order, PaymentMethod, Address } from '@/types';
import OrderOtpModal from '@/components/checkout/OrderOtpModal';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  Truck,
  AlertCircle,
  Lock,
  CheckCircle2,
  MapPin,
  Tag,
  Loader2,
  ArrowRight,
  Shield,
  Check,
  Mail,
  X
} from 'lucide-react';

const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain'
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const {
    cart,
    cartItems,
    cartCount,
    clearCart,
    applyCoupon,
    removeCoupon,
    couponCode: activeCouponCode
  } = useCart();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, authLoading, router]);

  // Selected saved address index vs custom
  const [selectedSavedAddressIndex, setSelectedSavedAddressIndex] = useState<number | 'custom'>('custom');

  const [shippingAddress, setShippingAddress] = useState<Address>({
    id: 'addr_checkout',
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: user?.addresses?.[0]?.addressLine1 || '',
    city: user?.addresses?.[0]?.city || 'Dubai',
    state: user?.addresses?.[0]?.state || 'Dubai',
    country: 'United Arab Emirates',
    postalCode: user?.addresses?.[0]?.postalCode || '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Email OTP Verification State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpMaskedEmail, setOtpMaskedEmail] = useState('');
  const [otpDevCode, setOtpDevCode] = useState<string | undefined>();
  const [otpCooldown, setOtpCooldown] = useState(60);
  const [otpError, setOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Coupon state in checkout
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Pre-fill delivery details when user profile becomes available
  useEffect(() => {
    if (user) {
      if (user.addresses && user.addresses.length > 0) {
        const defaultAddr = user.addresses.find(a => a.isDefaultShipping) || user.addresses[0];
        const defaultIdx = user.addresses.indexOf(defaultAddr);
        setSelectedSavedAddressIndex(defaultIdx >= 0 ? defaultIdx : 0);
        setShippingAddress({
          id: defaultAddr.id || 'addr_checkout',
          fullName: defaultAddr.fullName || user.name || '',
          phone: defaultAddr.phone || user.phone || '',
          addressLine1: defaultAddr.addressLine1 || '',
          city: defaultAddr.city || 'Dubai',
          state: defaultAddr.state || defaultAddr.city || 'Dubai',
          country: defaultAddr.country || 'United Arab Emirates',
          postalCode: defaultAddr.postalCode || '',
        });
      } else {
        setShippingAddress(prev => ({
          ...prev,
          fullName: prev.fullName || user.name || '',
          phone: prev.phone || user.phone || '',
          addressLine1: prev.addressLine1 || '',
          city: prev.city || 'Dubai',
          state: prev.state || 'Dubai',
          country: 'United Arab Emirates',
        }));
      }
    }
  }, [user]);

  // Handle selecting a saved address
  const handleSelectSavedAddress = (index: number | 'custom') => {
    setSelectedSavedAddressIndex(index);
    if (index === 'custom') {
      return;
    }
    const addr = user?.addresses?.[index];
    if (addr) {
      setShippingAddress({
        id: addr.id || 'addr_checkout',
        fullName: addr.fullName || user?.name || '',
        phone: addr.phone || user?.phone || '',
        addressLine1: addr.addressLine1 || '',
        city: addr.city || 'Dubai',
        state: addr.state || addr.city || 'Dubai',
        country: addr.country || 'United Arab Emirates',
        postalCode: addr.postalCode || '',
      });
    }
  };



  // If cart is empty, redirect
  useEffect(() => {
    if (cartCount === 0 && !isSubmitting) {
      router.push('/cart');
    }
  }, [cartCount, isSubmitting, router]);



  const handleApplyCouponCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    setCouponLoading(true);
    try {
      const ok = await applyCoupon(couponInput.trim().toUpperCase());
      if (ok) {
        setCouponSuccess(`Coupon "${couponInput.trim().toUpperCase()}" applied!`);
        setCouponInput('');
      } else {
        setCouponError('Invalid or expired coupon code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCouponCode = () => {
    removeCoupon();
    setCouponSuccess('');
    setCouponError('');
  };

  // 1. Initiate order: Validate inputs and request email OTP code
  const handleInitiateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setOtpError('');

    try {
      if (!token) {
        setErrorMessage('Please sign in to complete your checkout.');
        router.push('/login');
        return;
      }

      if (cartItems.length === 0) {
        setErrorMessage('Your cart is empty. Please add items to checkout.');
        return;
      }

      if (!shippingAddress.fullName.trim()) {
        throw new Error('Consignee / Full Name is required.');
      }
      if (!shippingAddress.phone.trim()) {
        throw new Error('Contact phone number is required for courier delivery.');
      }
      if (!shippingAddress.addressLine1.trim()) {
        throw new Error('Street address and building/office location are required.');
      }

      setIsSubmitting(true);

      const res = await ApiClient.post<{
        success: boolean;
        maskedEmail: string;
        expiresAt: string;
        resendCooldownSeconds: number;
        devCode?: string;
      }>('/orders/request-otp', {
        total: cart.total,
        itemsCount: cartItems.length,
        currency: 'AED',
      }, { token });

      setOtpMaskedEmail(res.maskedEmail || user?.email || '');
      setOtpDevCode(res.devCode);
      setOtpCooldown(res.resendCooldownSeconds || 60);
      setIsOtpModalOpen(true);
    } catch (err: any) {
      console.error('Order verification initiation failed:', err);
      setErrorMessage(err.message || 'Failed to dispatch verification code. Please check your network or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Resend OTP code if expired or not received
  const handleResendOtp = async () => {
    setOtpError('');
    if (!token) return;

    try {
      const res = await ApiClient.post<{
        success: boolean;
        maskedEmail: string;
        expiresAt: string;
        resendCooldownSeconds: number;
        devCode?: string;
      }>('/orders/request-otp', {
        total: cart.total,
        itemsCount: cartItems.length,
        currency: 'AED',
      }, { token });

      setOtpMaskedEmail(res.maskedEmail || user?.email || '');
      setOtpDevCode(res.devCode);
      setOtpCooldown(res.resendCooldownSeconds || 60);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to resend code');
    }
  };

  // 3. Confirm OTP and finalize order creation
  const handleConfirmOtpAndPlaceOrder = async (otpCode: string) => {
    setOtpError('');
    setIsVerifyingOtp(true);

    try {
      const activeToken = token;
      if (!activeToken) throw new Error('Session expired. Please sign in again.');

      const orderPayload = {
        items: cartItems.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        shippingAddress,
        billingAddress: shippingAddress,
        paymentMethod,
        couponCode: cart.couponCode || activeCouponCode || undefined,
        notes: orderNotes || undefined,
        customerPhone: shippingAddress.phone,
        otpCode: otpCode.trim(),
      };

      const createdOrder = await ApiClient.post<Order>('/orders', orderPayload, { token: activeToken });
      clearCart();
      setIsOtpModalOpen(false);
      router.push(`/account/orders/${createdOrder.id}`);
    } catch (err: any) {
      console.error('Order confirmation failed:', err);
      const msg = err.message || 'Verification failed. Please check the code and try again.';
      setOtpError(msg);
      throw err;
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const finalPayable = cart.total;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Header & Breadcrumbs */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
          <Link href="/cart" className="hover:text-tech-blue dark:hover:text-tech-cyan transition-colors">
            Cart
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">Secure Checkout</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shadow-xs">
                <Lock className="w-5 h-5" />
              </span>
              <span>Enterprise Checkout &amp; Order Verification</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Verify your consignee destination, select an authoritative settlement method, and confirm hardware allocation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-tech-blue dark:text-tech-cyan">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>UAE FTA VAT 5% Compliant</span>
            </span>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Reassurance Trust Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/60 dark:from-slate-900/90 dark:via-blue-950/20 dark:to-slate-900/90 border border-blue-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-tech-blue text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/25">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Human-in-the-Loop Order Protection Gateway</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Pending to Approve Flow
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Your hardware stock is reserved immediately upon placement. Our executive desk validates logistics and warranty registration before dispatch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit SSL Encrypted</span>
          </span>
        </div>
      </div>

      <form onSubmit={handleInitiateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Delivery Address & Payment */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: DELIVERY & CONSIGNEE ADDRESS */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-tech-blue dark:text-tech-cyan flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>1. Delivery &amp; Consignee Address</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Insured courier delivery to commercial headquarters or personal residences across UAE.
                  </p>
                </div>
              </div>

              {/* Quick Saved Address Picker (if customer has profile addresses) */}
              {user?.addresses && user.addresses.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {user.addresses.map((addr, idx) => (
                    <button
                      key={addr.id || idx}
                      type="button"
                      onClick={() => handleSelectSavedAddress(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedSavedAddressIndex === idx
                          ? 'bg-tech-blue text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[140px]">{addr.city || `Address ${idx + 1}`}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectSavedAddress('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSavedAddressIndex === 'custom'
                        ? 'bg-tech-blue text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              )}
            </div>

            {/* Address Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Full Name / Consignee Entity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rashid Al-Maktoum or Corporate LLC"
                  value={shippingAddress.fullName}
                  onChange={e => {
                    setSelectedSavedAddressIndex('custom');
                    setShippingAddress({ ...shippingAddress, fullName: e.target.value });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+971 50 123 4567"
                  value={shippingAddress.phone}
                  onChange={e => {
                    setSelectedSavedAddressIndex('custom');
                    setShippingAddress({ ...shippingAddress, phone: e.target.value });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Street Address / Building / Suite <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Level 42, Al Saada Tower, DIFC Financial Centre"
                  value={shippingAddress.addressLine1}
                  onChange={e => {
                    setSelectedSavedAddressIndex('custom');
                    setShippingAddress({ ...shippingAddress, addressLine1: e.target.value });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  City / Emirate <span className="text-rose-500">*</span>
                </label>
                <select
                  value={shippingAddress.city}
                  onChange={e => {
                    setSelectedSavedAddressIndex('custom');
                    setShippingAddress({
                      ...shippingAddress,
                      city: e.target.value,
                      state: e.target.value
                    });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 focus:outline-none transition-all font-medium cursor-pointer"
                >
                  {UAE_EMIRATES.map(emirate => (
                    <option key={emirate} value={emirate} className="dark:bg-slate-900">
                      {emirate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  disabled
                  value="United Arab Emirates (UAE)"
                  className="w-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: PAYMENT METHOD */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  2. Select Settlement Method
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select payment gateway: Credit / Debit Card, Bank Wire Transfer, or Cash on Delivery.
                </p>
              </div>
            </div>

            {/* Payment Method Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Credit Card */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-tech-blue bg-blue-50/70 dark:bg-blue-950/40 text-slate-900 dark:text-white ring-2 ring-tech-blue/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'bg-tech-blue text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'CREDIT_CARD'}
                    onChange={() => setPaymentMethod('CREDIT_CARD')}
                    className="w-4 h-4 text-tech-blue cursor-pointer"
                  />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Credit / Debit Card</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Visa, Mastercard, AMEX
                  </div>
                  <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Instant Verification</span>
                  </div>
                </div>
              </label>

              {/* Bank Wire Transfer */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-tech-blue bg-blue-50/70 dark:bg-blue-950/40 text-slate-900 dark:text-white ring-2 ring-tech-blue/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    className="w-4 h-4 text-tech-blue cursor-pointer"
                  />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Bank Wire Transfer</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Corporate / IBAN transfer
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                    Invoice with FTA TRN
                  </div>
                </div>
              </label>

              {/* Cash On Delivery */}
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-tech-blue bg-blue-50/70 dark:bg-blue-950/40 text-slate-900 dark:text-white ring-2 ring-tech-blue/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${
                    paymentMethod === 'COD'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="w-4 h-4 text-tech-blue cursor-pointer"
                  />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Cash on Delivery (COD)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Pay upon arrival in UAE
                  </div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                    Courier terminal or cash
                  </div>
                </div>
              </label>
            </div>



            {/* Delivery Instructions */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Delivery Instructions &amp; Courier Logistics Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Fragile server hardware. Gate pass required at security. Please call 30 mins before arrival."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:bg-white dark:focus:bg-slate-900 focus:border-tech-blue focus:ring-2 focus:ring-tech-blue/20 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Right Sticky Checkout Summary */}
        <div className="lg:col-span-4 sticky top-24 space-y-5">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-5 shadow-md">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Itemized Invoice Summary
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Items mini list */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {cartItems.map(it => (
                <div
                  key={`${it.productId}_${it.variantId || 'base'}`}
                  className="p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={it.image || (it as any).thumbnail || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=100&q=80'}
                      alt=""
                      className="w-9 h-9 rounded-xl object-cover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {it.productName || 'Enterprise Hardware'}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-tech-blue dark:text-tech-cyan">Qty: {it.quantity}</span>
                        {it.variantTitle && (
                          <span>• {it.variantTitle}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="font-bold font-mono text-slate-900 dark:text-white text-xs shrink-0">
                    {formatPrice(
                      it.subtotal && it.subtotal > 0
                        ? it.subtotal
                        : (((it.salePrice && it.salePrice > 0) ? it.salePrice : (it.price || it.unitPrice || 0)) * (it.quantity || 1))
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Promo Box */}
            <div className="pt-2">
              {cart.couponCode || activeCouponCode ? (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon: {cart.couponCode || activeCouponCode} (-{formatPrice(cart.discount)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCouponCode}
                    className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                    title="Remove coupon"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Promo / Corporate Code"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono uppercase focus:outline-none focus:border-tech-blue placeholder:text-slate-400 placeholder:normal-case"
                    />
                    <button
                      type="button"
                      disabled={couponLoading || !couponInput.trim()}
                      onClick={handleApplyCouponCode}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <div className="text-[11px] text-rose-500 font-medium">{couponError}</div>
                  )}
                  {couponSuccess && (
                    <div className="text-[11px] text-emerald-600 font-medium">{couponSuccess}</div>
                  )}
                </div>
              )}
            </div>

            {/* Price Line-by-Line Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Hardware Subtotal:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{formatPrice(cart.subtotal)}</span>
              </div>

              {cart.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Promotional Discount:</span>
                  <span className="font-mono">-{formatPrice(cart.discount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Insured Courier Logistics:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {cart.shippingFee === 0 ? 'FREE' : formatPrice(cart.shippingFee)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span>UAE VAT (5%):</span>
                  <span className="text-[10px] text-slate-400 font-normal">FTA Standard</span>
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{formatPrice(cart.tax)}</span>
              </div>


            </div>

            {/* Total Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-baseline justify-between shadow-inner">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Final Amount to Pay
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatPrice(finalPayable)}
                </div>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 text-right">
                All taxes included
              </span>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-tech-blue via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Secure Verification Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm &amp; Place Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* OTP Security Notice */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <Mail className="w-3.5 h-3.5 text-tech-blue shrink-0" />
              <span>A 6-digit confirmation code will be emailed to finalize your order</span>
            </div>

            {/* Trust Features Badges */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Genuine Hardware</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>UAE FTA Tax Invoice</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Insured GCC Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>14-Day Enterprise RMA</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Email OTP Order Verification Modal */}
      <OrderOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onConfirm={handleConfirmOtpAndPlaceOrder}
        onResendOtp={handleResendOtp}
        maskedEmail={otpMaskedEmail}
        orderTotalFormatted={formatPrice(finalPayable)}
        itemsCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
        initialCooldownSeconds={otpCooldown}
        devCode={otpDevCode}
        isSubmitting={isVerifyingOtp}
        errorMessage={otpError}
      />
    </div>
  );
}
