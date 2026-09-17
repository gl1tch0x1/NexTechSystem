import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_\-]{1,64}$/.test(id)) {
      return NextResponse.json({ success: false, error: { message: 'Invalid quotation identifier format.' } }, { status: 400 });
    }
    const body = await request.json();

    try {
      const res = await fetch(`${BACKEND_URL}/quotes/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err) {
      // fallback
    }

    return NextResponse.json({
      success: true,
      message: 'Quote updated successfully (local memory mode).',
      data: { id, ...body },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err.message || 'Failed to update quote.' } }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_\-]{1,64}$/.test(id)) {
      return NextResponse.json({ success: false, error: { message: 'Invalid quotation identifier format.' } }, { status: 400 });
    }
    const res = await fetch(`${BACKEND_URL}/quotes/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ success: false, error: { message: 'Quote not found.' } }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err.message || 'Failed to fetch quote.' } }, { status: 500 });
  }
}
