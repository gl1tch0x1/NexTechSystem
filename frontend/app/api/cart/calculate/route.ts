import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_PRODUCTS } from '@/lib/fallback-data';

function isBurDubaiAddress(address?: { addressLine1?: string; city?: string; state?: string; postalCode?: string } | null): boolean {
  if (!address) return false;
  const combined = `${address.addressLine1 || ''} ${address.city || ''} ${address.state || ''} ${address.postalCode || ''}`.toLowerCase();
  const burDubaiPatterns = [
    /\bbur\s*dubai\b/i,
    /\bal\s*mankhool\b/i,
    /\bal\s*karama\b/i,
    /\bal\s*fahidi\b/i,
    /\bmeena\s*bazaar\b/i,
    /\bal\s*raffa\b/i,
    /\boud\s*metha\b/i,
    /\bal\s*souq\s*al\s*kabeer\b/i,
    /\bal\s*hudaiba\b/i,
    /\bal\s*jafiliya\b/i,
    /\bza'abeel\b/i,
    /\bzaabeel\b/i,
  ];
  return burDubaiPatterns.some(pattern => pattern.test(combined));
}

export async function POST(request: NextRequest) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  const body = await request.json().catch(() => ({}));
  const { items = [], couponCode, requestedWalletDeduction = 0, paymentMethod, shippingAddress } = body;

  // 1. Forward to backend service if available
  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const authHeader = request.headers.get('authorization');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${clean}/api/cart/calculate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data.items) && json.data.items.length > 0) {
          return NextResponse.json(json, { status: res.status });
        }
      }
    } catch {
      // Fall through to resilient fallback calculation
    }
  }

  // 2. Resilient fallback calculation
  let subtotal = 0;
  let taxableItemsSubtotal = 0;

  const calculatedItems = (items as any[]).map(item => {
    const prod =
      FALLBACK_PRODUCTS.find(p => p.id === item.productId || p.slug === item.productId) ||
      item.product;

    let effectivePrice = prod?.price ?? item.price ?? item.unitPrice ?? 0;
    let effectiveSalePrice =
      prod?.salePrice ?? prod?.price ?? item.salePrice ?? item.price ?? item.unitPrice ?? 0;
    let effectiveSku = prod?.sku || item.sku || '';
    let effectiveTitle = prod?.name || prod?.title || item.productName || item.title || 'Hardware Product';
    let effectiveImage =
      prod?.thumbnail ||
      prod?.images?.[0] ||
      item.image ||
      'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=200&q=80';
    let variantTitle = item.variantTitle;
    let variantOptions = item.options;

    if (item.variantId && prod?.variants && prod.variants.length > 0) {
      const variant = prod.variants.find((v: any) => v.id === item.variantId);
      if (variant) {
        effectivePrice = variant.price;
        effectiveSalePrice = variant.salePrice || variant.price;
        effectiveSku = variant.sku || effectiveSku;
        effectiveTitle = `${prod.name || prod.title} - ${variant.title}`;
        variantTitle = variant.title;
        variantOptions = variant.options;
        if (variant.image) effectiveImage = variant.image;
      }
    }

    const unitPrice = effectiveSalePrice > 0 ? effectiveSalePrice : effectivePrice;
    const qty = Number(item.quantity) || 1;
    const itemTotal = unitPrice * qty;
    subtotal += itemTotal;

    const isTaxable = prod?.chargeTax !== false;
    if (isTaxable) {
      taxableItemsSubtotal += itemTotal;
    }

    return {
      productId: item.productId,
      productName: effectiveTitle,
      variantId: item.variantId,
      variantTitle,
      options: variantOptions,
      sku: effectiveSku,
      slug: prod?.slug || item.slug || item.productId,
      image: effectiveImage,
      quantity: qty,
      price: effectivePrice,
      salePrice: effectiveSalePrice,
      chargeTax: isTaxable,
      sellerType: prod?.sellerType || item?.sellerType || 'ADMIN',
      resellerId: prod?.resellerId || item?.resellerId,
      resellerCode: prod?.resellerCode || item?.resellerCode,
      subtotal: itemTotal,
      stockAvailable: prod?.stock ?? 50,
      unitPrice,
      totalPrice: itemTotal,
      product: prod,
    };
  });

  let couponDiscount = 0;
  if (couponCode && String(couponCode).toUpperCase() === 'TECH10') {
    couponDiscount = Math.round(subtotal * 0.1 * 100) / 100;
  }

  // In-Store discount: 5% guaranteed instant discount on subtotal (up to 10% in-store)
  let inStoreDiscountRate = 0;
  let inStoreDiscount = 0;
  if (paymentMethod === 'IN_STORE') {
    inStoreDiscountRate = 5;
    inStoreDiscount = Math.round((subtotal * (inStoreDiscountRate / 100)) * 100) / 100;
  }

  let paymentSurchargeRate = 0;
  if (paymentMethod === 'TABBY' || paymentMethod === 'TAMARA') {
    paymentSurchargeRate = 8;
  } else if (paymentMethod === 'CREDIT_CARD') {
    paymentSurchargeRate = 3;
  }

  const paymentSurcharge = paymentSurchargeRate > 0
    ? Math.round((subtotal * (paymentSurchargeRate / 100)) * 100) / 100
    : 0;

  let codFee = 0;
  if (paymentMethod === 'COD') {
    const isInsideBurDubai = isBurDubaiAddress(shippingAddress);
    if (!isInsideBurDubai) {
      codFee = 25;
    }
  }

  const totalDiscount = Math.round((couponDiscount + inStoreDiscount) * 100) / 100;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const tax = Math.round(taxableAmount * 0.05 * 100) / 100; // UAE FTA 5% VAT
  const shippingFee = paymentMethod === 'IN_STORE' ? 0 : (subtotal > 500 ? 0 : 35);
  const totalBeforeWallet = taxableAmount + tax + shippingFee + paymentSurcharge + codFee;
  const walletAmountUsed = Math.min(Number(requestedWalletDeduction) || 0, totalBeforeWallet);
  const total = Math.max(0, totalBeforeWallet - walletAmountUsed);

  return NextResponse.json({
    success: true,
    data: {
      items: calculatedItems,
      subtotal,
      discount: totalDiscount,
      couponDiscount,
      inStoreDiscount,
      inStoreDiscountRate,
      tax,
      taxRate: 5,
      shippingFee,
      paymentSurcharge,
      paymentSurchargeRate,
      codFee,
      walletAmountUsed,
      total,
      currency: 'AED',
    },
  });
}
