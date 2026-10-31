import type { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest, context: { params: Promise<{ serial: string }> }) {
  const { serial } = await context.params;
  return proxyToBackend(request, `/warranty/verify/${encodeURIComponent(serial)}`);
}
