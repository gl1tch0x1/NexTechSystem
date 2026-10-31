import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import jwt from 'jsonwebtoken';

test('every declared backend route: anonymous dispatch and authenticated GET smoke checks', async t => {
  const cwd = process.cwd();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nextech-routes-'));
  fs.mkdirSync(path.join(root, 'backend', 'data_store'), { recursive: true });
  process.chdir(root);
  const config = fs.readFileSync(new URL('../src/config/env.ts', import.meta.url), 'utf8');
  for (const match of config.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) process.env[match[1]] = '';
  Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: 'route-test-key', ENABLE_MONGODB: 'false', ENABLE_FIRESTORE_SYNC: 'false', CLOUDFLARE_SECURITY_ENABLED: 'false' });
  const index = fs.readFileSync(new URL('../src/routes/index.ts', import.meta.url), 'utf8');
  const imports = Object.fromEntries([...index.matchAll(/import (\w+) from '\.\/([^']+)\.js'/g)].map(m => [m[1],m[2]]));
  const routes: { method: string; path: string }[] = [];
  for (const mount of index.matchAll(/router\.use\('([^']+)', (\w+)\)/g)) {
    const source = fs.readFileSync(new URL(`../src/routes/${imports[mount[2]]}.ts`, import.meta.url), 'utf8');
    for (const route of source.matchAll(/router\.(get|post|put|patch|delete)\((\[[^\]]+\]|'[^']+')/g)) {
      for (const p of route[2].matchAll(/'([^']+)'/g)) routes.push({ method: route[1].toUpperCase(), path: '/api'+mount[1]+(p[1] === '/' ? '' : p[1]) });
    }
  }
  routes.push({ method: 'GET', path: '/api/health' });
  assert.ok(routes.length >= 150, 'route inventory must not silently shrink');
  const { userRepository } = await import('../src/repositories/user.repository.js');
  const { productRepository } = await import('../src/repositories/product.repository.js');
  await userRepository.create({ id: 'audit_admin', name: 'Isolated Admin', email: 'admin@example.invalid', role: 'ADMIN', isActive: true } as any);
  productRepository.find = async () => [{ id: 'test_product', name: 'Test CPU', sku: 'TEST', price: 100, costPrice: 50, stock: 10, isActive: true, approvalStatus: 'APPROVED', sellerType: 'ADMIN', images: [], features: [], categoryId: 'test', brandId: 'test', createdAt: new Date().toISOString() }] as any;
  const { createApp } = await import('../src/app.js');
  const server = createApp().listen(0,'127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const token = jwt.sign({ id: 'audit_admin', email: 'admin@example.invalid', role: 'ADMIN' }, process.env.JWT_SECRET!);
  try {
    for (const route of routes) {
      const url = route.path.replace(/:\w+/g, 'missing-audit-id');
      await t.test(`${route.method} ${route.path}`, async () => {
        const response = await fetch(base+url, { method: route.method, redirect: 'manual', headers: { 'Content-Type': 'application/json' }, ...(['GET','HEAD'].includes(route.method) ? {} : { body: '{}' }) });
        const body = await response.text();
        assert.ok(response.status < 500, `anonymous ${response.status}: ${body.slice(0,220)}`);
        assert.ok(!body.includes('API route not found:'), 'declared route did not dispatch');
        if (route.method === 'GET') {
          const authorized = await fetch(base+url, { redirect: 'manual', headers: { Authorization: `Bearer ${token}` } });
          const text = await authorized.text();
          assert.ok(authorized.status < 500, `admin ${authorized.status}: ${text.slice(0,220)}`);
          assert.ok(!text.includes('API route not found:'), 'authenticated route did not dispatch');
        }
      });
    }
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
    process.chdir(cwd);
    try {
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch {
      // Ignore transient Windows file lock on temp directory cleanup
    }
  }
});
