import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { FALLBACK_USERS, FALLBACK_RESELLERS } from '@/lib/fallback-data';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_local_jwt_secret_change_in_env';

function sanitizeUser(user: any): User {
  const { passwordHash, ...safeUser } = user;
  return safeUser as User;
}

export async function GET(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const authHeader = request.headers.get('authorization');

  // Try external backend if configured
  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/auth/me`, {
        headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  // Try local backend
  if (process.env.NODE_ENV === 'development') {
    try {
      const res = await fetch('http://localhost:5000/api/auth/me', {
        headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
        signal: AbortSignal.timeout(1500),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication token missing.' } },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user: User = (FALLBACK_USERS.find(u => u.id === decoded.id || u.email === decoded.email) || {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'CUSTOMER',
      name: decoded.email?.split('@')[0] || 'User',
      username: decoded.email?.split('@')[0] || 'user',
      addresses: [],
      resellerId: decoded.resellerId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }) as User;

    const reseller = user.resellerId ? FALLBACK_RESELLERS.find(r => r.id === user.resellerId) || null : null;

    return NextResponse.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        reseller,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired.' } },
      { status: 401 }
    );
  }
}
