import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

function loadFallbackPOs(): any[] {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'backend', 'data_store', 'purchase_orders.json'),
      path.resolve(process.cwd(), 'data_store', 'purchase_orders.json'),
      path.resolve(process.cwd(), '..', 'backend', 'data_store', 'purchase_orders.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {}
  return [];
}

export async function GET(request: NextRequest) {
  // 1. Try upstream backend
  try {
    const upstream = await proxyToBackend(request, '/admin/purchase-orders');
    if (upstream.ok) {
      const json = await upstream.json();
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      if (list.length > 0) {
        return NextResponse.json({ success: true, data: list });
      }
    }
  } catch {}

  // 2. Query MongoDB Atlas purchase_orders collection
  try {
    const db = await getMongoDb();
    if (db) {
      const mongoPOs = await db.collection('purchase_orders').find().sort({ createdAt: -1 }).toArray();
      if (mongoPOs && mongoPOs.length > 0) {
        return NextResponse.json({ success: true, data: mongoPOs });
      }
    }
  } catch (err: any) {
    console.warn('[POs GET Mongo Warning]:', err?.message || err);
  }

  const fallback = loadFallbackPOs();
  return NextResponse.json({ success: true, data: fallback });
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Invalid JSON payload' } }, { status: 400 });
  }

  const po = {
    ...body,
    id: body.id || `po_${Date.now()}`,
    poNumber: body.poNumber || `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    status: body.status || 'PENDING_SUPPLIER',
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Persist to MongoDB Atlas purchase_orders collection
  try {
    const db = await getMongoDb();
    if (db) {
      await db.collection('purchase_orders').updateOne(
        { id: po.id },
        { $set: po },
        { upsert: true }
      );
    }
  } catch (err: any) {
    console.warn('[POs POST Mongo Warning]:', err?.message || err);
  }

  // 2. Relay to backend
  try {
    await proxyToBackend(request, '/admin/purchase-orders', {
      body: JSON.stringify(po),
    });
  } catch {}

  return NextResponse.json({ success: true, data: po }, { status: 201 });
}
