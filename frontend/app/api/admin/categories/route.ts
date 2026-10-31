import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { DEFAULT_CATEGORIES } from '@/lib/default-taxonomy';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/categories', {
    fallbackData: DEFAULT_CATEGORIES,
  });
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/admin/categories');
}
