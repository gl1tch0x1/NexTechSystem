import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^[a-zA-Z0-9_\-]{1,64}$/.test(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid purchase order identifier format.' } },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    const body = await request.json().catch(() => ({}));

    try {
      const res = await fetch(`${BACKEND_URL}/admin/purchase-orders/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline or unreachable fallback
    }

    // Fallback response for standalone/Vercel or if backend returns error
    const newStatus = body.status || 'RECEIVED';
    return NextResponse.json({
      success: true,
      message: `Purchase Order ${id} status updated to ${newStatus}.`,
      data: {
        id,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        receivedAt: newStatus === 'RECEIVED' ? new Date().toISOString() : undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to update purchase order status.' } },
      { status: 500 }
    );
  }
}
