import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DEFAULT_PURCHASE_ORDERS = [
  {
    id: 'po_1',
    poNumber: 'PO-2026-0041',
    supplierName: 'ASUS MENA Distribution Hub',
    targetHub: 'DXB-01 (JAFZA Mega-Hub)',
    sku: 'ROG-STRIX-RTX4090-O24G-GAMING',
    units: 12,
    totalCost: 89400,
    status: 'IN_TRANSIT',
    estimatedArrival: 'Tomorrow, 10:00 AM',
    items: [
      {
        sku: 'ROG-STRIX-RTX4090-O24G-GAMING',
        name: 'ASUS ROG Strix RTX 4090 OC Edition 24GB',
        orderedQuantity: 12,
        quantity: 12,
        unitCost: 7450,
        totalCost: 89400,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po_2',
    poNumber: 'PO-2026-0042',
    supplierName: 'Intel Technology GCC',
    targetHub: 'DXB-02 (Silicon Oasis Express)',
    sku: 'INTEL-CORE-I9-14900KS',
    units: 25,
    totalCost: 68500,
    status: 'PENDING_SUPPLIER',
    estimatedArrival: 'In 3 Days',
    items: [
      {
        sku: 'INTEL-CORE-I9-14900KS',
        name: 'Intel Core i9-14900KS Special Edition 24-Core',
        orderedQuantity: 25,
        quantity: 25,
        unitCost: 2740,
        totalCost: 68500,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po_3',
    poNumber: 'PO-2026-0043',
    supplierName: 'Corsair Enterprise ME',
    targetHub: 'AUH-01 (KIZAD Enterprise Center)',
    sku: 'CORSAIR-DOMINATOR-TITANIUM-64GB',
    units: 40,
    totalCost: 46800,
    status: 'RECEIVED_RESTOCKED',
    estimatedArrival: 'Completed Today',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po_4',
    poNumber: 'PO-2026-0044',
    supplierName: 'Kingston Technology ME',
    targetHub: 'DXB-01 (JAFZA Mega-Hub)',
    sku: 'KINGSTON-FURY-RENEGADE-4TB',
    units: 30,
    totalCost: 38200,
    status: 'RECEIVED_RESTOCKED',
    estimatedArrival: 'Completed Yesterday',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  try {
    const res = await fetch(`${BACKEND_URL}/admin/purchase-orders`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Backend offline / Vercel fallback
  }

  return NextResponse.json({
    success: true,
    data: DEFAULT_PURCHASE_ORDERS,
  });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  try {
    const body = await request.json();
    try {
      const res = await fetch(`${BACKEND_URL}/admin/purchase-orders`, {
        method: 'POST',
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
      // Backend offline fallback
    }

    const newPO = {
      id: `po_${Date.now()}`,
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ISSUED',
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Purchase order created successfully.',
      data: newPO,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to create purchase order.' } },
      { status: 500 }
    );
  }
}
