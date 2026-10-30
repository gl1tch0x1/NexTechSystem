import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { POST } from '../app/api/auth/login/route';
import { POST as logout } from '../app/api/auth/logout/route';
import { GET } from '../app/api/auth/me/route';

test('auth routes preserve backend authority and session transport', async (t) => {
  let status = 200;
  let payload: unknown = {};
  let authCookie = 'auth_token=backend-token; HttpOnly; Path=/; SameSite=Lax';
  let received: { url?: string; headers: Record<string, unknown>; body: string };
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    received = { url: req.url, headers: req.headers, body };
    res.writeHead(status, {
      'content-type': 'application/json',
      'set-cookie': [authCookie, 'csrf=nonce; Path=/'],
      'retry-after': '60',
    });
    res.end(JSON.stringify(payload));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const previous = process.env.API_PROXY_TARGET;
  process.env.API_PROXY_TARGET = `http://127.0.0.1:${address.port}/api`;
  t.after(() => {
    if (previous === undefined) delete process.env.API_PROXY_TARGET;
    else process.env.API_PROXY_TARGET = previous;
    server.closeAllConnections();
    server.close();
  });
  const login = () => POST(new Request('https://www.nextechsystem.com/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://www.nextechsystem.com', cookie: 'csrf=nonce', 'x-csrf-token': 'nonce' },
    body: JSON.stringify({ email: 'admin', password: 'test-only', mfaCode: '123456' }),
  }));

  await t.test('does not promote admin username or replace backend token', async () => {
    payload = { success: true, data: { token: 'backend-token', user: { id: 'ordinary-user', username: 'admin', role: 'CUSTOMER' } } };
    const response = await login();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), payload);
    assert.equal(response.headers.getSetCookie().length, 2);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(received.url, '/api/auth/login');
    assert.equal(received.headers.origin, 'https://www.nextechsystem.com');
    assert.equal(received.headers.cookie, 'csrf=nonce');
    assert.equal(received.headers['x-csrf-token'], 'nonce');
    assert.equal(JSON.parse(received.body).mfaCode, '123456');
  });

  for (const [code, httpStatus] of [['INVALID_CREDENTIALS', 401], ['ACCOUNT_LOCKED', 423], ['ACCOUNT_DEACTIVATED', 403], ['TOO_MANY_REQUESTS', 429]] as const) {
    await t.test(`preserves ${code}`, async () => {
      status = httpStatus;
      payload = { success: false, error: { code, message: 'Backend rejection' } };
      const response = await login();
      assert.equal(response.status, httpStatus);
      assert.deepEqual(await response.json(), payload);
      assert.equal(response.headers.get('retry-after'), '60');
    });
  }

  await t.test('preserves MFA challenge without issuing a session', async () => {
    status = 200;
    payload = { success: true, data: { requiresMfa: true, mfaTicket: 'challenge-only' } };
    assert.deepEqual(await (await login()).json(), payload);
  });

  await t.test('forwards untrusted origins verbatim for backend rejection', async () => {
    status = 403;
    payload = { success: false, error: { code: 'CSRF_ORIGIN_MISMATCH' } };
    const response = await POST(new Request('https://nextechsystem.com/api/auth/login', {
      method: 'POST', headers: { origin: 'https://nextechsystem.com.attacker.test' }, body: '{}',
    }));
    assert.equal(response.status, 403);
    assert.equal(received.headers.origin, 'https://nextechsystem.com.attacker.test');
  });

  await t.test('me forwards bearer and cookies and preserves revocation', async () => {
    status = 401;
    payload = { success: false, error: { code: 'INVALID_TOKEN' } };
    const response = await GET(new Request('https://nextechsystem.com/api/auth/me', {
      headers: { authorization: 'Bearer revoked-token', cookie: 'auth_token=revoked-token' },
    }));
    assert.equal(received.url, '/api/auth/me');
    assert.equal(received.headers.authorization, 'Bearer revoked-token');
    assert.equal(received.headers.cookie, 'auth_token=revoked-token');
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), payload);
  });

  await t.test('me preserves ordinary backend user role', async () => {
    status = 200;
    payload = { success: true, data: { user: { username: 'admin', role: 'CUSTOMER' }, reseller: null } };
    assert.deepEqual(await (await GET(new Request('https://nextechsystem.com/api/auth/me'))).json(), payload);
  });

  await t.test('logout forwards cookie expiration', async () => {
    authCookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly';
    const response = await logout(new Request('https://nextechsystem.com/api/auth/logout', {
      method: 'POST', headers: { origin: 'https://nextechsystem.com', cookie: 'auth_token=backend-token' },
    }));
    assert.equal(received.url, '/api/auth/logout');
    assert.equal(response.headers.getSetCookie()[0], authCookie);
  });

  await t.test('unreachable backend fails closed for login and me', async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const response of [await login(), await GET(new Request('https://nextechsystem.com/api/auth/me', { headers: { authorization: 'Bearer locally-valid-but-unverified' } }))]) {
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error.code, 'AUTH_SERVICE_UNAVAILABLE');
    }
  });
});
