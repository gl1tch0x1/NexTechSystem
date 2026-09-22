import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    const { serial } = await params;
    const cleanSerial = serial ? decodeURIComponent(serial).trim().toUpperCase() : '';

    if (!cleanSerial || !/^[A-Z0-9_-]{3,64}$/.test(cleanSerial)) {
      return NextResponse.json(
        { success: false, error: { message: 'A valid alphanumeric serial number (3 to 64 characters) is required.' } },
        { status: 400 }
      );
    }

    try {
      const res = await fetch(`${BACKEND_URL}/warranty/verify/${encodeURIComponent(cleanSerial)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (fetchErr) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Warranty verification is unavailable because the backend service is not configured or reachable.',
          },
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Internal warranty check error' } },
      { status: 500 }
    );
  }
}
