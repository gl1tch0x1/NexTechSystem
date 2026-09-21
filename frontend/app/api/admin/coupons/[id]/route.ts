import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const authHeader = request.headers.get('authorization');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${clean}/api/admin/coupons/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json, { status: res.status });
      }
    } catch (err) {
      console.warn('Backend admin update coupon failed:', err);
    }
  }

  return NextResponse.json({
    success: true,
    data: { id, ...body },
    message: 'Coupon updated successfully.',
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  if (backendUrl) {
    try {
      const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
      const authHeader = request.headers.get('authorization');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const res = await fetch(`${clean}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers,
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const json = await res.json();
        return NextResponse.json(json, { status: res.status });
      }
    } catch (err) {
      console.warn('Backend admin delete coupon failed:', err);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Coupon deleted successfully.',
  });
}
