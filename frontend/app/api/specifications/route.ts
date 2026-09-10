import { NextResponse } from 'next/server';
import { SPECIFICATION_FIELDS, SPECIFICATION_PRESETS } from '@/lib/specification-presets';

export async function GET() {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const res = await fetch(`${clean}/api/specifications`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.presets) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Fall through
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      fields: SPECIFICATION_FIELDS,
      presets: SPECIFICATION_PRESETS,
    },
  });
}
