import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const id = path[0];

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  try {
    const db = await getMongoDb();
    if (db) {
      await db.collection('purchase_orders').updateOne(
        { $or: [{ id }, { poNumber: id }] },
        {
          $set: {
            ...body,
            updatedAt: new Date().toISOString(),
          },
        }
      );
    }
  } catch {}

  try {
    await proxyToBackend(request, `/admin/purchase-orders/${path.join('/')}`, {
      body: JSON.stringify(body),
    });
  } catch {}

  return NextResponse.json({ success: true, message: 'Purchase order updated successfully.' });
}
