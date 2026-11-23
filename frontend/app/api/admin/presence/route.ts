import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, verifyJwtToken } from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';

interface OnlineSession {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'PRODUCT_EDITOR' | 'RESELLER';
  avatar?: string;
  currentPath: string;
  lastSeen: number;
  device?: string;
  status: 'ONLINE' | 'AWAY';
}

const fallbackSessions = new Map<string, OnlineSession>();
const ALLOWED_STAFF_ROLES = new Set(['ADMIN', 'PRODUCT_EDITOR', 'RESELLER']);
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function parseTokenPayloadSafely(token: string): any {
  try {
    const verified = verifyJwtToken(token);
    if (verified) return verified;
    const parts = token.split('.');
    if (parts.length === 3) {
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    }
  } catch {}
  return null;
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

  const callerUser = parseTokenPayloadSafely(token);
  const now = Date.now();
  const cutoff = now - ONLINE_THRESHOLD_MS;
  const sessionMap = new Map<string, OnlineSession>();

  try {
    // 1. Authoritative source: MongoDB Atlas 'staff_presence' collection
    try {
      const db = await getMongoDb();
      if (db) {
        const mongoSessions = await db.collection('staff_presence').find({
          lastSeen: { $gte: cutoff },
        }).toArray();

        for (const doc of mongoSessions) {
          const uId = String(doc.userId || doc.id || doc.email);
          const elapsed = now - Number(doc.lastSeen || 0);
          const status = elapsed > 2 * 60 * 1000 ? 'AWAY' : 'ONLINE';
          sessionMap.set(uId.toLowerCase(), {
            id: String(doc.id || uId),
            userId: String(doc.userId || uId),
            name: String(doc.name || 'Staff'),
            email: String(doc.email || ''),
            username: String(doc.username || (doc.email ? String(doc.email).split('@')[0] : 'staff')),
            role: (doc.role || 'ADMIN') as any,
            avatar: doc.avatar || '',
            currentPath: doc.currentPath || '/admin',
            lastSeen: Number(doc.lastSeen || now),
            device: doc.device || 'desktop',
            status,
          });
        }
      }
    } catch (err: any) {
      console.warn('[Presence GET Mongo Warning]:', err?.message || err);
    }

    // 2. Query upstream backend if available
    try {
      const upstream = await proxyToBackend(request, '/admin/presence');
      if (upstream.ok) {
        const json = await upstream.json();
        if (json && Array.isArray(json.data)) {
          for (const s of json.data) {
            const key = String(s.userId || s.id || s.email || '').toLowerCase();
            if (key && !sessionMap.has(key)) {
              sessionMap.set(key, s);
            }
          }
        }
      }
    } catch {}

    // 3. Fallback: in-memory sessions
    for (const [userId, session] of fallbackSessions.entries()) {
      const elapsed = now - session.lastSeen;
      if (elapsed <= ONLINE_THRESHOLD_MS) {
        const status = elapsed > 2 * 60 * 1000 ? 'AWAY' : 'ONLINE';
        const key = (session.userId || userId).toLowerCase();
        if (!sessionMap.has(key)) {
          sessionMap.set(key, { ...session, status });
        }
      } else {
        fallbackSessions.delete(userId);
      }
    }

    // 4. Always ensure the currently authenticated caller is reflected in the active roster
    if (callerUser && callerUser.id && (!callerUser.role || ALLOWED_STAFF_ROLES.has(callerUser.role))) {
      const callerKey = (callerUser.id || callerUser.email || '').toLowerCase();
      if (!sessionMap.has(callerKey)) {
        sessionMap.set(callerKey, {
          id: callerUser.id,
          userId: callerUser.id,
          name: callerUser.name || (callerUser.role === 'ADMIN' ? 'Administrator' : 'Staff Member'),
          email: callerUser.email || '',
          username: callerUser.username || (callerUser.email ? callerUser.email.split('@')[0] : 'admin'),
          role: (callerUser.role || 'ADMIN') as any,
          avatar: callerUser.avatar || '',
          currentPath: '/admin',
          lastSeen: now,
          device: 'desktop',
          status: 'ONLINE',
        });
      }
    }

    const active = Array.from(sessionMap.values());

    return NextResponse.json({
      success: true,
      count: active.length,
      data: active,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Failed to fetch online staff.' } },
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

  const callerUser = parseTokenPayloadSafely(token);

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { user: bodyUser, currentPath = '/admin', device = 'desktop' } = body || {};
  const effectiveUser = bodyUser && bodyUser.id ? bodyUser : callerUser;

  if (!effectiveUser || !effectiveUser.id || (effectiveUser.role && !ALLOWED_STAFF_ROLES.has(effectiveUser.role))) {
    return NextResponse.json({ success: true, message: 'Presence skipped for non-staff role.' });
  }

  const session: OnlineSession = {
    id: effectiveUser.id,
    userId: effectiveUser.id,
    name: effectiveUser.name || (effectiveUser.role === 'ADMIN' ? 'Administrator' : effectiveUser.role === 'PRODUCT_EDITOR' ? 'Product Editor' : 'Reseller Partner'),
    email: effectiveUser.email || '',
    username: effectiveUser.username || (effectiveUser.email ? effectiveUser.email.split('@')[0] : 'staff'),
    role: effectiveUser.role || 'ADMIN',
    avatar: effectiveUser.avatar || '',
    currentPath: String(currentPath || '/admin').slice(0, 100),
    lastSeen: Date.now(),
    device: String(device || 'desktop').slice(0, 30),
    status: 'ONLINE',
  };

  // 1. Authoritative persistence in MongoDB Atlas 'staff_presence' collection
  try {
    const db = await getMongoDb();
    if (db) {
      await db.collection('staff_presence').updateOne(
        { userId: session.userId },
        {
          $set: {
            ...session,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }
  } catch (mongoErr: any) {
    console.warn('[MongoDB Presence Heartbeat Warning]:', mongoErr?.message || mongoErr);
  }

  // 2. In-memory presence cache
  fallbackSessions.set(session.userId, session);

  // 3. Relay heartbeat to upstream backend if available
  try {
    proxyToBackend(request, '/admin/presence/heartbeat', {
      body: JSON.stringify({ currentPath, device, user: session }),
    }).catch(() => {});
  } catch {}

  return NextResponse.json({ success: true, data: session });
}
