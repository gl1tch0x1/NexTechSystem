import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_insecure_local_jwt_secret_change_in_env';

export async function POST(request: NextRequest) {
  const backendUrl = process.env.API_PROXY_TARGET || process.env.BACKEND_URL;
  const body = await request.json().catch(() => ({}));
  const { name, email, username, phone } = body;

  if (backendUrl && !backendUrl.includes('localhost') && !backendUrl.includes('127.0.0.1')) {
    const clean = backendUrl.replace(/\/$/, '').replace(/\/api$/, '');
    try {
      const res = await fetch(`${clean}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      const json = await res.json();
      return NextResponse.json(json, { status: res.status });
    } catch {
      // Fall through
    }
  }

  const id = `user_${Date.now()}`;
  const cleanEmail = (email || '').toLowerCase().trim();
  const newUser = {
    id,
    email: cleanEmail,
    role: 'CUSTOMER' as const,
    name: name || 'Customer',
    username: username || cleanEmail.split('@')[0],
    phone: phone || '',
    addresses: [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return NextResponse.json({
    success: true,
    data: {
      token,
      user: newUser,
    },
  });
}
