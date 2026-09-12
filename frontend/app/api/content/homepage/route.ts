import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');

  try {
    const res = await fetch(`${clean}/api/content/homepage`, {
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json);
    }

    return NextResponse.json(
      { success: false, data: null },
      { status: res.status }
    );
  } catch (err: any) {
    console.warn('[API Proxy] Error fetching homepage content from Node.js backend:', err.message);
    return NextResponse.json({
      success: false,
      data: null,
      error: { message: 'Node.js backend API is unreachable.' },
    });
  }
}
