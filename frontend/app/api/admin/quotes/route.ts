import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/quotes`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        return NextResponse.json(data);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: 'Quote backend is unavailable. Please try again later.' },
      },
      { status: res.status || 503 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: { message: 'Quote backend is unavailable. Please try again later.' },
      },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    try {
      const res = await fetch(`${BACKEND_URL}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (err) {
      // fallback
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: 'Quote backend is unavailable. Please try again later.' },
      },
      { status: 503 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err.message || 'Failed to process quotation.' } }, { status: 500 });
  }
}
