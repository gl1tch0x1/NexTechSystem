import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(request, `/admin/categories/${id}`);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(request, `/admin/categories/${id}`);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(request, `/admin/categories/${id}`);
}
