import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

/** Media is persisted by the API host in MongoDB GridFS. */
export async function POST(request: NextRequest): Promise<Response> {
  return proxyToBackend(request, '/upload');
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return proxyToBackend(request, '/upload');
}
