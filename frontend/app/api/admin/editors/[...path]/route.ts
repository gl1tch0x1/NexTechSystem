import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequestRoles, proxyToBackend } from '@/lib/proxy-helper';
import { getMongoDb } from '@/lib/mongodb';

type RouteContext = { params: Promise<{ path: string[] }> };

function sanitizeEditor(u: any): any {
  if (!u) return null;
  const { passwordHash: _hash, _id, ...safe } = u;
  return safe;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const authError = authorizeRequestRoles(request);
  if (authError) return authError;
  const { path } = await params;
  const id = path[0];

  if (!id) {
    return NextResponse.json({ success: false, error: { message: 'Editor ID required' } }, { status: 400 });
  }

  try {
    const db = await getMongoDb();
    if (db) {
      const editor = await db.collection('users').findOne({
        id,
        role: 'PRODUCT_EDITOR',
      });
      if (editor) {
        return NextResponse.json({ success: true, data: sanitizeEditor(editor) });
      }
    }
  } catch {}

  return proxyToBackend(request, `/admin/editors/${path.join('/')}`);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const authError = authorizeRequestRoles(request);
  if (authError) return authError;
  const { path } = await params;
  const id = path[0];
  const isStatusToggle = path[1] === 'status';

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  let updatedEditor: any = null;

  try {
    const db = await getMongoDb();
    if (db) {
      const usersCol = db.collection('users');
      const current = await usersCol.findOne({ id, role: 'PRODUCT_EDITOR' });

      if (current) {
        const nextIsActive =
          body.isActive !== undefined
            ? Boolean(body.isActive)
            : isStatusToggle
            ? !current.isActive
            : current.isActive;

        await usersCol.updateOne(
          { id },
          {
            $set: {
              ...(isStatusToggle ? { isActive: nextIsActive } : body),
              updatedAt: new Date().toISOString(),
            },
          }
        );

        updatedEditor = sanitizeEditor({
          ...current,
          ...(isStatusToggle ? { isActive: nextIsActive } : body),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err: any) {
    console.warn('[MongoDB Editor Status Update Warning]:', err?.message || err);
  }

  // Relay to backend
  try {
    await proxyToBackend(request, `/admin/editors/${path.join('/')}`, {
      body: JSON.stringify(body),
    });
  } catch {}

  if (updatedEditor) {
    return NextResponse.json({ success: true, data: updatedEditor });
  }

  return proxyToBackend(request, `/admin/editors/${path.join('/')}`);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const authError = authorizeRequestRoles(request);
  if (authError) return authError;
  const { path } = await params;
  const id = path[0];

  let deleted = false;

  try {
    const db = await getMongoDb();
    if (db) {
      const usersCol = db.collection('users');
      const editorDoc = await usersCol.findOne({ id, role: 'PRODUCT_EDITOR' });

      await usersCol.deleteOne({ id, role: 'PRODUCT_EDITOR' });
      deleted = true;

      // Add tombstone to deleted_editors
      await db.collection('deleted_editors').updateOne(
        { id },
        {
          $set: {
            id,
            email: editorDoc?.email ? String(editorDoc.email).toLowerCase() : undefined,
            deletedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }
  } catch (err: any) {
    console.warn('[MongoDB Delete Editor Warning]:', err?.message || err);
  }

  // Relay to backend
  try {
    await proxyToBackend(request, `/admin/editors/${path.join('/')}`);
  } catch {}

  if (deleted) {
    return NextResponse.json({ success: true, message: 'Product editor permanently removed.' });
  }

  return proxyToBackend(request, `/admin/editors/${path.join('/')}`);
}
