import { NextRequest, NextResponse } from 'next/server';
import {
  proxyToBackend,
  fetchBackendSettings,
  saveBackendSettings,
  hashPassword,
  readLocalStoreJson,
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
    if (upstream.ok || (upstream.status !== 404 && upstream.status !== 502 && upstream.status !== 503 && upstream.status !== 504)) {
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

    // Merge and deduplicate administrators by ID or Email
    const mergedMap = new Map<string, any>();
    for (const a of localAdmins) {
      mergedMap.set(a.id || a.email, a);
    }
    for (const a of coAdmins) {
      mergedMap.set(a.id || a.email, a);
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
    if (upstream.ok || (upstream.status !== 404 && upstream.status !== 502 && upstream.status !== 503 && upstream.status !== 504)) {
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

    // 3. Local data_store fallback if present
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const p = path.resolve(process.cwd(), 'backend', 'data_store', 'users.json');
      const raw = await fs.readFile(p, 'utf8');
      const users = JSON.parse(raw);
      if (!users.some((u: any) => u.email === cleanEmail || u.username === cleanUsername)) {
        users.push(newAdmin);
        await fs.writeFile(p, JSON.stringify(users, null, 2), 'utf8');
      }
    } catch {}

    return NextResponse.json(
      {
        success: true,
        data: sanitizeUser(newAdmin),
        message: 'New administrator account created successfully with full administrative permissions.',
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to create administrator.' } },
      { status: 500 }
    );
  }
}
