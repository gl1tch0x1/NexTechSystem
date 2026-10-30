import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';

test('authentication and origin regressions (isolated store)', async t => {
  // Never load the developer's .env or connect these tests to a live database.
  const originalCwd = process.cwd();
  process.chdir(mkdtempSync(path.join(tmpdir(), 'nextech-auth-test-')));
  Object.assign(process.env, {
    NODE_ENV: 'test', JWT_SECRET: 'isolated-test-secret-not-a-deployment-key',
    MONGODB_URI: '', ENABLE_MONGODB: 'false', ENABLE_FIRESTORE_SYNC: 'false',
    FIREBASE_PROJECT_ID: '', NEXT_PUBLIC_FIREBASE_PROJECT_ID: '', FIREBASE_CLIENT_EMAIL: '',
    FIREBASE_PRIVATE_KEY: '', CLOUDFLARE_SECURITY_ENABLED: 'false', ALLOWED_ORIGINS: '',
  });
  const { authController, hashPassword } = await import('../src/controllers/auth.controller.js');
  const { userRepository } = await import('../src/repositories/user.repository.js');
  const { productRepository } = await import('../src/repositories/product.repository.js');
  const { authenticate } = await import('../src/middleware/auth.js');
  const { isAllowedOrigin } = await import('../src/config/origins.js');
  const { csrfProtection } = await import('../src/middlewares/csrf-protection.middleware.js');
  const password = 'Test#Literal$2026!Only';
  let account: any;
  let updates: any[] = [];
  const response = () => ({
    statusCode: 200, body: undefined as any,
    status(code: number) { this.statusCode = code; return this; },
    json(body: any) { this.body = body; return this; }, cookie() { return this; },
  });
  userRepository.findByEmail = async () => account;
  userRepository.findByUsername = async () => account;
  userRepository.findById = async () => account;
  userRepository.update = async (_id, update) => { updates.push(update); return account; };
  const freshAccount = () => {
    updates = [];
    account = { id: 'test_user', email: 'test@example.invalid', username: 'admin',
      role: 'CUSTOMER', isActive: true, passwordHash: hashPassword(password) };
  };
  await t.test('literal special characters work; username admin does not elevate customer', async () => {
    freshAccount();
    const res = response();
    await authController.login({ body: { email: account.email, password } } as any, res as any);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.user.role, 'CUSTOMER');
    assert.equal(res.body.data.user.passwordHash, undefined);
    assert.equal((jwt.verify(res.body.data.token, process.env.JWT_SECRET!) as any).role, 'CUSTOMER');
    assert.ok(updates.every(u => !('role' in u)));
  });
  await t.test('altered password is rejected', async () => {
    freshAccount(); const res = response();
    await authController.login({ body: { email: account.email, password: password.replace('$2026', '') } } as any, res as any);
    assert.equal(res.statusCode, 401); assert.equal(updates.length, 0);
  });
  await t.test('deactivated account is rejected', async () => {
    freshAccount(); account.isActive = false; const res = response();
    await authController.login({ body: { email: account.email, password } } as any, res as any);
    assert.equal(res.statusCode, 403);
  });
  await t.test('MFA ticket cannot authorize a protected API', async () => {
    freshAccount(); account.mfaEnabled = true; const res = response();
    await authController.login({ body: { email: account.email, password } } as any, res as any);
    assert.equal(res.body.data.requiresMfa, true); assert.equal(res.body.data.token, undefined);
    const protectedRes = response(); let passed = false;
    await authenticate({ headers: { authorization: `Bearer ${res.body.data.mfaTicket}` } } as any, protectedRes as any, () => { passed = true; });
    assert.equal(passed, false); assert.equal(protectedRes.statusCode, 401);
  });
  await t.test('NexTech origins allowed; unrelated Vercel and lookalike domains denied', () => {
    for (const origin of ['https://nextechsystem.com', 'https://www.nextechsystem.com', 'https://nextechsystem.vercel.app', 'http://localhost:3000']) assert.equal(isAllowedOrigin(origin), true);
    for (const origin of ['https://unrelated.vercel.app', 'https://nextechsystem.com.attacker.invalid', 'https://nextechsystem.com@attacker.invalid', 'null']) {
      assert.equal(isAllowedOrigin(origin), false);
      const res = response(); let passed = false;
      csrfProtection({ method: 'POST', originalUrl: '/api/orders', headers: { origin } } as any, res as any, () => { passed = true; });
      assert.equal(passed, false); assert.equal(res.statusCode, 403);
    }
  });
  await t.test('Express app starts and CORS preflight succeeds without wildcard route crash', async () => {
    productRepository.find = async () => [{}] as any; // Suppress unrelated auto-seeding.
    const { createApp } = await import('../src/app.js');
    const app = createApp();
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    try {
      const address = server.address() as any;
      const url = `http://127.0.0.1:${address.port}/api/auth/login`;
      const allowed = await fetch(url, { method: 'OPTIONS', headers: { Origin: 'https://www.nextechsystem.com', 'Access-Control-Request-Method': 'POST' } });
      assert.equal(allowed.status, 204);
      assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://www.nextechsystem.com');
      const blocked = await fetch(url, { method: 'OPTIONS', headers: { Origin: 'https://unrelated.vercel.app', 'Access-Control-Request-Method': 'POST' } });
      assert.equal(blocked.status, 403);
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  });
  process.chdir(originalCwd);
});
