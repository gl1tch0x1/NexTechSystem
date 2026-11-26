import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
): Promise<Response> {
  const { filename } = await params;
  return proxyToBackend(request, `/upload/${encodeURIComponent(filename)}`);
}
