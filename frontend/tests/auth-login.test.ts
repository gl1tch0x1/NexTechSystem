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

test('login transparently preserves authoritative backend responses', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.API_PROXY_TARGET = 'https://auth-backend.test';
  const { POST } = await import('../app/api/auth/login/route');
  const originalFetch = globalThis.fetch;

  try {
    await t.test('returns the backend token and session cookie unchanged', async () => {
      globalThis.fetch = async () => new Response(JSON.stringify({
        success: true,
        data: { token: 'backend-test-token', user: { id: 'user-1', role: 'CUSTOMER' } },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'set-cookie': 'auth_token=backend-test-token; HttpOnly; Path=/' },
      });

      const response = await POST(loginRequest());
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        success: true,
        data: { token: 'backend-test-token', user: { id: 'user-1', role: 'CUSTOMER' } },
      });
      assert.match(response.headers.get('set-cookie') || '', /^auth_token=/);
    });

    await t.test('keeps invalid credentials distinct from service outages', async () => {
      globalThis.fetch = async () => Response.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
        { status: 401 },
      );
      const rejected = await POST(loginRequest());
      assert.equal(rejected.status, 401);
      assert.equal((await rejected.json()).error.code, 'INVALID_CREDENTIALS');

      globalThis.fetch = async () => { throw new Error('backend unavailable'); };
      const unavailable = await POST(loginRequest());
      assert.equal(unavailable.status, 503);
      assert.equal((await unavailable.json()).error.code, 'AUTH_SERVICE_UNAVAILABLE');
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
