import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { filterCatalogProducts, updateCatalogProduct } from '@/lib/catalog-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  let upstreamItems: any[] = [];

  try {
    const upstreamRes = await proxyToBackend(request, '/products');
    if (upstreamRes.ok) {
      const cloned = upstreamRes.clone();
      try {
        const json = await cloned.json();
        // If upstream backend returned comprehensive catalog data (>= 20 items), serve it directly
        if (json && Array.isArray(json.data) && (json.data.length >= 20 || (json.meta?.total !== undefined && json.meta.total >= 20))) {
          return Response.json(json, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
          });
        }
        // If upstream returned partial items (e.g. user-created products on remote backend), capture them
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          upstreamItems = json.data;
        }
      } catch {
        // Fall back to local verified catalog
      }
    }
  } catch {
    // Upstream unavailable, seamlessly serve from verified authoritative catalog
  }

  // If upstream contained user-created items from remote production, synchronize them into memory store
  if (upstreamItems.length > 0) {
    for (const item of upstreamItems) {
      if (item && item.id) {
        updateCatalogProduct(item.id, item);
      }
    }
  }

  // Parse search params for resilient catalog filtering
  const { searchParams } = new URL(request.url);
  const options = {
    category: searchParams.get('category') || undefined,
    subCategory: searchParams.get('subCategory') || searchParams.get('subType') || undefined,
    brand: searchParams.get('brand') || undefined,
    search: searchParams.get('search') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    inStock: searchParams.get('inStock') || undefined,
    onSale: searchParams.get('onSale') || undefined,
    sellerType: searchParams.get('sellerType') || undefined,
    featured: searchParams.get('featured') || undefined,
    sort: searchParams.get('sort') || searchParams.get('sortBy') || undefined,
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || '10',
  };

  const result = filterCatalogProducts(options);

  return NextResponse.json(
    {
      success: true,
      data: result.products,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        facets: result.facets,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}
