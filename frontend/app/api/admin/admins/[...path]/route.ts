import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/proxy-helper';
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

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  try {
    const upstream = await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
    if (upstream.status !== 404) return upstream;

    const [adminId] = path;
    const db = await getMongoDb();
    if (db) {
      const user = await db.collection('users').findOne({ id: adminId, role: 'ADMIN' });
      if (user) {
        return NextResponse.json({ success: true, data: sanitizeUser(user) });
      }
    }
    return upstream;
  } catch {
    return NextResponse.json({ success: false, error: { message: 'Administrator not found.' } }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  try {
    const upstream = await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
    if (upstream.status !== 404) return upstream;

    // Fallback: If cPanel backend returns 404, toggle status in MongoDB
    const [adminId, subAction] = path;
    if (subAction === 'status') {
      const db = await getMongoDb();
      if (db) {
        const admin = await db.collection('users').findOne({ id: adminId, role: 'ADMIN' });
        if (admin) {
          const newStatus = !admin.isActive;
          await db.collection('users').updateOne(
            { id: adminId },
            { $set: { isActive: newStatus, updatedAt: new Date().toISOString() } }
          );
          return NextResponse.json({
            success: true,
            data: { ...sanitizeUser(admin), isActive: newStatus },
            message: `Administrator status updated to ${newStatus ? 'Active' : 'Suspended'}.`,
          });
        }
      }
    }
    return upstream;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err?.message || 'Failed to update status.' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  try {
    const upstream = await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
    if (upstream.status !== 404) return upstream;

    // Fallback: If cPanel backend returns 404, delete from MongoDB
    const [adminId] = path;
    const db = await getMongoDb();
    if (db) {
      await db.collection('users').deleteOne({ id: adminId, role: 'ADMIN' });
      return NextResponse.json({ success: true, message: 'Administrator permanently removed.' });
    }
    return upstream;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: { message: err?.message || 'Failed to remove administrator.' } }, { status: 500 });
  }
}
