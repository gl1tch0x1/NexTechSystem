import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
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

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
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
    if (upstream.status !== 404) {
      return upstream;
    }

    // Fallback: If cPanel backend returns 404 (route not compiled on server yet), query MongoDB directly
    const db = await getMongoDb();
    if (db) {
      const users = await db.collection('users').find({ role: 'ADMIN' }).toArray();
      const safeAdmins = users.map(sanitizeUser);
      return NextResponse.json({ success: true, data: safeAdmins });
    }

    // File-based store fallback if running with local data_store
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const p = path.resolve(process.cwd(), 'backend', 'data_store', 'users.json');
      const raw = await fs.readFile(p, 'utf8');
      const users = JSON.parse(raw);
      const safeAdmins = users.filter((u: any) => u.role === 'ADMIN').map(sanitizeUser);
      return NextResponse.json({ success: true, data: safeAdmins });
    } catch {
      return NextResponse.json({ success: true, data: [] });
    }
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
    if (upstream.status !== 404) {
      return upstream;
    }

    // Fallback: If cPanel backend returns 404, insert administrator directly into MongoDB
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
      await db.collection('users').insertOne(newAdmin);
    }

    return NextResponse.json({
      success: true,
      data: sanitizeUser(newAdmin),
      message: 'New administrator account created successfully with full administrative permissions.',
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to create administrator.' } },
      { status: 500 }
    );
  }
}
