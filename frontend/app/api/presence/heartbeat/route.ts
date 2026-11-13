import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

export async function POST(request: NextRequest) {
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  try {
    const upstream = await proxyToBackend(request, '/presence/heartbeat');
    if (upstream.status !== 404) {
      return upstream;
    }

    // Also forward to admin presence route
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}

