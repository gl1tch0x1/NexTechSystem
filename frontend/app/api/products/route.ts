import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  const { search } = new URL(request.url);

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const res = await fetch(`${clean}/api/products${search}`, {
        signal: AbortSignal.timeout(5000),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json);
      }
    } catch (err) {
      console.warn('Backend /api/products proxy fetch failed:', err);
    }
  }

  // Graceful fallback response
  return NextResponse.json({
    success: true,
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    },
  });
}
