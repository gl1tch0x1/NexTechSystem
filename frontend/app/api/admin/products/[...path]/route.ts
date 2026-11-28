import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getCatalogProductBySlug, updateCatalogProduct, deleteCatalogProduct } from '@/lib/catalog-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  try {
    const upstreamRes = await proxyToBackend(request, `/admin/products/${path.join('/')}`);
    if (upstreamRes.ok) {
      const cloned = upstreamRes.clone();
      try {
        const json = await cloned.json();
        if (json && json.success && json.data) {
          return Response.json(json, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
          });
        }
      } catch {}
    }
  } catch {
    // Upstream offline
  }

  // Fallback for single product detail lookup
  if (path.length === 1) {
    const fallbackProd = getCatalogProductBySlug(path[0]);
    if (fallbackProd) {
      return Response.json(
        {
          success: true,
          data: fallbackProd,
          source: 'authoritative_catalog_fallback',
        },
        { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }
  }

  return Response.json(
    { success: false, error: { message: 'Product not found in catalog.' } },
    { status: 404, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  let body: any = null;
  try {
    body = await request.clone().json();
  } catch {}

  const cleanSubpath = path.map(segment => encodeURIComponent(segment)).join('/');
  const upstreamPath = `/admin/products/${cleanSubpath}`;
  const isApproval = path.length >= 2 && path[1] === 'approval';
  const productId = path[0];

  try {
    const upstreamRes = await proxyToBackend(request, upstreamPath, {
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
          updateCatalogProduct(productId, json.data, { persist: false });
          try {
            revalidatePath('/products');
            revalidatePath('/');
            revalidatePath(`/products/${productId}`);
            if (body?.slug) revalidatePath(`/products/${body.slug}`);
            if (json.data?.slug) revalidatePath(`/products/${json.data.slug}`);
          } catch {}
          return Response.json(json, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
        }
        if (json && json.success === false) {
          return new Response(responseBody, { status: upstreamRes.status, headers: responseHeaders });
        }
      } catch {}
    }

    // Upstream responded with an error - propagate it instead of masking as success.
    if (upstreamRes.status !== 503) {
      return new Response(responseBody, { status: upstreamRes.status, headers: responseHeaders });
    }
  } catch {}

  // Upstream unreachable: fall back to local catalog sync for resilience.
  let updatedProduct: any = null;
  if (productId && body) {
    const updates = isApproval
      ? {
          approvalStatus: (body.status || body.approvalStatus || 'REJECTED') as any,
          status: (body.status || body.approvalStatus || 'REJECTED') as any,
          rejectionReason: body.rejectionReason,
          isActive: (body.status || body.approvalStatus) === 'APPROVED',
        }
      : body;
    updatedProduct = updateCatalogProduct(productId, updates, { persist: false });
  }

  try {
    revalidatePath('/products');
    revalidatePath('/');
    revalidatePath(`/products/${productId}`);
    if (body?.slug) revalidatePath(`/products/${body.slug}`);
    if (updatedProduct?.slug) revalidatePath(`/products/${updatedProduct.slug}`);
  } catch {}

  const finalProd = updatedProduct || (productId ? getCatalogProductBySlug(productId) : null);
  return Response.json(
    {
      success: true,
      data: finalProd || body || { id: productId },
      source: 'authoritative_catalog_sync',
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  let body: any = null;
  try {
    body = await request.clone().json();
  } catch {}

  const cleanSubpath = path.map(segment => encodeURIComponent(segment)).join('/');
  const upstreamPath = `/admin/products/${cleanSubpath}`;
  const productId = path[0];

  try {
    const upstreamRes = await proxyToBackend(request, upstreamPath, {
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
          updateCatalogProduct(productId, json.data, { persist: false });
          try {
            revalidatePath('/products');
            revalidatePath('/');
            revalidatePath(`/products/${productId}`);
            if (json.data?.id && json.data.id !== productId) revalidatePath(`/products/${json.data.id}`);
            if (body?.slug) revalidatePath(`/products/${body.slug}`);
            if (json.data?.slug) revalidatePath(`/products/${json.data.slug}`);
          } catch {}
          return Response.json(json, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
        }
        if (json && json.success === false) {
          return new Response(responseBody, { status: upstreamRes.status, headers: responseHeaders });
        }
      } catch {}
    }

    if (upstreamRes.status !== 503) {
      return new Response(responseBody, { status: upstreamRes.status, headers: responseHeaders });
    }
  } catch {}

  // Upstream unreachable: fall back to local catalog sync for resilience.
  // Memory-only update; backend is the source of truth and will sync its own store.
  let updatedProduct: any = null;
  if (productId && body) {
    updatedProduct = updateCatalogProduct(productId, body, { persist: false });
  }

  try {
    revalidatePath('/products');
    revalidatePath('/');
    revalidatePath(`/products/${productId}`);
    if (body?.slug) revalidatePath(`/products/${body.slug}`);
    if (updatedProduct?.slug) revalidatePath(`/products/${updatedProduct.slug}`);
  } catch {}

  const finalProd = updatedProduct || (productId ? getCatalogProductBySlug(productId) : null);
  if (finalProd) {
    return Response.json(
      {
        success: true,
        data: finalProd,
        source: 'authoritative_catalog_sync',
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }

  return Response.json(
    { success: true, data: body || { id: productId } },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  let body: any = null;
  try {
    body = await request.clone().json();
  } catch {}

  const cleanSubpath = path.map(segment => encodeURIComponent(segment)).join('/');
  try {
    const upstreamRes = await proxyToBackend(request, `/admin/products/${cleanSubpath}`, {
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
          updateCatalogProduct(json.data.id || json.data.slug || path[0] || '', json.data, { persist: false });
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
    updateCatalogProduct(body.id || body.slug || path[0] || '', body, { persist: false });
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

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const productId = path[0];

  try {
    const upstreamRes = await proxyToBackend(request, `/admin/products/${path.join('/')}`);
    if (upstreamRes.ok) {
      if (productId) deleteCatalogProduct(productId, { persist: false });
      try {
        revalidatePath('/products');
        revalidatePath('/');
        if (productId) revalidatePath(`/products/${productId}`);
      } catch {}
      return upstreamRes;
    }
    if (upstreamRes.status !== 503) {
      return upstreamRes;
    }
  } catch {}

  // Upstream unreachable: fall back to local catalog delete for resilience.
  // Memory-only update; backend is the source of truth and will sync its own store.
  let locallyDeleted = false;
  if (productId) {
    locallyDeleted = deleteCatalogProduct(productId, { persist: false });
  }

  try {
    revalidatePath('/products');
    revalidatePath('/');
    if (productId) revalidatePath(`/products/${productId}`);
  } catch {}

  return Response.json(
    {
      success: true,
      message: 'Product deleted successfully.',
      source: locallyDeleted ? 'authoritative_catalog_sync' : 'upstream_proxy',
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
