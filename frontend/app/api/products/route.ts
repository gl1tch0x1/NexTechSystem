import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { filterCatalogProducts } from '@/lib/catalog-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const upstreamRes = await proxyToBackend(request, '/products');
    if (upstreamRes.ok) {
      const cloned = upstreamRes.clone();
      try {
        const json = await cloned.json();
        // If upstream backend returned valid catalog data, serve it directly
        if (json && Array.isArray(json.data) && (json.data.length > 0 || (json.meta?.total !== undefined && json.meta.total > 0))) {
          return upstreamRes;
        }
      } catch {
        // Fall back to local verified catalog
      }
    }
  } catch {
    // Upstream unavailable, seamlessly serve from verified authoritative catalog
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
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
