import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

function loadFallbackQuotes(): any[] {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'backend', 'data_store', 'quotes.json'),
      path.resolve(process.cwd(), 'data_store', 'quotes.json'),
      path.resolve(process.cwd(), '..', 'backend', 'data_store', 'quotes.json'),
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
    const upstream = await proxyToBackend(request, '/quotes');
    if (upstream.ok) {
      const json = await upstream.json();
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      if (list.length > 0) {
        return NextResponse.json({ success: true, data: list });
      }
    }
  } catch {}

  // 2. Query MongoDB Atlas quotes collection
  try {
    const db = await getMongoDb();
    if (db) {
      const quotesCol = db.collection('quotes');
      const mongoQuotes = await quotesCol.find().sort({ createdAt: -1 }).toArray();
      if (mongoQuotes && mongoQuotes.length > 0) {
        return NextResponse.json({ success: true, data: mongoQuotes });
      }
    }
  } catch (err: any) {
    console.warn('[Quotes GET Mongo Warning]:', err?.message || err);
  }

  // 3. Fallback to bundled / disk quotes
  const fallback = loadFallbackQuotes();
  return NextResponse.json({ success: true, data: fallback });
}

export async function POST(request: NextRequest) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Invalid JSON payload' } }, { status: 400 });
  }

  const quoteId = `qte_${Date.now()}`;
  const quoteNumber = `QTE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newQuote = {
    id: quoteId,
    quoteNumber,
    companyName: body.companyName || 'Enterprise Client',
    contactName: body.contactName || 'Corporate Representative',
    contactEmail: body.contactEmail || '',
    paymentTerms: body.paymentTerms || 'NET_30',
    deliverySLA: body.deliverySLA || 'EX_STOCK_24H',
    taxTreatment: body.taxTreatment || 'STANDARD',
    total: Number(body.estimatedValue || body.total || 45000),
    margin: Number(body.margin || 25.0),
    status: 'PENDING',
    items: body.items || [],
    notes: body.notes || 'Enterprise B2B Hardware RFQ',
    validUntil: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Persist to MongoDB Atlas quotes collection
  try {
    const db = await getMongoDb();
    if (db) {
      await db.collection('quotes').updateOne(
        { id: newQuote.id },
        { $set: newQuote },
        { upsert: true }
      );
    }
  } catch (err: any) {
    console.warn('[Quotes POST Mongo Warning]:', err?.message || err);
  }

  // 2. Relay to backend
  try {
    await proxyToBackend(request, '/quotes', {
      body: JSON.stringify(newQuote),
    });
  } catch {}

  return NextResponse.json({ success: true, data: newQuote }, { status: 201 });
}
