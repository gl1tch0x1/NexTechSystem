import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';

test('catalog and editor API lifecycle in an isolated disk store', async t => {
  const cwd = process.cwd();
  const dir = mkdtempSync(path.join(tmpdir(), 'nextech-catalog-test-'));
  mkdirSync(path.join(dir, 'backend', 'data_store'), { recursive: true });
  process.chdir(dir);
  Object.assign(process.env, {
    NODE_ENV: 'test', JWT_SECRET: 'isolated-catalog-test-secret',
    MONGODB_URI: '', ENABLE_MONGODB: 'false', ENABLE_FIRESTORE_SYNC: 'false',
    FIREBASE_PROJECT_ID: '', NEXT_PUBLIC_FIREBASE_PROJECT_ID: '', FIREBASE_CLIENT_EMAIL: '',
    FIREBASE_PRIVATE_KEY: '', CLOUDFLARE_SECURITY_ENABLED: 'false', ALLOWED_ORIGINS: '',
  });
  const { userRepository } = await import('../src/repositories/user.repository.js');
  const { productRepository } = await import('../src/repositories/product.repository.js');
  const { hashPassword } = await import('../src/controllers/auth.controller.js');
  await userRepository.create({ id: 'catalog_admin', email: 'admin@example.invalid', username: 'testadmin', name: 'Test Admin', role: 'ADMIN', isActive: true, passwordHash: hashPassword('Test#Password$Only'), createdAt: new Date().toISOString() } as any);
  const originalFind = productRepository.find.bind(productRepository);
  productRepository.find = async () => [{ id: 'prevent-auto-seed' }] as any;
  const { createApp } = await import('../src/app.js');
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  productRepository.find = originalFind;
  const base = `http://127.0.0.1:${(server.address() as any).port}/api`;
  const admin = jwt.sign({ id: 'catalog_admin', role: 'ADMIN' }, process.env.JWT_SECRET!);
  const request = async (route: string, method = 'GET', body?: any, token = admin) => {
    const response = await fetch(base + route, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() as any };
  };
  let editorId = '';
  let editorToken = '';
  try {
    await t.test('creates a restricted editor, lists it, and authenticates with literal special characters', async () => {
      const created = await request('/admin/editors', 'POST', { name: 'Test Editor', email: 'editor@example.invalid', username: 'testeditor', password: 'Editor#Pass$2026', role: 'ADMIN' });
      assert.equal(created.status, 201);
      assert.equal(created.body.data.role, 'PRODUCT_EDITOR');
      assert.equal(created.body.data.passwordHash, undefined);
      editorId = created.body.data.id;
      assert.equal((await request('/admin/editors')).body.data.length, 1);
      const login = await request('/auth/login', 'POST', { email: 'testeditor', password: 'Editor#Pass$2026' });
      assert.equal(login.status, 200);
      editorToken = login.body.data.token;
      assert.ok(editorToken);
    });
    await t.test('rejects duplicate usernames and invalid passwords', async () => {
      assert.equal((await request('/admin/editors', 'POST', { name: 'Other', email: 'other@example.invalid', username: 'testeditor', password: 'Other#Password' })).status, 409);
      assert.equal((await request('/admin/editors', 'POST', { name: 'Other', email: 'other@example.invalid', username: 'other', password: 'short' })).status, 400);
    });
    await t.test('editor can read taxonomy but cannot manage staff, orders or settings', async () => {
      assert.equal((await request('/admin/categories', 'GET', undefined, editorToken)).status, 200);
      for (const route of ['/admin/editors', '/admin/orders', '/admin/settings']) assert.equal((await request(route, 'GET', undefined, editorToken)).status, 403);
      assert.equal((await request('/admin/editors', 'POST', { name: 'Escalation' }, editorToken)).status, 403);
    });
    await t.test('categories persist and are visible to product editors and the storefront', async () => {
      assert.equal((await request('/admin/categories', 'POST', { id: 'cat_test', name: 'Test Hardware', slug: 'test-hardware', order: 1 })).status, 201);
      assert.equal((await request('/admin/categories', 'GET', undefined, editorToken)).body.data[0].id, 'cat_test');
      assert.equal((await request('/products/categories')).body.data[0].id, 'cat_test');
    });
    await t.test('editor can save and update images; duplicate SKUs never delete existing products', async () => {
      const image = 'https://cdn.example.com/hardware%2Fcpu.png?token=a%2Bb';
      const payload = { name: 'Test CPU', sku: 'TEST-CPU', price: 10, stock: 2, sellerType: 'ADMIN', categoryId: 'cat_test', images: [image], primaryImage: image, thumbnail: image };
      const created = await request('/admin/products', 'POST', payload, editorToken);
      assert.equal(created.status, 201);
      const id = created.body.data.id;
      assert.equal((await request(`/admin/products/${id}`, 'GET', undefined, editorToken)).body.data.primaryImage, image);
      assert.equal((await request('/admin/products', 'POST', payload, editorToken)).status, 409);
      assert.ok(await productRepository.findById(id));
      assert.equal((await request(`/admin/products/${id}`, 'PUT', { price: 12 }, editorToken)).status, 200);
      assert.equal((await request(`/admin/products/${id}`, 'DELETE', undefined, editorToken)).status, 200);
    });
    await t.test('deactivation blocks login and existing sessions; deletion removes only the editor', async () => {
      assert.equal((await request(`/admin/editors/${editorId}/status`, 'PUT', {})).status, 200);
      assert.equal((await request('/auth/login', 'POST', { email: 'testeditor', password: 'Editor#Pass$2026' })).status, 403);
      assert.equal((await request('/admin/categories', 'GET', undefined, editorToken)).status, 401);
      assert.equal((await request(`/admin/editors/${editorId}`, 'DELETE')).status, 200);
      assert.equal((await request('/admin/editors')).body.data.length, 0);
      assert.ok(await userRepository.findById('catalog_admin'));
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
    process.chdir(cwd);
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    } catch {
      // Ignore transient Windows EBUSY locking during temp test cleanup
    }
  }
});
