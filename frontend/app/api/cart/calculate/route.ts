import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_PRODUCTS } from '@/lib/fallback-data';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const body = await request.json().catch(() => ({}));
  const { items = [], couponCode, requestedWalletDeduction = 0 } = body;

  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/cart/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  if (process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://localhost:5000/api/cart/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1500),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  let subtotal = 0;
  const calculatedItems = (items as any[]).map(item => {
    const prod = FALLBACK_PRODUCTS.find(p => p.id === item.productId || p.slug === item.productId);
    const unitPrice = prod ? (prod.salePrice || prod.price) : (item.price || 0);
    const qty = Number(item.quantity) || 1;
    const itemTotal = unitPrice * qty;
    subtotal += itemTotal;
    return {
      ...item,
      product: prod || item.product,
      unitPrice,
      totalPrice: itemTotal,
    };
  });

  let couponDiscount = 0;
  if (couponCode && String(couponCode).toUpperCase() === 'TECH10') {
    couponDiscount = Math.round((subtotal * 0.1) * 100) / 100;
  }

  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const tax = Math.round((taxableAmount * 0.05) * 100) / 100; // UAE FTA 5% VAT
  const shippingFee = subtotal > 500 ? 0 : 35;
  const totalBeforeWallet = taxableAmount + tax + shippingFee;
  const walletAmountUsed = Math.min(Number(requestedWalletDeduction) || 0, totalBeforeWallet);
  const total = Math.max(0, totalBeforeWallet - walletAmountUsed);

  return NextResponse.json({
    success: true,
    data: {
      items: calculatedItems,
      subtotal,
      discount: 0,
      couponDiscount,
      tax,
      taxRate: 5,
      shippingFee,
      walletAmountUsed,
      total,
      currency: 'AED',
    },
  });
}
