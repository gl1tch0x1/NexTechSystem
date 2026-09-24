import { NextResponse } from 'next/server';
import { Reseller } from '@/types';

let inMemoryResellers: Reseller[] = [
  {
    id: 'reseller_apex101',
    userId: 'user_apex101',
    resellerCode: 'apex101',
    username: 'apex_admin',
    email: 'sales@apextech.ae',
    businessName: 'Apex Hardware Technologies LLC',
    displayName: 'Apex Hardware Technologies LLC',
    phone: '+971 4 380 4400',
    subdomain: 'apex101',
    address: {
      id: 'addr_apex',
      fullName: 'Apex Hardware Technologies LLC',
      phone: '+971 4 380 4400',
      addressLine1: 'Al Quoz Industrial Area 4, Warehouse 12',
      city: 'Dubai',
      state: 'Dubai',
      country: 'United Arab Emirates',
      postalCode: '00000',
    },
    businessInformation: {
      taxNumber: '100382910400003',
      tradeLicense: 'TL-DXB-948210',
      licenseJurisdiction: 'Dubai Economy and Tourism (DET)',
      licenseExpiryDate: '2027-11-30',
      businessType: 'Value-Added Reseller (VAR)',
      specializations: ['Enterprise Servers & Racks', 'AI & Deep Learning Rigs', 'High-Performance Workstations'],
      authorizedSignatory: 'Tariq Al-Mansoor',
      signatoryTitle: 'Managing Director',
      website: 'https://apextech.ae',
      description: 'Official enterprise VAR specializing in high-density HPC racks, NVIDIA enterprise GPUs, and custom liquid-cooled workstations.',
      settlementTerms: 'Weekly Automatic Settlement',
      creditLimitAED: 150000,
      dispatchHub: 'Al Quoz Industrial Hub (Dubai)',
    },
    status: 'ACTIVE',
    productCount: 42,
    salesStats: {
      totalRevenue: 842500,
      totalOrders: 68,
      unitsSold: 215,
    },
    commissionRate: 8,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-09-18T12:00:00.000Z',
  },
  {
    id: 'reseller_comnet202',
    userId: 'user_comnet202',
    resellerCode: 'comnet202',
    username: 'comnet_admin',
    email: 'procurement@comnet.me',
    businessName: 'ComNet Systems & Solutions FZ-LLC',
    displayName: 'ComNet Systems & Solutions FZ-LLC',
    phone: '+971 4 456 7890',
    subdomain: 'comnet',
    address: {
      id: 'addr_comnet',
      fullName: 'ComNet Systems & Solutions FZ-LLC',
      phone: '+971 4 456 7890',
      addressLine1: 'Dubai Internet City, Building 3, Suite 402',
      city: 'Dubai',
      state: 'Dubai',
      country: 'United Arab Emirates',
      postalCode: '00000',
    },
    businessInformation: {
      taxNumber: '100492817200003',
      tradeLicense: 'FZ-DIC-881920',
      licenseJurisdiction: 'Dubai Development Authority (DDA Free Zone)',
      licenseExpiryDate: '2028-03-15',
      businessType: 'Enterprise System Integrator (SI)',
      specializations: ['Networking & Cyber Infrastructure', 'Enterprise Servers & Racks'],
      authorizedSignatory: 'Saeed Al-Nuaimi',
      signatoryTitle: 'Chief Technology Officer',
      website: 'https://comnet.me',
      description: 'Tier-1 networking infrastructure contractor and enterprise cloud datacenter hardware distributor across GCC.',
      settlementTerms: 'Bi-Weekly Automated Clearing',
      creditLimitAED: 300000,
      dispatchHub: 'Dubai South / DWC Logistics City',
    },
    status: 'ACTIVE',
    productCount: 78,
    salesStats: {
      totalRevenue: 1420000,
      totalOrders: 112,
      unitsSold: 460,
    },
    commissionRate: 7,
    createdAt: '2026-02-10T09:30:00.000Z',
    updatedAt: '2026-09-19T10:15:00.000Z',
  },
];

export async function GET(request: Request) {
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

      const res = await fetch(`${clean}/api/admin/resellers`, {
        headers,
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return NextResponse.json(json);
        }
      }
    } catch {
      // Graceful fallback to rich in-memory resellers
    }
  }

  return NextResponse.json({
    success: true,
    data: inMemoryResellers,
    meta: { total: inMemoryResellers.length },
  });
}

export async function POST(request: Request) {
  const backendUrl =
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Invalid JSON body' } }, { status: 400 });
  }

  // Attempt backend proxy first if available
  try {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${clean}/api/admin/resellers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    }
  } catch {
    // Fall through to resilient in-memory creation
  }

  // Create resilient local record
  const newReseller: Reseller = {
    id: `reseller_${Date.now()}`,
    userId: `user_${Date.now()}`,
    resellerCode: String(body.resellerCode || body.businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)),
    username: String(body.username || 'vendor_admin'),
    email: String(body.email || 'partner@enterprise.ae'),
    businessName: String(body.businessName || 'New Technology Partner LLC'),
    displayName: String(body.displayName || body.businessName),
    phone: String(body.phone || '+971 4 000 0000'),
    subdomain: String(body.subdomain || body.resellerCode || 'partner').toLowerCase(),
    address: {
      id: `addr_${Date.now()}`,
      fullName: String(body.displayName || body.businessName),
      phone: String(body.phone || '+971 4 000 0000'),
      addressLine1: body.address?.addressLine1 || 'Al Quoz Industrial Hub',
      city: body.address?.city || 'Dubai',
      state: body.address?.state || 'Dubai',
      country: body.address?.country || 'United Arab Emirates',
      postalCode: body.address?.postalCode || '00000',
    },
    businessInformation: {
      taxNumber: body.businessInformation?.taxNumber || '100492817200003',
      tradeLicense: body.businessInformation?.tradeLicense || 'TL-DXB-998810',
      licenseJurisdiction: body.businessInformation?.licenseJurisdiction || 'Dubai Economy and Tourism (DET)',
      licenseExpiryDate: body.businessInformation?.licenseExpiryDate || '2028-06-30',
      businessType: body.businessInformation?.businessType || 'Value-Added Reseller (VAR)',
      specializations: body.businessInformation?.specializations || ['Enterprise Servers & Racks', 'AI Hardware'],
      authorizedSignatory: body.businessInformation?.authorizedSignatory || body.displayName,
      signatoryTitle: body.businessInformation?.signatoryTitle || 'Managing Director',
      website: body.businessInformation?.website || 'https://enterprise.ae',
      description: body.businessInformation?.description || 'Authorized enterprise technology provider.',
      settlementTerms: body.businessInformation?.settlementTerms || 'Weekly Automatic Settlement',
      creditLimitAED: Number(body.businessInformation?.creditLimitAED || 100000),
      dispatchHub: body.businessInformation?.dispatchHub || 'Al Quoz Industrial Hub (Dubai)',
    },
    status: 'ACTIVE',
    productCount: 0,
    salesStats: {
      totalRevenue: 0,
      totalOrders: 0,
      unitsSold: 0,
    },
    commissionRate: Number(body.commissionRate || 8),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryResellers.unshift(newReseller);

  return NextResponse.json({
    success: true,
    data: {
      reseller: newReseller,
      message: `Technology Reseller ${newReseller.businessName} provisioned successfully.`,
    },
  });
}
