import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return proxyToBackend(request, `/admin/quotes/${encodeURIComponent(id)}/convert`);
}
