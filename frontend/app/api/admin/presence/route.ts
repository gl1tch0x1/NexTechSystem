import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';

// Serverless fallback in-memory presence cache (for when upstream is deploying or in development)
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
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

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
    const upstream = await proxyToBackend(request, '/admin/presence');
    if (upstream.status !== 404) {
      return upstream;
    }

    // Fallback: Return filtered active staff from memory
    const now = Date.now();
    const active: OnlineSession[] = [];

    for (const [userId, session] of fallbackSessions.entries()) {
      const elapsed = now - session.lastSeen;
      if (elapsed <= ONLINE_THRESHOLD_MS) {
        const status = elapsed > 90 * 1000 ? 'AWAY' : 'ONLINE';
        active.push({ ...session, status });
      } else {
        fallbackSessions.delete(userId);
      }
    }

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

  const cloned = request.clone();

  try {
    const upstream = await proxyToBackend(request, '/admin/presence/heartbeat');
    if (upstream.status !== 404) {
      return upstream;
    }

    // Fallback: Record heartbeat in memory
    const body = await cloned.json();
    const { user, currentPath = '/admin', device = 'desktop' } = body || {};

    if (user && user.id && ALLOWED_STAFF_ROLES.has(user.role)) {
      const session: OnlineSession = {
        id: user.id,
        userId: user.id,
        name: user.name || (user.role === 'ADMIN' ? 'Administrator' : user.role === 'PRODUCT_EDITOR' ? 'Product Editor' : 'Reseller Partner'),
        email: user.email || '',
        username: user.username || (user.email ? user.email.split('@')[0] : 'staff'),
        role: user.role,
        avatar: user.avatar || '',
        currentPath,
        lastSeen: Date.now(),
        device,
        status: 'ONLINE',
      };
      fallbackSessions.set(user.id, session);
      return NextResponse.json({ success: true, data: session });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { message: err?.message || 'Heartbeat failed.' } },
      { status: 500 }
    );
  }
}

