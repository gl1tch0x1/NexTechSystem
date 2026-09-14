import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fallback in-memory quotes for offline or standalone frontend mode
let memoryQuotes: any[] = [
  {
    id: 'qte-demo-001',
    quoteNumber: 'QTE-2026-89412',
    companyName: 'Al-Futtaim Cloud Infrastructure LLC',
    contactName: 'Tariq Mansoor',
    contactEmail: 'tariq.mansoor@alfuttaim.ae',
    contactPhone: '+971 4 290 5500',
    taxRegistrationNumber: '100293847100003',
    items: [
      {
        productId: 'prod_rtx4090',
        productName: 'ASUS ROG Strix GeForce RTX 4090 OC Edition 24GB GDDR6X',
        sku: 'ROG-STRIX-RTX4090-O24G-GAMING',
        unitPrice: 7699,
        quantity: 8,
        discount: 1592,
        subtotal: 60000,
        specifications: { memory: '24GB GDDR6X', interface: 'PCIe 4.0' },
      },
      {
        productId: 'prod_i9_14900k',
        productName: 'Intel Core i9-14900K 24-Core Desktop Processor',
        sku: 'BX8071514900K',
        unitPrice: 2299,
        quantity: 8,
        discount: 792,
        subtotal: 17600,
        specifications: { socket: 'LGA1700', cores: '24 Cores / 32 Threads' },
      },
    ],
    subtotal: 77600,
    discount: 2384,
    tax: 3880,
    shipping: 0,
    total: 81480,
    currency: 'AED',
    status: 'PENDING_REVIEW',
    validUntil: '2026-10-15T18:00:00.000Z',
    notes: 'Urgent enterprise deployment for High-Performance Deep Learning cluster in DIFC data center.',
    createdAt: '2026-09-14T09:30:00.000Z',
    updatedAt: '2026-09-14T09:30:00.000Z',
  },
  {
    id: 'qte-demo-002',
    quoteNumber: 'QTE-2026-92105',
    companyName: 'Dubai Future Foundation Labs',
    contactName: 'Dr. Sarah Al-Hashimi',
    contactEmail: 'sarah.hashimi@dubaifuture.gov.ae',
    contactPhone: '+971 4 516 6666',
    taxRegistrationNumber: '100492817200003',
    items: [
      {
        productId: 'prod_corsair_ddr5',
        productName: 'Corsair Dominator Titanium RGB 64GB (2x32GB) DDR5 6000MHz',
        sku: 'CMP64GX5M2B6000C30',
        unitPrice: 1249,
        quantity: 16,
        discount: 984,
        subtotal: 19000,
        specifications: { speed: '6000MHz CL30' },
      },
    ],
    subtotal: 19000,
    discount: 984,
    tax: 950,
    shipping: 0,
    total: 19950,
    currency: 'AED',
    status: 'APPROVED',
    validUntil: '2026-10-10T18:00:00.000Z',
    notes: 'Government purchase tender. Standard Net-30 invoicing terms approved.',
    createdAt: '2026-09-13T14:15:00.000Z',
    updatedAt: '2026-09-14T11:00:00.000Z',
  },
];

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/quotes`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return NextResponse.json(data);
      }
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
  try {
    const body = await request.json();

    try {
      const res = await fetch(`${BACKEND_URL}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (err) {
      // fallback
    }

    const newId = `qte-${Date.now()}`;
    const quoteNumber = `QTE-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const subtotal = body.items.reduce((acc: number, item: any) => acc + (item.subtotal || item.unitPrice * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = subtotal + tax;

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);

    const fallbackQuote = {
      id: newId,
      quoteNumber,
      companyName: body.companyName,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      taxRegistrationNumber: body.taxRegistrationNumber,
      items: body.items,
      subtotal,
      discount: body.discount || 0,
      tax,
      shipping: 0,
      total,
      currency: 'AED',
      status: 'PENDING_REVIEW',
      validUntil: validUntilDate.toISOString(),
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
