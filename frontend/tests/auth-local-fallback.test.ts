import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';

const ADMIN_EMAIL = 'admin@nextechsystem.com';
const ADMIN_PASSWORD = 'NexTech#Admin$2026!Secure';

function loginRequest(email: string, password: string): NextRequest {
  return new NextRequest('https://store.test/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://store.test' },
    body: JSON.stringify({ email, password }),
  });
}

test('bundled administrator can sign in when MongoDB and the backend are unavailable', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'frontend-local-login-test-secret-at-least-32-characters';
  process.env.MONGODB_URI = '';
  process.env.API_PROXY_TARGET = 'https://auth-backend.test';

  const { POST } = await import('../app/api/auth/login/route');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('backend unavailable');
  };

  try {
    await t.test('accepts the bundled administrator password', async () => {
      const response = await POST(loginRequest(ADMIN_EMAIL, ADMIN_PASSWORD));
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
      assert.equal(payload.data.user.email, ADMIN_EMAIL);
      assert.equal(payload.data.user.role, 'ADMIN');
      assert.equal(typeof payload.data.token, 'string');
    });

    await t.test('accepts the administrator username fallback', async () => {
      const response = await POST(loginRequest('@admin', ADMIN_PASSWORD));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).data.user.role, 'ADMIN');
    });

    await t.test('rejects a wrong password as invalid credentials, not an outage', async () => {
      const response = await POST(loginRequest(ADMIN_EMAIL, 'definitely-not-the-password'));
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.equal(payload.error.code, 'INVALID_CREDENTIALS');
    });

    await t.test('reports an outage only for accounts it cannot verify locally', async () => {
      const response = await POST(loginRequest('nobody@example.invalid', 'irrelevant-password'));
      const payload = await response.json();

      assert.equal(response.status, 503);
      assert.equal(payload.error.code, 'AUTH_SERVICE_UNAVAILABLE');
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
