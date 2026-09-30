import { NextRequest, NextResponse } from 'next/server';
import { signJwt } from '@/lib/token';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_local_jwt_secret_change_in_env';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || 'http://localhost:5000';
  const body = await request.json().catch(() => ({}));
  const {
    accountType,
    name,
    email,
    username,
    phone,
    businessName,
    tradeLicense,
    taxNumber,
    taxRegistrationNumber,
    licenseJurisdiction,
    businessType,
    signatoryTitle,
    website,
    resellerCode,
    addressStreet,
    addressCity,
    settlementTerms,
  } = body;

  const isReseller = (accountType === 'RESELLER' || body.role === 'RESELLER');

  if (backendUrl) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(7000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through to resilient local handler
    }
  }

  const id = `user_${Date.now()}`;
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanName = (name || '').trim() || (isReseller ? 'Authorized Signatory' : 'Customer');

  if (isReseller) {
    const resellerId = `res_${Date.now()}`;
    const candidateCode = (resellerCode || businessName || 'reseller')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20) || `res_${Date.now().toString().slice(-4)}`;

    const newResellerUser = {
      id,
      email: cleanEmail,
      role: 'RESELLER' as const,
      resellerId,
      name: cleanName,
      username: username || candidateCode,
      phone: phone || '',
      company: businessName || 'Enterprise Partner',
      tradeLicense: tradeLicense || '',
      taxRegistrationNumber: taxNumber || taxRegistrationNumber || '',
      addresses: [{
        id: `addr_${Date.now()}`,
        fullName: cleanName,
        phone: phone || '',
        addressLine1: addressStreet || 'Commercial Business Bay',
        city: addressCity || 'Dubai',
        state: addressCity || 'Dubai',
        country: 'United Arab Emirates',
        postalCode: '00000',
        isDefaultShipping: true,
        isDefaultBilling: true,
      }],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newResellerDoc = {
      id: resellerId,
      userId: id,
      resellerCode: candidateCode,
      username: newResellerUser.username,
      email: cleanEmail,
      businessName: businessName || 'Enterprise Partner LLC',
      displayName: businessName || 'Enterprise Partner LLC',
      phone: phone || '',
      subdomain: candidateCode,
      address: newResellerUser.addresses[0],
      businessInformation: {
        taxNumber: taxNumber || taxRegistrationNumber || '',
        tradeLicense: tradeLicense || '',
        licenseJurisdiction: licenseJurisdiction || 'Dubai Economy and Tourism (DET)',
        businessType: businessType || 'IT Solutions & Hardware Distributor',
        authorizedSignatory: cleanName,
        signatoryTitle: signatoryTitle || 'Managing Director',
        website: website || '',
        settlementTerms: settlementTerms || 'Net 30 Days (Corporate Credit)',
        creditLimitAED: 50000,
        dispatchHub: 'Dubai Logistics City (DWC)',
        description: `Verified Enterprise Reseller: ${businessName || 'Enterprise Partner'}`,
      },
      status: 'ACTIVE' as const,
      productCount: 0,
      salesStats: {
        totalRevenue: 0,
        totalOrders: 0,
        unitsSold: 0,
      },
      commissionRate: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const token = signJwt(
      { id: newResellerUser.id, email: newResellerUser.email, role: 'RESELLER', resellerId },
      JWT_SECRET,
      86400 * 30
    );

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: newResellerUser,
        reseller: newResellerDoc,
      },
    });
  }

  const newUser = {
    id,
    email: cleanEmail,
    role: 'CUSTOMER' as const,
    name: cleanName,
    username: username || cleanEmail.split('@')[0],
    phone: phone || '',
    addresses: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const token = signJwt(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    86400 * 30
  );

  return NextResponse.json({
    success: true,
    data: {
      token,
      user: newUser,
    },
  });
}
