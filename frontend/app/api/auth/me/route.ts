import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/token';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_local_jwt_secret_change_in_env';

function sanitizeUser(user: any): User {
  const { passwordHash, ...safeUser } = user;
  return safeUser as User;
}

export async function GET(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const authHeader = request.headers.get('authorization');
  const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');

  try {
    const res = await fetch(`${clean}/api/auth/me`, {
      headers: { ...(authHeader ? { Authorization: authHeader } : {}) },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    }
  } catch {
    // Fall through
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication token missing.' } },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyJwt(token, JWT_SECRET) as any;
    const user: User = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'CUSTOMER',
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
      username: decoded.username || decoded.email?.split('@')[0] || 'user',
      addresses: [],
      resellerId: decoded.resellerId,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as User;

    const reseller = null;

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
