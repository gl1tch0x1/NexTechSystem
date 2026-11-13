import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, getBackendApiUrl } from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';

type RouteContext = { params: Promise<{ path: string[] }> };

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

async function fetchBackendSettings(token: string) {
  try {
    const target = `${getBackendApiUrl()}/api/admin/settings`;
    const res = await fetch(target, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      return json?.data || json;
    }
  } catch {}
  return null;
}

async function saveBackendSettings(token: string, payload: any) {
  try {
    const target = `${getBackendApiUrl()}/api/admin/settings`;
    const res = await fetch(target, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    return res.ok;
  } catch {}
  return false;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value || '';

  try {
    const upstream = await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
    if (upstream.ok || (upstream.status !== 404 && upstream.status !== 502 && upstream.status !== 503 && upstream.status !== 504)) return upstream;

    const [adminId] = path;

    // Check direct MongoDB
    try {
      const db = await getMongoDb();
      if (db) {
        const user = await db.collection('users').findOne({ id: adminId, role: 'ADMIN' });
        if (user) {
          return NextResponse.json({ success: true, data: sanitizeUser(user) });
        }
      }
    } catch {}

    // Check backend settings coAdmins
    const settings = await fetchBackendSettings(token);
    const coAdmins: any[] = settings?.coAdmins || [];
    const matched = coAdmins.find((a: any) => a.id === adminId);
    if (matched) {
      return NextResponse.json({ success: true, data: sanitizeUser(matched) });
    }

    return upstream;
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Administrator not found.' } }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value || '';

  try {
    const upstream = await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
    if (upstream.ok || (upstream.status !== 404 && upstream.status !== 502 && upstream.status !== 503 && upstream.status !== 504)) return upstream;

    // Fallback: If cPanel backend returns 404, toggle status
    const [adminId, subAction] = path;
    if (subAction === 'status') {
      let updatedUser: any = null;

      // Update in MongoDB
      try {
        const db = await getMongoDb();
        if (db) {
          const admin = await db.collection('users').findOne({ id: adminId, role: 'ADMIN' });
          if (admin) {
            const newStatus = !admin.isActive;
            await db.collection('users').updateOne(
              { id: adminId },
              { $set: { isActive: newStatus, updatedAt: new Date().toISOString() } }
            );
            updatedUser = { ...admin, isActive: newStatus };
          }
        }
      } catch {}

      // Update in backend settings coAdmins
      const settings = await fetchBackendSettings(token);
      const coAdmins: any[] = settings?.coAdmins || [];
      const targetAdmin = coAdmins.find((a: any) => a.id === adminId);
      if (targetAdmin) {
        const newStatus = !targetAdmin.isActive;
        const updatedCoAdmins = coAdmins.map((a: any) =>
          a.id === adminId ? { ...a, isActive: newStatus, updatedAt: new Date().toISOString() } : a
        );
        await saveBackendSettings(token, { coAdmins: updatedCoAdmins });
        if (!updatedUser) {
          updatedUser = { ...targetAdmin, isActive: newStatus };
        }
      }

      // Update in local users.json if present
      try {
        const fs = await import('fs/promises');
        const p = (await import('path')).resolve(process.cwd(), 'backend', 'data_store', 'users.json');
        const raw = await fs.readFile(p, 'utf8');
        const users = JSON.parse(raw);
        const idx = users.findIndex((u: any) => u.id === adminId);
        if (idx !== -1) {
          users[idx].isActive = !users[idx].isActive;
          users[idx].updatedAt = new Date().toISOString();
          await fs.writeFile(p, JSON.stringify(users, null, 2), 'utf8');
          if (!updatedUser) updatedUser = users[idx];
        }
      } catch {}

      if (updatedUser) {
        return NextResponse.json({
          success: true,
          data: sanitizeUser(updatedUser),
          message: `Administrator status updated to ${updatedUser.isActive ? 'Active' : 'Suspended'}.`,
        });
      }
    }

    return upstream;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err?.message || 'Failed to update status.' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value || '';

  try {
    const upstream = await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
    if (upstream.ok || (upstream.status !== 404 && upstream.status !== 502 && upstream.status !== 503 && upstream.status !== 504)) return upstream;

    // Fallback: If cPanel backend returns 404, delete from storage
    const [adminId] = path;

    // Delete from MongoDB
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('users').deleteOne({ id: adminId, role: 'ADMIN' });
      }
    } catch {}

    // Delete from backend settings coAdmins
    const settings = await fetchBackendSettings(token);
    const coAdmins: any[] = settings?.coAdmins || [];
    const updatedCoAdmins = coAdmins.filter((a: any) => a.id !== adminId);
    await saveBackendSettings(token, { coAdmins: updatedCoAdmins });

    // Delete from local users.json
    try {
      const fs = await import('fs/promises');
      const p = (await import('path')).resolve(process.cwd(), 'backend', 'data_store', 'users.json');
      const raw = await fs.readFile(p, 'utf8');
      const users = JSON.parse(raw);
      const filtered = users.filter((u: any) => u.id !== adminId);
      await fs.writeFile(p, JSON.stringify(filtered, null, 2), 'utf8');
    } catch {}

    return NextResponse.json({ success: true, message: 'Administrator permanently removed.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err?.message || 'Failed to remove administrator.' } }, { status: 500 });
  }
}
