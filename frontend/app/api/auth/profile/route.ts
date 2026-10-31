 import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '/auth/profile');
}
