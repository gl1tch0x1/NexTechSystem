import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> | { filename: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  return proxyToBackend(request, `/upload/${resolvedParams.filename}`);
}

