import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { FALLBACK_PRODUCTS } from '@/lib/fallback-data';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/products', {
    fallbackData: FALLBACK_PRODUCTS,
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/admin/products');
}
