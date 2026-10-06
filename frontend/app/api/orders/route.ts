import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { FALLBACK_ORDERS } from '@/lib/fallback-data';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/orders', { fallbackData: FALLBACK_ORDERS });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/orders');
}
