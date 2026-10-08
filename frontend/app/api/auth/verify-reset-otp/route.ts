import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/auth/verify-reset-otp');
}
