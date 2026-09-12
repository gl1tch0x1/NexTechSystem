import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');

  try {
    const res = await fetch(`${clean}/api/products/${slug}`, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json);
    }

    return NextResponse.json(
      { success: false, message: 'Product not found in database' },
      { status: res.status }
    );
  } catch (err: any) {
    console.warn(`[API Proxy] Error fetching product ${slug} from Node.js backend:`, err.message);
    return NextResponse.json(
      { success: false, message: 'Node.js backend API is unreachable.' },
      { status: 503 }
    );
  }
}
