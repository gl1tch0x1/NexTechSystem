import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const id = path[0];

  try {
    const db = await getMongoDb();
    if (db) {
      const quote = await db.collection('quotes').findOne({
        $or: [{ id }, { quoteNumber: id }],
      });
      if (quote) {
        return NextResponse.json({ success: true, data: quote });
      }
    }
  } catch {}

  return proxyToBackend(request, `/quotes/${path.join('/')}`);
}

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
      await db.collection('quotes').updateOne(
        { $or: [{ id }, { quoteNumber: id }] },
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
    await proxyToBackend(request, `/quotes/${path.join('/')}`, {
      body: JSON.stringify(body),
    });
  } catch {}

  return NextResponse.json({ success: true, message: 'Quote updated successfully.' });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const id = path[0];
  const isConvert = path[1] === 'convert';

  if (isConvert) {
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('quotes').updateOne(
          { $or: [{ id }, { quoteNumber: id }] },
          {
            $set: {
              status: 'CONVERTED',
              convertedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
    } catch {}

    try {
      await proxyToBackend(request, `/quotes/${path.join('/')}`);
    } catch {}

    return NextResponse.json({ success: true, message: 'Quote converted to official Sales Order.' });
  }

  return proxyToBackend(request, `/quotes/${path.join('/')}`);
}
