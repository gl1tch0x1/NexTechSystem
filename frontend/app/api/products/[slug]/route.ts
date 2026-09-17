import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_PRODUCTS } from '@/lib/fallback-data';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  // Validate slug format to prevent SSRF and path traversal
  if (!slug || typeof slug !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(slug)) {
    return NextResponse.json(
      { success: false, message: 'Invalid product identifier' },
      { status: 400 }
    );
  }

  const encodedSlug = encodeURIComponent(slug);

  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  // 1. Try external backend if configured
  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const remoteUrl = new URL(`${clean}/api/products/${encodedSlug}`);
      const res = await fetch(remoteUrl.toString(), {
        signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return NextResponse.json(json);
      }
    } catch {
      // Fall through to resilient local dataset
    }
  }

  // 2. Try local server if on localhost
  if (!backendUrl || backendUrl.includes('localhost')) {
    try {
      const localUrl = new URL(`http://localhost:5000/api/products/${encodedSlug}`);
      const res = await fetch(localUrl.toString(), {
        signal: AbortSignal.timeout(1500),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return NextResponse.json(json);
      }
    } catch {
      // Fall through
    }
  }

  // 3. Resilient Local / Vercel Serverless Fallback
  const cleanSlug = slug.toLowerCase();
  const product = FALLBACK_PRODUCTS.find(p => p.slug.toLowerCase() === cleanSlug || p.id === slug);

  if (product) {
    const relatedProducts = FALLBACK_PRODUCTS.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
    return NextResponse.json({
      success: true,
      data: {
        product,
        reviews: [],
        relatedProducts,
      },
    });
  }

  return NextResponse.json(
    { success: false, message: 'Product not found in catalog' },
    { status: 404 }
  );
}
