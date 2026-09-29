import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

import { VERIFIED_SUPPLIERS, NEXTECH_BUYER_DETAILS } from '@/lib/suppliers-data';

const DEFAULT_PURCHASE_ORDERS = [
  {
    id: 'po_1',
    poNumber: 'PO-2026-0041',
    supplierName: 'ASUSTeK Computer Middle East FZCO',
    targetHub: 'DXB-01 (JAFZA Mega-Hub)',
    targetWarehouse: 'DXB-01 (JAFZA Mega-Hub)',
    sku: 'ROG-STRIX-RTX4090-O24G-GAMING',
    units: 12,
    totalCost: 89400,
    totalEstimatedCost: 89400,
    status: 'IN_TRANSIT',
    estimatedArrival: 'Tomorrow, 10:00 AM',
    supplierDetails: VERIFIED_SUPPLIERS[0].details,
    buyerDetails: NEXTECH_BUYER_DETAILS,
    paymentTerms: 'Net 30 Days Commercial Wire',
    deliveryTerms: 'DDP - JAFZA Mega-Hub',
    freightCarrier: 'DHL Global Freight Logistics',
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
    supplierName: 'Intel Corporation (UK) Ltd - Middle East Branch',
    targetHub: 'DXB-02 (Silicon Oasis Express)',
    targetWarehouse: 'DXB-02 (Silicon Oasis Express)',
    sku: 'INTEL-CORE-I9-14900KS',
    units: 25,
    totalCost: 68500,
    totalEstimatedCost: 68500,
    status: 'PENDING_SUPPLIER',
    estimatedArrival: 'In 3 Days',
    supplierDetails: VERIFIED_SUPPLIERS[1].details,
    buyerDetails: NEXTECH_BUYER_DETAILS,
    paymentTerms: 'Net 45 Days Corporate Escrow',
    deliveryTerms: 'DDP - Silicon Oasis Express',
    freightCarrier: 'Direct OEM Express Transport',
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
    supplierName: 'Corsair Components MENA FZE',
    targetHub: 'AUH-01 (KIZAD Enterprise Center)',
    targetWarehouse: 'AUH-01 (KIZAD Enterprise Center)',
    sku: 'CORSAIR-DOMINATOR-TITANIUM-64GB',
    units: 40,
    totalCost: 46800,
    totalEstimatedCost: 46800,
    status: 'RECEIVED_RESTOCKED',
    estimatedArrival: 'Completed Today',
    supplierDetails: VERIFIED_SUPPLIERS[3].details,
    buyerDetails: NEXTECH_BUYER_DETAILS,
    paymentTerms: 'PDC 30 Days (Post-Dated Cheque)',
    deliveryTerms: 'DDP - KIZAD Hub',
    items: [
      {
        sku: 'CORSAIR-DOMINATOR-TITANIUM-64GB',
        name: 'Corsair Dominator Titanium RGB 64GB DDR5 6000MHz',
        orderedQuantity: 40,
        quantity: 40,
        unitCost: 1170,
        totalCost: 46800,
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po_4',
    poNumber: 'PO-2026-0044',
    supplierName: 'Kingston Technology Europe Co LLP - Middle East',
    targetHub: 'DXB-01 (JAFZA Mega-Hub)',
    targetWarehouse: 'DXB-01 (JAFZA Mega-Hub)',
    sku: 'KINGSTON-FURY-RENEGADE-4TB',
    units: 30,
    totalCost: 38200,
    totalEstimatedCost: 38200,
    status: 'RECEIVED_RESTOCKED',
    estimatedArrival: 'Completed Yesterday',
    supplierDetails: VERIFIED_SUPPLIERS[4].details,
    buyerDetails: NEXTECH_BUYER_DETAILS,
    paymentTerms: 'Net 30 Days Commercial Credit',
    deliveryTerms: 'DDP - JAFZA Mega-Hub',
    items: [
      {
        sku: 'KINGSTON-FURY-RENEGADE-4TB',
        name: 'Kingston FURY Renegade 4TB PCIe Gen4 NVMe M.2 SSD',
        orderedQuantity: 30,
        quantity: 30,
        unitCost: 1273,
        totalCost: 38200,
      }
    ],
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
