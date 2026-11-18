import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getCatalogProductBySlug, getAllCatalogProducts } from '@/lib/catalog-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  try {
    const upstreamRes = await proxyToBackend(request, `/products/${encodeURIComponent(slug)}`);
    if (upstreamRes.ok) {
      const cloned = upstreamRes.clone();
      try {
        const json = await cloned.json();
        if (json && json.success && json.data && json.data.product) {
          return Response.json(json, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
          });
        }
      } catch {
        // Fall back to authoritative catalog
      }
    }
  } catch {
    // Upstream unavailable
  }

  // Fallback to verified catalog
  const product = getCatalogProductBySlug(slug);
  if (!product) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Hardware SKU not found' } },
      { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }

  const all = getAllCatalogProducts();
  const relatedProducts = all
    .filter(p => p.id !== product.id && (p.categoryId === product.categoryId || p.brandId === product.brandId))
    .slice(0, 4);

  return NextResponse.json(
    {
      success: true,
      data: {
        product,
        reviews: [],
        relatedProducts,
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
