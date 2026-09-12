import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_PRODUCTS } from '@/lib/fallback-data';

export async function GET(request: NextRequest) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  const url = new URL(request.url);
  const { searchParams } = url;

  // If a valid external remote backend is configured, attempt to query it
  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/products${url.search}`, {
        signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch (err: any) {
      console.warn('[API Proxy] Remote backend unreachable, serving local dataset:', err.message);
    }
  }

  // Also try local node server if running on localhost
  if (!backendUrl || backendUrl.includes('localhost')) {
    try {
      const res = await fetch(`http://localhost:5000/api/products${url.search}`, {
        signal: AbortSignal.timeout(1500),
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Gracefully fall through to resilient local dataset
    }
  }

  // Resilient Local / Standalone / Vercel Serverless Fallback
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase();
  const brand = searchParams.get('brand');
  const inStock = searchParams.get('inStock');
  const isFeatured = searchParams.get('isFeatured');
  const sort = searchParams.get('sort');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  let filtered = [...FALLBACK_PRODUCTS];

  if (category) {
    filtered = filtered.filter(p => p.categoryId === category || p.categoryName?.toLowerCase().includes(category.toLowerCase()));
  }
  if (brand) {
    filtered = filtered.filter(p => p.brandId === brand || p.brandName?.toLowerCase().includes(brand.toLowerCase()));
  }
  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      p.tags?.some(t => t.toLowerCase().includes(search))
    );
  }
  if (inStock === 'true') {
    filtered = filtered.filter(p => p.stock > 0);
  }
  if (isFeatured === 'true') {
    filtered = filtered.filter(p => p.isFeatured);
  }

  if (sort === 'price_asc') {
    filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
  } else if (sort === 'price_desc') {
    filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
  } else if (sort === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    success: true,
    data: paginated,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
