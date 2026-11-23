import { NextRequest, NextResponse } from 'next/server';
import {
  proxyToBackend,
  fetchBackendSettings,
  saveBackendSettings,
  hashPassword,
  readLocalStoreJson,
  registerDynamicAdmin,
  getDynamicAdmins,
  createVaultToken,
  verifyVaultToken,
} from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';
import crypto from 'node:crypto';

function sanitizeUser(u: any) {
  return {
    id: u.id || String(u._id),
    name: u.name || 'Administrator',
    email: u.email || '',
    username: u.username || (u.email ? u.email.split('@')[0] : 'admin'),
    role: u.role || 'ADMIN',
    avatar: u.avatar || '',
    phone: u.phone || '',
    isActive: u.isActive !== false,
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  try {
    const upstream = await proxyToBackend(request, '/admin/admins');
    if (upstream.ok) {
      try {
        const json = await upstream.clone().json();
        if (json && Array.isArray(json.data)) {
          const upstreamAdmins = json.data;
          const mergedMap = new Map<string, any>();
          for (const a of upstreamAdmins) {
            if (a?.email || a?.id) mergedMap.set((a.email || a.id).toLowerCase(), a);
          }
          let localAdmins: any[] = [];
          try {
            const users = await readLocalStoreJson<any[]>('users.json');
            if (Array.isArray(users)) {
              localAdmins = users.filter((u: any) => u.role === 'ADMIN');
            }
          } catch {}
          for (const a of localAdmins) {
            if (a?.email || a?.id) {
              const k = (a.email || a.id).toLowerCase();
              if (!mergedMap.has(k)) mergedMap.set(k, a);
            }
          }
          for (const a of getDynamicAdmins()) {
            if (a?.email || a?.id) {
              const k = (a.email || a.id).toLowerCase();
              if (!mergedMap.has(k)) mergedMap.set(k, a);
            }
          }
          const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
          if (vaultCookie) {
            const vaultList = verifyVaultToken(vaultCookie);
            for (const a of vaultList) {
              if (a?.email || a?.id) {
                const k = (a.email || a.id).toLowerCase();
                if (!mergedMap.has(k)) mergedMap.set(k, a);
              }
            }
          }
          const allAdmins = Array.from(mergedMap.values()).map(sanitizeUser);
          return NextResponse.json({ success: true, data: allAdmins });
        }
      } catch {}
      return upstream;
    }
    if (upstream.status !== 404 && upstream.status !== 502 && upstream.status !== 503 && upstream.status !== 504) {
      return upstream;
    }

    // Fallback Tier 1: Query MongoDB directly if connection string is configured
    try {
      const db = await getMongoDb();
      if (db) {
        const users = await db.collection('users').find({ role: 'ADMIN' }).toArray();
        if (users && users.length > 0) {
          return NextResponse.json({ success: true, data: users.map(sanitizeUser) });
        }
      }
    } catch {}

    // Fallback Tier 2: Query coAdmins stored securely in backend settings repository
    const settings = await fetchBackendSettings(token);
    const coAdmins: any[] = settings?.coAdmins || [];

    // Fallback Tier 3: Local data_store fallback
    let localAdmins: any[] = [];
    try {
      const users = await readLocalStoreJson<any[]>('users.json');
      if (Array.isArray(users)) {
        localAdmins = users.filter((u: any) => u.role === 'ADMIN');
      }
    } catch {}

    // Merge and deduplicate administrators across all tiers
    const mergedMap = new Map<string, any>();
    for (const a of localAdmins) {
      if (a?.email || a?.id) mergedMap.set((a.email || a.id).toLowerCase(), a);
    }
    for (const a of coAdmins) {
      if (a?.email || a?.id) mergedMap.set((a.email || a.id).toLowerCase(), a);
    }
    for (const a of getDynamicAdmins()) {
      if (a?.email || a?.id) mergedMap.set((a.email || a.id).toLowerCase(), a);
    }
    const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
    if (vaultCookie) {
      const vaultList = verifyVaultToken(vaultCookie);
      for (const a of vaultList) {
        if (a?.email || a?.id) mergedMap.set((a.email || a.id).toLowerCase(), a);
      }
    }

    const allAdmins = Array.from(mergedMap.values()).map(sanitizeUser);
    return NextResponse.json({ success: true, data: allAdmins });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: err?.message || 'Failed to fetch administrators.' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  const cloned = request.clone();

  try {
    const upstream = await proxyToBackend(request, '/admin/admins');
    if (upstream.ok) {
      try {
        const body = await cloned.json();
        const { name, email, username, password, phone, avatar } = body || {};
        if (email && password) {
          const cleanEmail = String(email).trim().toLowerCase();
          const cleanUsername = (username ? String(username).trim().toLowerCase() : cleanEmail.split('@')[0])
            .replace(/[^a-z0-9_]/g, '')
            .slice(0, 30);
          const newAdmin = {
            id: `user_admin_${crypto.randomUUID().slice(0, 8)}`,
            name: String(name || cleanUsername).trim(),
            email: cleanEmail,
            username: cleanUsername,
            role: 'ADMIN',
            phone: phone ? String(phone).trim() : '',
            avatar: avatar ? String(avatar).trim() : '',
            addresses: [],
            passwordHash: hashPassword(password),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          registerDynamicAdmin(newAdmin);

          const currentVault = request.cookies.get('nextech_coadmins_vault')?.value;
          const existingVaultAdmins = currentVault ? verifyVaultToken(currentVault) : [];
          const updatedVaultAdmins = [
            ...existingVaultAdmins.filter((a: any) => a.id !== newAdmin.id && a.email?.toLowerCase() !== cleanEmail),
            newAdmin,
          ];
          const vaultToken = createVaultToken(updatedVaultAdmins);

          const resHeaders = new Headers(upstream.headers);
          const resBody = await upstream.arrayBuffer();
          const modifiedRes = new NextResponse(resBody, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: resHeaders,
          });
          modifiedRes.cookies.set('nextech_coadmins_vault', vaultToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
          });
          return modifiedRes;
        }
      } catch {}
      return upstream;
    }
    if (upstream.status !== 404 && upstream.status !== 502 && upstream.status !== 503 && upstream.status !== 504) {
      return upstream;
    }

    // Fallback: If cPanel backend returns 404, insert administrator directly
    const body = await cloned.json();
    const { name, email, username, password, phone, avatar } = body;

    if (!name || !email || !password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: { message: 'Name, valid email, and password of at least 8 characters are required.' } },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    const cleanUsername = (username ? String(username).trim().toLowerCase() : cleanEmail.split('@')[0])
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);

    const newAdmin = {
      id: `user_admin_${crypto.randomUUID().slice(0, 8)}`,
      name: cleanName,
      email: cleanEmail,
      username: cleanUsername,
      role: 'ADMIN',
      phone: phone ? String(phone).trim() : '',
      avatar: avatar ? String(avatar).trim() : '',
      addresses: [],
      passwordHash: hashPassword(password),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Direct MongoDB insert if connected
    try {
      const db = await getMongoDb();
      if (db) {
        const existing = await db.collection('users').findOne({
          $or: [{ email: cleanEmail }, { username: cleanUsername }],
        });
        if (existing) {
          return NextResponse.json(
            { success: false, error: { message: 'An account with this email or username already exists.' } },
            { status: 409 }
          );
        }
        await db.collection('users').insertOne({ ...newAdmin });
      }
    } catch {}

    // 2. Dual persistence into backend settings repository via authenticated admin API
    const settings = await fetchBackendSettings(token);
    const existingCoAdmins: any[] = settings?.coAdmins || [];
    const duplicate = existingCoAdmins.some(
      (a: any) =>
        a.email?.toLowerCase() === cleanEmail ||
        (a.username && a.username.toLowerCase() === cleanUsername)
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, error: { message: 'An account with this email or username already exists.' } },
        { status: 409 }
      );
    }

    const updatedCoAdmins = [
      ...existingCoAdmins.filter((a: any) => a.id !== newAdmin.id && a.email !== newAdmin.email),
      newAdmin,
    ];
    await saveBackendSettings(token, { coAdmins: updatedCoAdmins });

    // Register dynamically in memory immediately
    registerDynamicAdmin(newAdmin);

    // Prepare updated cookie vault list
    const currentVault = request.cookies.get('nextech_coadmins_vault')?.value;
    const existingVaultAdmins = currentVault ? verifyVaultToken(currentVault) : [];
    const updatedVaultAdmins = [
      ...existingVaultAdmins.filter((a: any) => a.id !== newAdmin.id && a.email?.toLowerCase() !== cleanEmail),
      newAdmin,
    ];
    const vaultToken = createVaultToken(updatedVaultAdmins);

    const response = NextResponse.json(
      {
        success: true,
        data: sanitizeUser(newAdmin),
        message: 'New administrator account created successfully with full administrative permissions.',
      },
      { status: 201 }
    );

    response.cookies.set('nextech_coadmins_vault', vaultToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to create administrator.' } },
      { status: 500 }
    );
  }
}
