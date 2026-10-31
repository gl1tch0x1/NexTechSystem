import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { DEFAULT_BRANDS } from '@/lib/default-taxonomy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/brands', {
    fallbackData: DEFAULT_BRANDS,
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/admin/brands');
}
