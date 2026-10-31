import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import jwt from 'jsonwebtoken';

/**
 * Authoritative list of declared backend API endpoints.
 * Defined statically to comply with CWE-200 (js/file-access-to-http) without file scraping.
 */
const DECLARED_ROUTES: readonly { readonly method: string; readonly path: string }[] = [
  // Auth
  { method: 'POST', path: '/api/auth/register' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'GET', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/google' },
  { method: 'POST', path: '/api/auth/logout' },
  { method: 'GET', path: '/api/auth/me' },
  { method: 'PUT', path: '/api/auth/profile' },
  { method: 'POST', path: '/api/auth/change-password' },
  { method: 'DELETE', path: '/api/auth/account' },
  { method: 'DELETE', path: '/api/auth/delete-account' },
  { method: 'POST', path: '/api/auth/forgot-password' },
  { method: 'POST', path: '/api/auth/verify-reset-otp' },
  { method: 'POST', path: '/api/auth/reset-password' },
  { method: 'POST', path: '/api/auth/mfa/setup' },
  { method: 'POST', path: '/api/auth/mfa/verify' },
  { method: 'POST', path: '/api/auth/mfa/disable' },

  // Products
  { method: 'GET', path: '/api/products' },
  { method: 'GET', path: '/api/products/categories' },
  { method: 'GET', path: '/api/products/brands' },
  { method: 'GET', path: '/api/products/config' },
  { method: 'GET', path: '/api/products/:slug' },

  // Cart
  { method: 'POST', path: '/api/cart/calculate' },
  { method: 'POST', path: '/api/cart/coupon/validate' },

  // Orders
  { method: 'GET', path: '/api/orders/approval/remote' },
  { method: 'GET', path: '/api/orders/approval/approve' },
  { method: 'GET', path: '/api/orders/approval/reject' },
  { method: 'POST', path: '/api/orders/request-otp' },
  { method: 'POST', path: '/api/orders/verify-otp' },
  { method: 'POST', path: '/api/orders' },
  { method: 'GET', path: '/api/orders/my' },
  { method: 'GET', path: '/api/orders/:id' },
  { method: 'POST', path: '/api/orders/:id/cancel' },
  { method: 'GET', path: '/api/orders/:orderId/ebill' },

  // Payments
  { method: 'POST', path: '/api/payments/tamara/webhook' },
  { method: 'POST', path: '/api/payments/tabby/webhook' },
  { method: 'POST', path: '/api/payments/initiate' },
  { method: 'GET', path: '/api/payments/status/:orderId' },
  { method: 'POST', path: '/api/payments/verify' },

  // Upload
  { method: 'GET', path: '/api/upload/:filename' },
  { method: 'POST', path: '/api/upload' },

  // PC Builder
  { method: 'GET', path: '/api/pc-builder/components' },
  { method: 'POST', path: '/api/pc-builder/validate' },

  // Wallet
  { method: 'GET', path: '/api/wallet' },
  { method: 'POST', path: '/api/wallet/add-funds' },

  // Admin Core & Catalog
  { method: 'GET', path: '/api/admin/dashboard' },
  { method: 'GET', path: '/api/admin/analytics' },
  { method: 'GET', path: '/api/admin/products' },
  { method: 'GET', path: '/api/admin/products/:id' },
  { method: 'POST', path: '/api/admin/products' },
  { method: 'PUT', path: '/api/admin/products/:id' },
  { method: 'DELETE', path: '/api/admin/products/:id' },
  { method: 'PUT', path: '/api/admin/products/:id/approval' },

  // Admin Resellers & Customers
  { method: 'GET', path: '/api/admin/resellers' },
  { method: 'GET', path: '/api/admin/resellers/:id' },
  { method: 'POST', path: '/api/admin/resellers' },
  { method: 'PUT', path: '/api/admin/resellers/:id' },
  { method: 'PUT', path: '/api/admin/resellers/:id/status' },
  { method: 'DELETE', path: '/api/admin/resellers/:id' },
  { method: 'GET', path: '/api/admin/customers' },
  { method: 'PUT', path: '/api/admin/customers/:id/toggle-status' },
  { method: 'POST', path: '/api/admin/customers/:id/wallet-adjust' },

  // Admin Orders & Logistics
  { method: 'GET', path: '/api/admin/orders' },
  { method: 'POST', path: '/api/admin/orders' },
  { method: 'PUT', path: '/api/admin/orders/:id/status' },
  { method: 'PUT', path: '/api/admin/orders/:id/cargo' },
  { method: 'PUT', path: '/api/admin/orders/:id/approve' },
  { method: 'PUT', path: '/api/admin/orders/:id/reject' },

  // Admin Notifications
  { method: 'GET', path: '/api/admin/notifications' },
  { method: 'PUT', path: '/api/admin/notifications/read-all' },
  { method: 'PUT', path: '/api/admin/notifications/:id/read' },
  { method: 'DELETE', path: '/api/admin/notifications/clear-all' },
  { method: 'DELETE', path: '/api/admin/notifications/:id' },

  // Admin Categories & Brands
  { method: 'GET', path: '/api/admin/categories' },
  { method: 'POST', path: '/api/admin/categories' },
  { method: 'PUT', path: '/api/admin/categories/:id' },
  { method: 'DELETE', path: '/api/admin/categories/:id' },
  { method: 'GET', path: '/api/admin/brands' },
  { method: 'POST', path: '/api/admin/brands' },
  { method: 'PUT', path: '/api/admin/brands/:id' },
  { method: 'DELETE', path: '/api/admin/brands/:id' },

  // Admin Coupons & Banners
  { method: 'GET', path: '/api/admin/coupons' },
  { method: 'POST', path: '/api/admin/coupons' },
  { method: 'PUT', path: '/api/admin/coupons/:id' },
  { method: 'DELETE', path: '/api/admin/coupons/:id' },
  { method: 'GET', path: '/api/admin/banners' },
  { method: 'POST', path: '/api/admin/banners' },
  { method: 'PUT', path: '/api/admin/banners/:id' },
  { method: 'DELETE', path: '/api/admin/banners/:id' },

  // Admin Settings & Operations
  { method: 'GET', path: '/api/admin/profile' },
  { method: 'PUT', path: '/api/admin/credentials' },
  { method: 'GET', path: '/api/admin/settings' },
  { method: 'PUT', path: '/api/admin/settings' },
  { method: 'GET', path: '/api/admin/audit-logs' },
  { method: 'GET', path: '/api/admin/backup' },
  { method: 'POST', path: '/api/admin/restore' },

  // Admin Purchase Orders
  { method: 'GET', path: '/api/admin/purchase-orders' },
  { method: 'GET', path: '/api/admin/purchase-orders/:id' },
  { method: 'DELETE', path: '/api/admin/purchase-orders/:id' },
  { method: 'POST', path: '/api/admin/purchase-orders' },
  { method: 'POST', path: '/api/admin/purchase-orders/generate-low-stock' },
  { method: 'PUT', path: '/api/admin/purchase-orders/:id/status' },

  // Admin CMS
  { method: 'GET', path: '/api/admin/cms/layout' },
  { method: 'PUT', path: '/api/admin/cms/layout' },
  { method: 'GET', path: '/api/admin/cms/features' },
  { method: 'POST', path: '/api/admin/cms/features' },
  { method: 'PUT', path: '/api/admin/cms/features/:id' },
  { method: 'DELETE', path: '/api/admin/cms/features/:id' },

  // Admin Database
  { method: 'GET', path: '/api/admin/database/status' },
  { method: 'POST', path: '/api/admin/database/sync-to-mongo' },
  { method: 'POST', path: '/api/admin/database/sync-from-mongo' },

  // Admin Editors
  { method: 'GET', path: '/api/admin/editors' },
  { method: 'POST', path: '/api/admin/editors' },
  { method: 'PUT', path: '/api/admin/editors/:id/status' },
  { method: 'DELETE', path: '/api/admin/editors/:id' },

  // Reseller Portal
  { method: 'GET', path: '/api/reseller/template/download' },
  { method: 'GET', path: '/api/reseller/dashboard' },
  { method: 'GET', path: '/api/reseller/profile' },
  { method: 'PUT', path: '/api/reseller/profile' },
  { method: 'GET', path: '/api/reseller/products' },
  { method: 'POST', path: '/api/reseller/products' },
  { method: 'PUT', path: '/api/reseller/products/:id' },
  { method: 'DELETE', path: '/api/reseller/products/:id' },
  { method: 'PATCH', path: '/api/reseller/products/:id/inventory' },
  { method: 'GET', path: '/api/reseller/orders' },
  { method: 'POST', path: '/api/reseller/import/preview' },
  { method: 'POST', path: '/api/reseller/import/execute' },
  { method: 'GET', path: '/api/reseller/import/history' },

  // Storefront Content
  { method: 'GET', path: '/api/content/homepage' },
  { method: 'GET', path: '/api/content/hero' },
  { method: 'GET', path: '/api/content/hero-highlights' },
  { method: 'GET', path: '/api/content/solutions' },
  { method: 'GET', path: '/api/content/benchmarks' },
  { method: 'GET', path: '/api/content/testimonials' },
  { method: 'GET', path: '/api/content/features' },
  { method: 'GET', path: '/api/content/builder-presets' },
  { method: 'GET', path: '/api/content/settings' },

  // Security
  { method: 'POST', path: '/api/security/verify-turnstile' },
  { method: 'GET', path: '/api/security/cloudflare-status' },

  // Technical Specifications
  { method: 'GET', path: '/api/specifications' },
  { method: 'GET', path: '/api/specifications/presets' },
  { method: 'GET', path: '/api/specifications/fields' },

  // Currencies & VAT
  { method: 'GET', path: '/api/currencies' },
  { method: 'GET', path: '/api/vat/summary' },

  // Warranty
  { method: 'GET', path: '/api/warranty/verify/:serial' },

  // Enterprise Quotes
  { method: 'POST', path: '/api/quotes' },
  { method: 'GET', path: '/api/quotes' },
  { method: 'GET', path: '/api/quotes/:id' },
  { method: 'PUT', path: '/api/quotes/:id' },
  { method: 'POST', path: '/api/quotes/:id/convert' },
  { method: 'POST', path: '/api/admin/quotes' },
  { method: 'GET', path: '/api/admin/quotes' },
  { method: 'GET', path: '/api/admin/quotes/:id' },
  { method: 'PUT', path: '/api/admin/quotes/:id' },
  { method: 'POST', path: '/api/admin/quotes/:id/convert' },

  // System Health
  { method: 'GET', path: '/api/health' },
];

test('every declared backend route: anonymous dispatch and authenticated GET smoke checks', async t => {
  const cwd = process.cwd();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nextech-routes-'));
  fs.mkdirSync(path.join(root, 'backend', 'data_store'), { recursive: true });
  process.chdir(root);

  Object.assign(process.env, {
    NODE_ENV: 'test',
    JWT_SECRET: 'route-test-key',
    ENABLE_MONGODB: 'false',
    ENABLE_FIRESTORE_SYNC: 'false',
    CLOUDFLARE_SECURITY_ENABLED: 'false',
    ALLOW_DEV_OTP: 'true',
    ALLOW_DEV_WEBHOOK_BYPASS: 'true',
  });

  assert.ok(DECLARED_ROUTES.length >= 150, 'route inventory must not silently shrink');

  const { userRepository } = await import('../src/repositories/user.repository.js');
  const { productRepository } = await import('../src/repositories/product.repository.js');
  await userRepository.create({ id: 'audit_admin', name: 'Isolated Admin', email: 'admin@example.invalid', role: 'ADMIN', isActive: true } as any);
  productRepository.find = async () => [{
    id: 'test_product',
    name: 'Test CPU',
    sku: 'TEST',
    price: 100,
    costPrice: 50,
    stock: 10,
    isActive: true,
    approvalStatus: 'APPROVED',
    sellerType: 'ADMIN',
    images: [],
    features: [],
    categoryId: 'test',
    brandId: 'test',
    createdAt: new Date().toISOString()
  }] as any;

  const { createApp } = await import('../src/app.js');
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const token = jwt.sign({ id: 'audit_admin', email: 'admin@example.invalid', role: 'ADMIN' }, process.env.JWT_SECRET!);

  try {
    for (const route of DECLARED_ROUTES) {
      const url = route.path.replace(/:\w+/g, 'missing-audit-id');
      await t.test(`${route.method} ${route.path}`, async () => {
        const response = await fetch(base + url, {
          method: route.method,
          redirect: 'manual',
          headers: { 'Content-Type': 'application/json' },
          ...(['GET', 'HEAD'].includes(route.method) ? {} : { body: '{}' })
        });
        const body = await response.text();
        assert.ok(response.status < 500, `anonymous ${response.status}: ${body.slice(0, 220)}`);
        assert.ok(!body.includes('API route not found:'), 'declared route did not dispatch');

        if (route.method === 'GET') {
          const authorized = await fetch(base + url, { redirect: 'manual', headers: { Authorization: `Bearer ${token}` } });
          const text = await authorized.text();
          assert.ok(authorized.status < 500, `admin ${authorized.status}: ${text.slice(0, 220)}`);
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
