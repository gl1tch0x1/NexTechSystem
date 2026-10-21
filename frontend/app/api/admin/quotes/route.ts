import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// In-memory quotes cache for standalone mode
let memoryQuotes: any[] = [];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  try {
    const res = await fetch(`${BACKEND_URL}/quotes`, {
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
  } catch (err) {
    // backend not available, use memory
  }

  return NextResponse.json({
    success: true,
    data: memoryQuotes,
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  try {
    const body = await request.json();

    try {
      const res = await fetch(`${BACKEND_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (err) {
      // fallback
    }

    const newId = `qte-${Date.now()}`;
    const quoteNumber = `QTE-2026-${crypto.randomInt(10000, 100000)}`;
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = body.subtotal !== undefined
      ? body.subtotal
      : items.reduce((sum: number, it: any) => sum + (Number(it.unitPrice || 0) * Number(it.quantity || 1) - Number(it.discount || 0)), 0);
    const isZeroRated = body.taxTreatment === 'FREE_ZONE' || body.taxTreatment === 'EXPORT' || body.taxTreatment === 'EXEMPT';
    const discount = body.discount || 0;
    const taxableSubtotal = Math.max(0, subtotal - discount);
    const tax = body.tax !== undefined ? body.tax : (isZeroRated ? 0 : Math.round(taxableSubtotal * 0.05 * 100) / 100);
    const shipping = body.shipping !== undefined ? body.shipping : (subtotal > 5000 ? 0 : 150);
    const total = body.total !== undefined ? body.total : (taxableSubtotal + tax + shipping);

    const validDays = parseInt(body.validityDays, 10) || 30;
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validDays);

    const fallbackQuote = {
      id: newId,
      quoteNumber,
      companyName: body.companyName,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      tradeLicense: body.tradeLicense,
      taxRegistrationNumber: body.taxRegistrationNumber,
      clientReference: body.clientReference,
      paymentTerms: body.paymentTerms || 'NET_30',
      deliverySLA: body.deliverySLA || 'EX_STOCK',
      taxTreatment: body.taxTreatment || 'STANDARD',
      items: body.items,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      currency: 'AED',
      status: 'PENDING_REVIEW',
      validUntil: body.validUntil || validUntilDate.toISOString(),
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryQuotes.unshift(fallbackQuote);

    return NextResponse.json({
      success: true,
      data: fallbackQuote,
      message: `Quotation ${quoteNumber} submitted successfully.`,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err.message || 'Failed to process quotation.' } }, { status: 500 });
  }
}
