import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

/** Media is persisted by the API host; Vercel's filesystem is not durable. */
export async function POST(request: NextRequest): Promise<Response> {
  return proxyToBackend(request, '/upload');
}
