import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { FALLBACK_ORDERS } from '@/lib/fallback-data';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const subpath = path.join('/');

  // If fetching my orders or a specific order and backend is offline, provide fallback
  let fallbackData: any = undefined;
  if (subpath === 'my') {
    fallbackData = FALLBACK_ORDERS;
  } else if (path.length === 1 && path[0] && !path[0].includes('otp')) {
    const orderId = path[0];
    fallbackData = FALLBACK_ORDERS.find(o => o.id === orderId || o.orderNumber === orderId) || FALLBACK_ORDERS[0];
  }

  return proxyToBackend(request, `/orders/${subpath}`, { fallbackData });
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
