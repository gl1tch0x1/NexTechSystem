import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyToBackend(request, `/admin/purchase-orders/${encodeURIComponent(id)}`);
}
export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return proxyToBackend(request, `/admin/purchase-orders/${encodeURIComponent(id)}`);
}
