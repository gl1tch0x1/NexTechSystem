import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const res = await fetch(`${clean}/api/products/brands`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch (err) {
      console.warn('Backend brands endpoint fetch failed:', err);
    }
  }

  return NextResponse.json({
    success: true,
    data: [],
    meta: { total: 0 },
  });
}
