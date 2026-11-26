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

  await t.test('returns a JSON configuration error when session signing is unavailable', async () => {
    const previousEnv = {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: process.env.JWT_SECRET,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      AUTH_SECRET: process.env.AUTH_SECRET,
    };
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.AUTH_SECRET;
      globalThis.fetch = async (input) => {
        if (String(input).endsWith('/api/admin/settings')) {
          return Response.json({ success: false }, { status: 401 });
        }
        return Response.json({
          success: true,
          data: {
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
      assert.equal(response.status, 503);
      assert.match(response.headers.get('content-type') || '', /application\/json/);
      assert.equal((await response.json()).error.code, 'AUTH_CONFIGURATION_ERROR');
    } finally {
      process.env.NODE_ENV = previousEnv.NODE_ENV;
      if (previousEnv.JWT_SECRET === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousEnv.JWT_SECRET;
      if (previousEnv.NEXTAUTH_SECRET === undefined) delete process.env.NEXTAUTH_SECRET;
      else process.env.NEXTAUTH_SECRET = previousEnv.NEXTAUTH_SECRET;
      if (previousEnv.AUTH_SECRET === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = previousEnv.AUTH_SECRET;
      globalThis.fetch = originalFetch;
    }
  });

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

  await t.test('converts an upstream HTML 500 into a JSON gateway error', async () => {
    try {
      globalThis.fetch = async (input) => {
        if (String(input).endsWith('/api/admin/settings')) {
          return Response.json({ success: false }, { status: 401 });
        }
        return new Response('<html>upstream failure</html>', {
          status: 500,
          headers: { 'content-type': 'text/html' },
        });
      };

      const response = await POST(loginRequest());
      assert.equal(response.status, 502);
      assert.match(response.headers.get('content-type') || '', /application\/json/);
      assert.equal((await response.json()).error.code, 'AUTH_SERVICE_INVALID_RESPONSE');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
