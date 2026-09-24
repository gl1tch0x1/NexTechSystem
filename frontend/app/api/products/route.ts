import { NextRequest, NextResponse } from 'next/server';
import { FALLBACK_PRODUCTS } from '@/lib/fallback-data';

function getSafeProductSearchParams(incomingParams: URLSearchParams): URLSearchParams {
  const safeParams = new URLSearchParams();

  // 1. Text filters: strictly limit length and character set
  const textKeys = ['category', 'categorySlug', 'brand', 'brandSlug', 'sort', 'sellerType', 'location'];
  for (const key of textKeys) {
    const val = incomingParams.get(key);
    if (val && /^[a-zA-Z0-9\-_]{1,64}$/.test(val)) {
      safeParams.set(key, val.trim());
    }
  }

  // Search keywords: allow letters, digits, spaces, and safe punctuation (max 100 chars)
  const searchVal = incomingParams.get('search');
  if (searchVal && /^[a-zA-Z0-9\s\-_.,+]{1,100}$/.test(searchVal)) {
    safeParams.set('search', searchVal.trim());
  }

  // 2. Boolean flags: strictly allow only 'true' or 'false'
  const boolKeys = ['inStock', 'isFeatured', 'onSale'];
  for (const key of boolKeys) {
    const val = incomingParams.get(key);
    if (val === 'true' || val === 'false') {
      safeParams.set(key, val);
    }
  }

  // 3. Positive integer pagination
  const page = parseInt(incomingParams.get('page') || '', 10);
  if (!isNaN(page) && page > 0 && page <= 10000) {
    safeParams.set('page', String(page));
  }

  const limit = parseInt(incomingParams.get('limit') || '', 10);
  if (!isNaN(limit) && limit > 0 && limit <= 100) {
    safeParams.set('limit', String(limit));
  }

  // 4. Bounded numeric filters
  const minPrice = parseFloat(incomingParams.get('minPrice') || '');
  if (!isNaN(minPrice) && minPrice >= 0 && minPrice <= 1000000) {
    safeParams.set('minPrice', String(minPrice));
  }

  const maxPrice = parseFloat(incomingParams.get('maxPrice') || '');
  if (!isNaN(maxPrice) && maxPrice >= 0 && maxPrice <= 1000000) {
    safeParams.set('maxPrice', String(maxPrice));
  }

  const minRating = parseFloat(incomingParams.get('minRating') || '');
  if (!isNaN(minRating) && minRating >= 0 && minRating <= 5) {
    safeParams.set('minRating', String(minRating));
  }

  return safeParams;
}

export async function GET(request: NextRequest) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  const url = new URL(request.url);
  const { searchParams } = url;
  const safeParams = getSafeProductSearchParams(searchParams);
  const safeQuery = safeParams.toString();

  // If a valid external remote backend is configured, attempt to query it
  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const remoteTarget = new URL(`${clean}/api/products`);
      if (safeQuery) {
        remoteTarget.search = safeQuery;
      }
      const res = await fetch(remoteTarget.toString(), {
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
      const localTarget = new URL('http://localhost:5000/api/products');
      if (safeQuery) {
        localTarget.search = safeQuery;
      }
      const res = await fetch(localTarget.toString(), {
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
