import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getCatalogProductBySlug } from '@/lib/catalog-service';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  try {
    const upstreamRes = await proxyToBackend(request, `/admin/products/${path.join('/')}`);
    if (upstreamRes.ok) {
      return upstreamRes;
    }
  } catch {
    // Upstream offline
  }

  // Fallback for single product detail lookup
  if (path.length === 1) {
    const fallbackProd = getCatalogProductBySlug(path[0]);
    if (fallbackProd) {
      return Response.json({
        success: true,
        data: fallbackProd,
        source: 'authoritative_catalog_fallback',
      });
    }
  }

  return Response.json(
    { success: false, error: { message: 'Product not found in catalog.' } },
    { status: 404 }
  );
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToBackend(request, `/admin/products/${path.join('/')}`);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToBackend(request, `/admin/products/${path.join('/')}`);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToBackend(request, `/admin/products/${path.join('/')}`);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToBackend(request, `/admin/products/${path.join('/')}`);
}
