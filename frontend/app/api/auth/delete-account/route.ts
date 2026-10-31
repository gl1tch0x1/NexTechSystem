import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function DELETE(request: NextRequest) {
  return proxyToBackend(request, '/auth/delete-account');
}
