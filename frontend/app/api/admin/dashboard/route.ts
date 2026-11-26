import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

/** Dashboard figures must always originate from the persistent API service. */
export async function GET(request: NextRequest): Promise<Response> {
  return proxyToBackend(request, '/admin/dashboard');
}
