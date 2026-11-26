import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  proxyToBackend,
  hashPassword,
  authorizeRequestRoles,
} from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';

// RFC 5322 / HTML5 standard email regex with explicit length bounds to prevent Polynomial ReDoS (CWE-1333)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function sanitizeEditor(u: any): any {
  if (!u) return null;
  const { passwordHash: _hash, _id, ...safe } = u;
  return safe;
}

export async function GET(request: NextRequest) {
  const authError = authorizeRequestRoles(request);
  if (authError) return authError;
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  const editorsMap = new Map<string, any>();
  const deletedSet = new Set<string>();

  // 1. Check deleted_editors collection to filter any purged editors
  try {
    const db = await getMongoDb();
    if (db) {
      const deletedDocs = await db.collection('deleted_editors').find().toArray();
      for (const d of deletedDocs) {
        if (d.id) deletedSet.add(String(d.id).toLowerCase());
        if (d.email) deletedSet.add(String(d.email).toLowerCase());
      }

      // 2. Query authoritative MongoDB users collection for role === 'PRODUCT_EDITOR'
      const mongoEditors = await db.collection('users').find({ role: 'PRODUCT_EDITOR' }).toArray();
      for (const ed of mongoEditors) {
        const idLower = String(ed.id || '').toLowerCase();
        const emailLower = String(ed.email || '').toLowerCase();
        if (deletedSet.has(idLower) || deletedSet.has(emailLower)) continue;
        editorsMap.set(idLower || emailLower, sanitizeEditor(ed));
      }
    }
  } catch (mongoErr: any) {
    console.warn('[MongoDB Editors GET Warning]:', mongoErr?.message || mongoErr);
  }

  // 3. Query upstream backend if available and merge
  try {
    const upstream = await proxyToBackend(request, '/admin/editors');
    if (upstream.ok) {
      const json = await upstream.json();
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
      for (const ed of list) {
        const idLower = String(ed.id || '').toLowerCase();
        const emailLower = String(ed.email || '').toLowerCase();
        if (deletedSet.has(idLower) || deletedSet.has(emailLower)) continue;
        if (!editorsMap.has(idLower || emailLower)) {
          editorsMap.set(idLower || emailLower, sanitizeEditor(ed));
        }
      }
    }
  } catch {}

  const result = Array.from(editorsMap.values());
  return NextResponse.json({
    success: true,
    count: result.length,
    data: result,
  });
}

export async function POST(request: NextRequest) {
  const authError = authorizeRequestRoles(request);
  if (authError) return authError;
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
      { success: false, error: { message: 'Invalid JSON payload in request body.' } },
      { status: 400 }
    );
  }

  const { name, email, username, password, phone } = body || {};

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

  if (!cleanName || cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail) || !cleanUsername) {
    return NextResponse.json(
      { success: false, error: { message: 'Please provide a valid name, email address, and username.' } },
      { status: 400 }
    );
  }

  const newEditor = {
    id: `user_editor_${crypto.randomUUID().slice(0, 8)}`,
    name: cleanName,
    email: cleanEmail,
    username: cleanUsername,
    role: 'PRODUCT_EDITOR',
    phone: phone ? String(phone).trim() : '',
    addresses: [],
    passwordHash: hashPassword(password),
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Authoritative direct insert into MongoDB Atlas 'users' collection
  try {
    const db = await getMongoDb();
    if (db) {
      const usersCol = db.collection('users');

      // Verify email uniqueness
      const existingUser = await usersCol.findOne({
        $or: [{ email: cleanEmail }, { username: cleanUsername }],
      });
      if (existingUser && existingUser.id !== newEditor.id) {
        if (existingUser.email?.toLowerCase() === cleanEmail) {
          return NextResponse.json(
            { success: false, error: { message: 'An account with this email already exists.' } },
            { status: 400 }
          );
        }
        if (existingUser.username?.toLowerCase() === cleanUsername) {
          return NextResponse.json(
            { success: false, error: { message: 'An account with this username already exists.' } },
            { status: 409 }
          );
        }
      }

      await usersCol.updateOne(
        { $or: [{ email: cleanEmail }, { username: cleanUsername }, { id: newEditor.id }] },
        { $set: { ...newEditor } },
        { upsert: true }
      );

      // Remove from deleted_editors if previously removed
      try {
        await db.collection('deleted_editors').deleteMany({
          $or: [
            { target: cleanEmail },
            { email: cleanEmail },
            { id: newEditor.id },
            { target: cleanUsername },
          ],
        });
      } catch {}
    }
  } catch (mongoErr: any) {
    console.warn('[MongoDB Insert Editor Warning]:', mongoErr?.message || mongoErr);
  }

  // 2. Relay creation to upstream backend API if available
  try {
    await proxyToBackend(request, '/admin/editors', {
      body: JSON.stringify({
        name: newEditor.name,
        email: newEditor.email,
        username: newEditor.username,
        password,
        phone: newEditor.phone,
      }),
    });
  } catch {}

  return NextResponse.json(
    {
      success: true,
      message: 'Product editor account created successfully.',
      data: sanitizeEditor(newEditor),
    },
    { status: 201 }
  );
}
