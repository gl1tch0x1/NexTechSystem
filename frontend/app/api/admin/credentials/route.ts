import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/admin/profile');
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '/admin/credentials');
}
