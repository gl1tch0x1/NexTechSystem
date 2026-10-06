import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/payments');
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/payments');
}
