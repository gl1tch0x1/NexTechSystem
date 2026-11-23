import { NextRequest, NextResponse } from 'next/server';
import {
  proxyToBackend,
  fetchBackendSettings,
  saveBackendSettings,
  updateDynamicAdmin,
  markAdminDeleted,
  createVaultToken,
  verifyVaultToken,
} from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value || '';

  const [adminId] = path;

  // 1. Check direct MongoDB
  try {
    const db = await getMongoDb();
    if (db) {
      const user = await db.collection('users').findOne({ id: adminId, role: 'ADMIN' });
      if (user) {
        return NextResponse.json({ success: true, data: sanitizeUser(user) });
      }
    }
  } catch {}

  // 2. Check upstream Express backend
  try {
    const upstream = await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
    if (upstream.ok) return upstream;
  } catch {}

  // 3. Check backend settings coAdmins
  try {
    const settings = await fetchBackendSettings(token);
    const coAdmins: any[] = settings?.coAdmins || [];
    const matched = coAdmins.find((a: any) => a.id === adminId);
    if (matched) {
      return NextResponse.json({ success: true, data: sanitizeUser(matched) });
    }
  } catch {}

  return NextResponse.json({ success: false, error: { message: 'Administrator not found.' } }, { status: 404 });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value || '';

  const [adminId, subAction] = path;

  if (subAction === 'status') {
    let newStatus = false;
    let targetAdmin: any = null;

    // 1. Authoritative update in MongoDB
    try {
      const db = await getMongoDb();
      if (db) {
        const admin = await db.collection('users').findOne({ id: adminId, role: 'ADMIN' });
        if (admin) {
          targetAdmin = admin;
          newStatus = !admin.isActive;
          await db.collection('users').updateOne(
            { id: adminId },
            { $set: { isActive: newStatus, updatedAt: new Date().toISOString() } }
          );
        }
      }
    } catch (err: any) {
      console.warn('[MongoDB Admin Status Update Warning]:', err?.message || err);
    }

    // 2. Update in backend settings coAdmins
    try {
      const settings = await fetchBackendSettings(token);
      const coAdmins: any[] = settings?.coAdmins || [];
      const foundInSettings = coAdmins.find((a: any) => a.id === adminId);
      if (foundInSettings) {
        if (!targetAdmin) {
          targetAdmin = foundInSettings;
          newStatus = !foundInSettings.isActive;
        }
        const updatedCoAdmins = coAdmins.map((a: any) =>
          a.id === adminId ? { ...a, isActive: newStatus, updatedAt: new Date().toISOString() } : a
        );
        await saveBackendSettings(token, { coAdmins: updatedCoAdmins });
      }
    } catch {}

    // 3. Update dynamic in-memory registry
    updateDynamicAdmin(adminId, { isActive: newStatus });

    // 4. Relay to upstream backend
    try {
      await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
    } catch {}

    // 5. Update browser cookie vault
    const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
    let vaultToken = '';
    if (vaultCookie) {
      try {
        const vaultAdmins = verifyVaultToken(vaultCookie);
        const updatedVault = vaultAdmins.map((a: any) =>
          a.id === adminId ? { ...a, isActive: newStatus, updatedAt: new Date().toISOString() } : a
        );
        vaultToken = createVaultToken(updatedVault);
      } catch {}
    }

    const updatedUser = {
      ...(targetAdmin || { id: adminId }),
      isActive: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      data: sanitizeUser(updatedUser),
      message: `Administrator status updated to ${newStatus ? 'Active' : 'Suspended'}.`,
    });

    if (vaultToken) {
      response.cookies.set('nextech_coadmins_vault', vaultToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
    }

    return response;
  }

  // Generic PUT relay
  return proxyToBackend(request, `/admin/admins/${path.join('/')}`);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const token =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    request.cookies.get('auth_token')?.value || '';

  const [adminId] = path;
  const cleanId = String(adminId || '').trim();
  const cleanLower = cleanId.toLowerCase();

  let targetEmail = '';
  let targetAdminId = cleanId;

  // 1. Authoritative delete from MongoDB collection 'users'
  try {
    const db = await getMongoDb();
    if (db) {
      const usersCol = db.collection('users');
      const orConditions: any[] = [
        { id: cleanId },
        { email: cleanLower },
        { username: cleanLower },
      ];
      if (ObjectId.isValid(cleanId) && cleanId.length === 24) {
        orConditions.push({ _id: new ObjectId(cleanId) });
      }

      // Find user first so we have canonical id and email
      const existing = await usersCol.findOne({
        role: 'ADMIN',
        $or: orConditions,
      });

      if (existing) {
        targetEmail = String(existing.email || '').toLowerCase().trim();
        targetAdminId = String(existing.id || cleanId);
      }

      // Remove from users collection
      await usersCol.deleteMany({
        role: 'ADMIN',
        $or: orConditions,
      });

      // Remove from global settings coAdmins in MongoDB
      try {
        await db.collection('settings').updateOne(
          { id: 'global_settings' },
          {
            $pull: {
              coAdmins: {
                $or: [
                  { id: cleanId },
                  { id: targetAdminId },
                  ...(targetEmail ? [{ email: targetEmail }] : [{ email: cleanLower }]),
                ],
              },
            },
          } as any
        );
      } catch {}

      // Register in deleted_admins collection so auto-sync never resurrects this account
      try {
        const deletedCol = db.collection('deleted_admins');
        await deletedCol.updateOne(
          { target: cleanLower },
          {
            $set: {
              target: cleanLower,
              id: targetAdminId,
              email: targetEmail || cleanLower,
              deletedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
        if (targetEmail && targetEmail !== cleanLower) {
          await deletedCol.updateOne(
            { target: targetEmail },
            {
              $set: {
                target: targetEmail,
                id: targetAdminId,
                email: targetEmail,
                deletedAt: new Date().toISOString(),
              },
            },
            { upsert: true }
          );
        }
      } catch {}
    }
  } catch (err: any) {
    console.warn('[MongoDB Admin Delete Warning]:', err?.message || err);
  }

  // 2. Delete from backend settings coAdmins
  try {
    const settings = await fetchBackendSettings(token);
    const coAdmins: any[] = settings?.coAdmins || [];
    const updatedCoAdmins = coAdmins.filter(
      (a: any) =>
        a.id !== cleanId &&
        a.id !== targetAdminId &&
        a.email?.toLowerCase() !== cleanLower &&
        (!targetEmail || a.email?.toLowerCase() !== targetEmail)
    );
    await saveBackendSettings(token, { coAdmins: updatedCoAdmins });
  } catch {}

  // 3. Mark as deleted in dynamic in-memory registry
  markAdminDeleted(cleanId);
  markAdminDeleted(cleanLower);
  if (targetAdminId) markAdminDeleted(targetAdminId);
  if (targetEmail) markAdminDeleted(targetEmail);

  // 4. Relay delete to upstream backend
  try {
    await proxyToBackend(request, `/admin/admins/${path.join('/')}`);
  } catch {}

  // 5. Update browser cookie vault
  const vaultCookie = request.cookies.get('nextech_coadmins_vault')?.value;
  let vaultToken = '';
  if (vaultCookie) {
    try {
      const vaultAdmins = verifyVaultToken(vaultCookie);
      const updatedVault = vaultAdmins.filter(
        (a: any) =>
          a.id !== cleanId &&
          a.id !== targetAdminId &&
          a.email?.toLowerCase() !== cleanLower &&
          (!targetEmail || a.email?.toLowerCase() !== targetEmail)
      );
      vaultToken = createVaultToken(updatedVault);
    } catch {}
  }

  const response = NextResponse.json({
    success: true,
    message: 'Administrator permanently removed.',
  });

  if (vaultToken) {
    response.cookies.set('nextech_coadmins_vault', vaultToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
  }

  return response;
}
