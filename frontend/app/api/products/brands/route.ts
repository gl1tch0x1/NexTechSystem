import { NextResponse } from 'next/server';
import { DEFAULT_BRANDS } from '@/lib/default-taxonomy';

export async function GET() {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL;

  // Try remote backend if configured
  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/products/brands`, {
        signal: AbortSignal.timeout(5000),
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Fall through
    }
  }

  // Try local backend
  if (!backendUrl || backendUrl.includes('localhost')) {
    try {
      const res = await fetch(`http://localhost:5000/api/products/brands`, {
        signal: AbortSignal.timeout(1500),
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({
    success: true,
    data: DEFAULT_BRANDS,
    meta: { total: DEFAULT_BRANDS.length },
  });
}
