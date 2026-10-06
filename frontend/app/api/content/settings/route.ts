import { NextResponse } from 'next/server';
import { FALLBACK_STORE_SETTINGS } from '@/lib/fallback-data';

export async function GET() {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const res = await fetch(`${clean}/api/content/settings`, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          return NextResponse.json(json);
        }
      }
    } catch (err) {
      console.warn('Backend store settings fetch failed, falling back:', err);
    }
  }

  return NextResponse.json({
    success: true,
    data: FALLBACK_STORE_SETTINGS,
  });
}
