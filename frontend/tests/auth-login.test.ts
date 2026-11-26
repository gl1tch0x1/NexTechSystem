import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

function loginRequest(): NextRequest {
  return new NextRequest('https://store.test/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://store.test' },
    body: JSON.stringify({ email: 'person@example.invalid', password: 'synthetic-test-password' }),
  });
}

test('login reports backend outcomes accurately', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'frontend-login-test-secret-at-least-32-characters';
  process.env.MONGODB_URI = '';
  process.env.API_PROXY_TARGET = 'https://auth-backend.test';

  const { POST } = await import('../app/api/auth/login/route');
  const originalFetch = globalThis.fetch;

  await t.test('creates a session after backend authentication succeeds', async () => {
    try {
      globalThis.fetch = async (input) => {
        if (String(input).endsWith('/api/admin/settings')) {
          return Response.json({ success: false }, { status: 401 });
        }
        return Response.json({
          success: true,
          data: {
            token: 'backend-test-token',
            user: {
              id: 'user-1',
              email: 'person@example.invalid',
              username: 'person',
              role: 'CUSTOMER',
              isActive: true,
            },
          },
        });
      };

      const response = await POST(loginRequest());
      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.success, true);
      assert.equal(payload.data.user.id, 'user-1');
      assert.equal(typeof payload.data.token, 'string');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('preserves MFA challenges without consuming the upstream body', async () => {
    try {
      globalThis.fetch = async (input) => {
        if (String(input).endsWith('/api/admin/settings')) {
          return Response.json({ success: false }, { status: 401 });
        }
        return Response.json({
          success: true,
          data: { requiresMfa: true, mfaTicket: 'test-ticket' },
        });
      };

      const response = await POST(loginRequest());
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        success: true,
        data: { requiresMfa: true, mfaTicket: 'test-ticket' },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test('keeps invalid credentials distinct from backend outages', async () => {
    try {
      globalThis.fetch = async (input) => {
        if (String(input).endsWith('/api/admin/settings')) {
          return Response.json({ success: false }, { status: 401 });
        }
        return Response.json(
          { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
          { status: 401 }
        );
      };

      const rejected = await POST(loginRequest());
      assert.equal(rejected.status, 401);
      assert.equal((await rejected.json()).error.code, 'INVALID_CREDENTIALS');

      globalThis.fetch = async (input) => {
        if (String(input).endsWith('/api/admin/settings')) {
          return Response.json({ success: false }, { status: 401 });
        }
        throw new Error('test backend unavailable');
      };

      const unavailable = await POST(loginRequest());
      assert.equal(unavailable.status, 503);
      assert.equal((await unavailable.json()).error.code, 'AUTH_SERVICE_UNAVAILABLE');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
