import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

function request(path: string, token?: string): NextRequest {
  const headers = token ? { authorization: `Bearer ${token}` } : undefined;
  return new NextRequest(`https://nextech.test${path}`, { headers });
}

test('admin access is authenticated and limited by role', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'frontend-security-test-secret-at-least-32-chars';
  process.env.API_PROXY_TARGET = 'https://backend.test';
  const { authorizeActiveRequestRoles, authorizeRequestRoles, createJwtToken, proxyToBackend } = await import('../lib/proxy-helper');
  const { proxy } = await import('../proxy');

  await t.test('rejects missing, malformed, and non-admin API credentials', async () => {
    const missing = await proxy(request('/api/admin/admins'));
    assert.equal(missing.status, 401);

    const malformed = await proxy(request('/api/admin/admins', 'not-a-token'));
    assert.equal(malformed.status, 401);

    const customerToken = createJwtToken({
      id: 'customer-1',
      email: 'customer@example.invalid',
      role: 'CUSTOMER',
    });
    const forbidden = await proxy(request('/api/admin/admins', customerToken));
    assert.equal(forbidden.status, 403);
  });

  await t.test('restricts product editors to catalog operations', async () => {
    const editorToken = createJwtToken({
      id: 'editor-1',
      email: 'editor@example.invalid',
      role: 'PRODUCT_EDITOR',
    });

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => Response.json({
        success: true,
        data: { user: { id: 'editor-1', role: 'PRODUCT_EDITOR' } },
      });

      assert.equal((await proxy(request('/admin/products', editorToken))).status, 200);
      assert.equal((await proxy(request('/api/admin/products', editorToken))).status, 200);
      assert.equal((await proxy(request('/api/admin/admins', editorToken))).status, 403);
      assert.equal((await proxy(request('/admin', editorToken))).status, 307);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('rejects revoked accounts before direct admin API handlers run', async () => {
    const adminToken = createJwtToken({
      id: 'admin-1',
      email: 'admin@example.invalid',
      role: 'ADMIN',
    });
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => Response.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
      assert.equal((await proxy(request('/api/admin/purchase-orders', adminToken))).status, 401);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('rejects arbitrary tokens before backend proxying', async () => {
    const malformed = request('/api/admin/admins', 'anything');
    const response = await proxyToBackend(malformed, '/admin/admins');
    assert.equal(response.status, 401);

    assert.notEqual(authorizeRequestRoles(request('/api/admin/admins')), null);
  });

  await t.test('requires the backend to confirm the current active account and role', async () => {
    const token = createJwtToken({
      id: 'admin-1',
      email: 'admin@example.invalid',
      role: 'ADMIN',
    });
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async (input, init) => {
        assert.equal(String(input), 'https://backend.test/api/admin/session');
        assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${token}`);
        return Response.json({ success: true, data: { user: { id: 'admin-1', role: 'ADMIN' } } });
      };
      assert.equal(await authorizeActiveRequestRoles(request('/api/admin/admins', token)), null);

      globalThis.fetch = async () => Response.json(
        { success: false, error: { code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
      assert.equal((await authorizeActiveRequestRoles(request('/api/admin/admins', token)))?.status, 401);

      globalThis.fetch = async () => Response.json({
        success: true,
        data: { user: { id: 'admin-1', role: 'PRODUCT_EDITOR' } },
      });
      assert.equal((await authorizeActiveRequestRoles(request('/api/admin/admins', token)))?.status, 401);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('fails closed when current account status cannot be verified', async () => {
    const token = createJwtToken({
      id: 'admin-1',
      email: 'admin@example.invalid',
      role: 'ADMIN',
    });
    const originalFetch = globalThis.fetch;

    try {
      globalThis.fetch = async () => {
        throw new Error('backend unavailable');
      };
      assert.equal((await authorizeActiveRequestRoles(request('/api/admin/admins', token)))?.status, 503);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
