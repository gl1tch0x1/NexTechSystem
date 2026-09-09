import { NextResponse } from 'next/server';
import { DEFAULT_CATEGORIES } from '@/lib/default-taxonomy';

export async function GET() {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const res = await fetch(`${clean}/api/products/categories`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({
    success: true,
    data: DEFAULT_CATEGORIES,
    meta: { total: DEFAULT_CATEGORIES.length },
  });
}
