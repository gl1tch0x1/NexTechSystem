import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.API_PROXY_TARGET ||
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clean = BACKEND_URL.replace(/\/$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization') || '';

    const res = await fetch(`${clean}/api/admin/resellers/${encodeURIComponent(id)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ success: false, error: { message: 'Reseller not found.' } }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err?.message || 'Failed to fetch reseller.' } }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const clean = BACKEND_URL.replace(/\/$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization') || '';

    const res = await fetch(`${clean}/api/admin/resellers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errJson = await res.json().catch(() => ({}));
    return NextResponse.json(errJson, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err?.message || 'Failed to update reseller.' } }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clean = BACKEND_URL.replace(/\/$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization') || '';

    const res = await fetch(`${clean}/api/admin/resellers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    const errJson = await res.json().catch(() => ({}));
    return NextResponse.json(errJson, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err?.message || 'Failed to delete reseller.' } }, { status: 500 });
  }
}
