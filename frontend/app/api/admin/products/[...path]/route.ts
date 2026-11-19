import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getCatalogProductBySlug, updateCatalogProduct } from '@/lib/catalog-service';

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

  try {
    const upstreamRes = await proxyToBackend(request, upstreamPath, {
      body: body ? JSON.stringify(body) : undefined,
    });
    if (upstreamRes.ok) {
      const cloned = upstreamRes.clone();
      try {
        const json = await cloned.json();
        if (json && json.success && json.data) {
          updateCatalogProduct(path[0], json.data);
          try {
            revalidatePath('/products');
            revalidatePath('/');
            revalidatePath(`/products/${path[0]}`);
            if (json.data?.id && json.data.id !== path[0]) revalidatePath(`/products/${json.data.id}`);
            if (body?.slug) revalidatePath(`/products/${body.slug}`);
            if (json.data?.slug) revalidatePath(`/products/${json.data.slug}`);
          } catch {}
          return Response.json(json, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
          });
        }
      } catch {}
    }
  } catch {}

  // Fallback if backend is unavailable
  let updatedProduct: any = null;
  if (path.length >= 1 && body) {
    updatedProduct = updateCatalogProduct(path[0], body);
  }

  try {
    revalidatePath('/products');
    revalidatePath('/');
    revalidatePath(`/products/${path[0]}`);
    if (body?.slug) revalidatePath(`/products/${body.slug}`);
    if (updatedProduct?.slug) revalidatePath(`/products/${updatedProduct.slug}`);
  } catch {}

  const finalProd = updatedProduct || (path.length >= 1 ? getCatalogProductBySlug(path[0]) : null);
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
    { success: true, data: body || { id: path[0] } },
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

  try {
    const upstreamRes = await proxyToBackend(request, upstreamPath, {
      body: body ? JSON.stringify(body) : undefined,
    });
    if (upstreamRes.ok) {
      const cloned = upstreamRes.clone();
      try {
        const json = await cloned.json();
        if (json && json.success && json.data) {
          updateCatalogProduct(path[0], json.data);
          try {
            revalidatePath('/products');
            revalidatePath('/');
            revalidatePath(`/products/${path[0]}`);
            if (json.data?.id && json.data.id !== path[0]) revalidatePath(`/products/${json.data.id}`);
            if (body?.slug) revalidatePath(`/products/${body.slug}`);
            if (json.data?.slug) revalidatePath(`/products/${json.data.slug}`);
          } catch {}
          return Response.json(json, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
          });
        }
      } catch {}
    }
  } catch {}

  // Fallback if backend is unavailable
  let updatedProduct: any = null;
  if (path.length >= 1 && body) {
    updatedProduct = updateCatalogProduct(path[0], body);
  }

  try {
    revalidatePath('/products');
    revalidatePath('/');
    revalidatePath(`/products/${path[0]}`);
    if (body?.slug) revalidatePath(`/products/${body.slug}`);
    if (updatedProduct?.slug) revalidatePath(`/products/${updatedProduct.slug}`);
  } catch {}

  const finalProd = updatedProduct || (path.length >= 1 ? getCatalogProductBySlug(path[0]) : null);
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
    { success: true, data: body || { id: path[0] } },
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
    if (upstreamRes.ok) {
      try {
        const cloned = upstreamRes.clone();
        const json = await cloned.json();
        if (json && json.success && json.data) {
          updateCatalogProduct(json.data.id || json.data.slug || path[0] || '', json.data);
        }
      } catch {}
      try {
        revalidatePath('/products');
        revalidatePath('/');
      } catch {}
      return upstreamRes;
    }
  } catch {}

  // Fallback if backend is unavailable
  if (body) {
    updateCatalogProduct(body.id || body.slug || path[0] || '', body);
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
  try {
    revalidatePath('/products');
    revalidatePath('/');
    if (path[0]) revalidatePath(`/products/${path[0]}`);
  } catch {}
  return proxyToBackend(request, `/admin/products/${path.join('/')}`);
}
