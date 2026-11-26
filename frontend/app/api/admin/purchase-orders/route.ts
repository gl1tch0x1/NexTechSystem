import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest): Promise<Response> {
  return proxyToBackend(request, '/admin/purchase-orders');
}

export async function POST(request: NextRequest): Promise<Response> {
  return proxyToBackend(request, '/admin/purchase-orders');
}
