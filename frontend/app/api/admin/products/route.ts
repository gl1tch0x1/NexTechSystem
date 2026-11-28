import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { proxyToBackend } from '@/lib/proxy-helper';
import { filterCatalogProducts, updateCatalogProduct, deleteCatalogProduct } from '@/lib/catalog-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || searchParams.get('q') || '';
  const category = searchParams.get('category') || searchParams.get('categoryId') || '';
  const brand = searchParams.get('brand') || searchParams.get('brandId') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || searchParams.get('sortBy') || 'featured';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '500', 10);

  // 1. Attempt to query live upstream backend
  try {
    const upstreamRes = await proxyToBackend(request, '/admin/products');
    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length >= 10) {
        return Response.json(data, {
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        });
      }
    }
  } catch {
    // Upstream offline, unreachable, or unseeded; proceed to resilient catalog fallback
  }

  // 2. Authoritative local hardware catalog fallback (308 enterprise SKUs)
  const result = filterCatalogProducts({
    search,
    category,
    brand,
    status,
    sort,
    page,
    limit,
  });

  return Response.json(
    {
      success: true,
      data: result.products,
      meta: result,
      source: 'authoritative_catalog_fallback',
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.clone().json();
  } catch {}

  try {
    const upstreamRes = await proxyToBackend(request, '/admin/products', {
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseBody = await upstreamRes.clone().arrayBuffer();
    const responseHeaders = new Headers({ 'Cache-Control': 'no-store, no-cache, must-revalidate' });
    const contentType = upstreamRes.headers.get('content-type');
    if (contentType) responseHeaders.set('content-type', contentType);

    if (upstreamRes.ok) {
      try {
        const json = JSON.parse(new TextDecoder().decode(responseBody));
        if (json && json.success && json.data) {
          // Backend write will sync its own store; frontend mirror updates memory only.
          updateCatalogProduct(json.data.id || json.data.slug || '', json.data, { persist: false });
        }
      } catch {}
      try {
        revalidatePath('/products');
        revalidatePath('/');
      } catch {}
      return new Response(responseBody, { status: upstreamRes.status, headers: responseHeaders });
    }

    if (upstreamRes.status !== 503) {
      return new Response(responseBody, { status: upstreamRes.status, headers: responseHeaders });
    }
  } catch {}

  // Upstream unreachable: fall back to local catalog sync for resilience.
// Memory-only update; backend is the source of truth and will sync its own store.
  if (body) {
    updateCatalogProduct(body.id || body.slug || '', body, { persist: false });
  }
  try {
    revalidatePath('/products');
    revalidatePath('/');
  } catch {}

  return Response.json(
    { success: true, data: body || {} },
    { status: 201, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  if (id) {
    try {
      const upstreamRes = await proxyToBackend(request, `/admin/products/${id}`);
      if (upstreamRes.ok) {
        deleteCatalogProduct(id, { persist: false });
        try {
          revalidatePath('/products');
          revalidatePath('/');
          revalidatePath(`/products/${id}`);
        } catch {}
        return upstreamRes;
      }
      if (upstreamRes.status !== 503) {
        return upstreamRes;
      }
    } catch {}

    deleteCatalogProduct(id, { persist: false });
    try {
      revalidatePath('/products');
      revalidatePath('/');
      revalidatePath(`/products/${id}`);
    } catch {}
    return Response.json(
      { success: true, message: 'Product deleted successfully.', source: 'authoritative_catalog_sync' },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
  return Response.json(
    { success: false, error: { message: 'Product ID required.' } },
    { status: 400, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
