import { NextRequest, NextResponse } from 'next/server';
import {
  proxyToBackend,
  fetchBackendSettings,
  saveBackendSettings,
  hashPassword,
  readLocalStoreJson,
  registerDynamicAdmin,
  getDynamicAdmins,
  isDeletedAdmin,
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
    const mergedMap = new Map<string, any>();

    // 1. Attempt to fetch administrators from upstream Express backend
    try {
      const upstream = await proxyToBackend(request, '/admin/admins');
      if (upstream.ok) {
        const json = await upstream.json();
        if (json && Array.isArray(json.data)) {
          for (const a of json.data) {
            if (a?.email || a?.id) mergedMap.set((a.email || a.id).toLowerCase(), a);
          }
        }
      }
    } catch {}

    // 2. Direct MongoDB query: authoritative cluster data in nextech_ecommerce database
    try {
      const db = await getMongoDb();
      if (db) {
        const mongoAdmins = await db.collection('users').find({ role: 'ADMIN' }).toArray();
        for (const a of mongoAdmins) {
          if (a?.email || a?.id) {
            const k = (a.email || a.id).toLowerCase();
            if (!mergedMap.has(k)) mergedMap.set(k, a);
          }
        }
      }
    } catch (err: any) {
      console.warn('[Admins GET Mongo Warning]:', err?.message || err);
    }

    // 3. Fallback: coAdmins stored in backend settings repository
    try {
      const settings = await fetchBackendSettings(token);
      const coAdmins: any[] = settings?.coAdmins || [];
      for (const a of coAdmins) {
        if (a?.email || a?.id) {
          const k = (a.email || a.id).toLowerCase();
          if (!mergedMap.has(k)) mergedMap.set(k, a);
        }
      }
    } catch {}

    // 4. Fallback: Bundled and local users.json data store
    try {
      const users = await readLocalStoreJson<any[]>('users.json');
      if (Array.isArray(users)) {
        for (const a of users.filter((u: any) => u.role === 'ADMIN')) {
          if (a?.email || a?.id) {
            const k = (a.email || a.id).toLowerCase();
            if (!mergedMap.has(k)) mergedMap.set(k, a);
          }
        }
      }
    } catch {}

    // 5. Dynamic in-memory administrator registry (active warm instance)
    for (const a of getDynamicAdmins()) {
      if (a?.email || a?.id) {
        const k = (a.email || a.id).toLowerCase();
        if (!mergedMap.has(k)) mergedMap.set(k, a);
      }
    }

    // 6. Resilient cookie vault for browser persistence
    const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
    if (vaultCookie) {
      try {
        const vaultList = verifyVaultToken(vaultCookie);
        for (const a of vaultList) {
          if (a?.email || a?.id) {
            const k = (a.email || a.id).toLowerCase();
            if (!mergedMap.has(k)) mergedMap.set(k, a);
          }
        }
      } catch {}
    }

    // 7. Filter out any administrator accounts recorded in deleted_admins registry
    const deletedIdentifiers = new Set<string>();
    try {
      const db = await getMongoDb();
      if (db) {
        const deletedDocs = await db.collection('deleted_admins').find().toArray();
        for (const doc of deletedDocs) {
          if (doc.target) deletedIdentifiers.add(String(doc.target).toLowerCase().trim());
          if (doc.id) deletedIdentifiers.add(String(doc.id).toLowerCase().trim());
          if (doc.email) deletedIdentifiers.add(String(doc.email).toLowerCase().trim());
        }
      }
    } catch {}

    const allAdmins = Array.from(mergedMap.values())
      .filter((a: any) => {
        const emailKey = (a.email || '').toLowerCase().trim();
        const idKey = (a.id || '').toLowerCase().trim();
        const userKey = (a.username || '').toLowerCase().trim();

        if (emailKey && (deletedIdentifiers.has(emailKey) || isDeletedAdmin(emailKey))) return false;
        if (idKey && (deletedIdentifiers.has(idKey) || isDeletedAdmin(idKey))) return false;
        if (userKey && (deletedIdentifiers.has(userKey) || isDeletedAdmin(userKey))) return false;
        return true;
      })
      .map(sanitizeUser);

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

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON request payload.' } },
      { status: 400 }
    );
  }

  const { name, email, username, password, phone, avatar } = body || {};

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

  // 1. Authoritative direct insert into MongoDB Atlas database "nextech_ecommerce", collection "users"
  try {
    const db = await getMongoDb();
    if (db) {
      const usersCol = db.collection('users');
      // Update or insert directly with full credentials and passwordHash
      await usersCol.updateOne(
        { $or: [{ email: cleanEmail }, { username: cleanUsername }, { id: newAdmin.id }] },
        { $set: { ...newAdmin } },
        { upsert: true }
      );
      console.log(`[MongoDB] Created/updated admin directly in nextech_ecommerce.users (id: ${newAdmin.id})`);

      // Clear from deleted_admins registry if previously removed
      try {
        await db.collection('deleted_admins').deleteMany({
          $or: [
            { target: cleanEmail },
            { email: cleanEmail },
            { target: cleanUsername },
          ]
        });
      } catch {}

      // Also persist to settings collection coAdmins with passwordHash intact (NEVER sanitize when storing)
      try {
        const settingsCol = db.collection('settings');
        await settingsCol.updateOne(
          { id: 'global_settings' },
          {
            $pull: {
              coAdmins: {
                $or: [{ email: cleanEmail }, { username: cleanUsername }, { id: newAdmin.id }],
              },
            },
          } as any
        );
        await settingsCol.updateOne(
          { id: 'global_settings' },
          { $push: { coAdmins: newAdmin } } as any,
          { upsert: false }
        );
      } catch {}
    }
  } catch (mongoErr: any) {
    console.warn('[MongoDB Insert Admin Warning]:', mongoErr?.message || mongoErr);
  }

  // 2. Relay creation to upstream backend API if available
  try {
    await proxyToBackend(request, '/admin/admins', {
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        password,
        phone: newAdmin.phone,
        avatar: newAdmin.avatar,
      }),
    });
  } catch {}

  // 3. Save into backend settings coAdmins
  try {
    const settings = await fetchBackendSettings(token);
    const existingCoAdmins: any[] = settings?.coAdmins || [];
    const updatedCoAdmins = [
      ...existingCoAdmins.filter((a: any) => a.id !== newAdmin.id && a.email?.toLowerCase() !== cleanEmail),
      newAdmin,
    ];
    await saveBackendSettings(token, { coAdmins: updatedCoAdmins });
  } catch {}

  // 4. Register dynamically in memory
  registerDynamicAdmin(newAdmin);

  // 5. Update browser cookie vault
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
}
