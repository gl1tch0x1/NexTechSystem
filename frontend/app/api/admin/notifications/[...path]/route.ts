import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const subpath = path.join('/');
  return proxyToBackend(request, `/admin/notifications/${subpath}`, {
    fallbackData: { success: true },
  });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const subpath = path.join('/');
  return proxyToBackend(request, `/admin/notifications/${subpath}`, {
    fallbackData: { success: true },
  });
}
