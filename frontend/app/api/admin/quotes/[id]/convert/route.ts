import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_\-]{1,64}$/.test(id)) {
      return NextResponse.json({ success: false, error: { message: 'Invalid quotation identifier format.' } }, { status: 400 });
    }

    try {
      const res = await fetch(`${BACKEND_URL}/quotes/${encodeURIComponent(id)}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
      const errData = await res.json();
      return NextResponse.json(errData, { status: res.status });
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Quote conversion is unavailable because the backend service is not configured or reachable.',
          },
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err.message || 'Failed to convert quote.' } }, { status: 500 });
  }
}
