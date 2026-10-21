import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const subpath = path.join('/');

  if (subpath === 'my') {
    return proxyToBackend(request, `/orders/${subpath}`, { fallbackData: [] });
  }

  return proxyToBackend(request, `/orders/${subpath}`);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToBackend(request, `/orders/${path.join('/')}`);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToBackend(request, `/orders/${path.join('/')}`);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToBackend(request, `/orders/${path.join('/')}`);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToBackend(request, `/orders/${path.join('/')}`);
}
