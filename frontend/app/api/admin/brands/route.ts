import { NextResponse } from 'next/server';
import { DEFAULT_BRANDS } from '@/lib/default-taxonomy';

export async function GET(request: Request) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const authHeader = request.headers.get('authorization');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${clean}/api/admin/brands`, {
        headers,
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Fallback to local default taxonomy on network/proxy failure
    }
  }

  return NextResponse.json({
    success: true,
    data: DEFAULT_BRANDS,
    meta: { total: DEFAULT_BRANDS.length },
  });
}
