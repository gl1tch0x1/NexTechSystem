import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import jwt from 'jsonwebtoken';

test('Security & Policy Suite: Reseller Vetting and IP Brute Force Protection', async (t) => {
  const originalCwd = process.cwd();
  process.chdir(mkdtempSync(path.join(tmpdir(), 'nextech-security-test-')));
  Object.assign(process.env, {
    NODE_ENV: 'test',
    JWT_SECRET: 'security-test-isolated-jwt-key-2026',
    MONGODB_URI: '',
    ENABLE_MONGODB: 'false',
    ENABLE_FIRESTORE_SYNC: 'false',
    FIREBASE_PROJECT_ID: '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: '',
    FIREBASE_CLIENT_EMAIL: '',
    FIREBASE_PRIVATE_KEY: '',
    CLOUDFLARE_SECURITY_ENABLED: 'false',
    ALLOWED_ORIGINS: '',
  });

  const { authController, hashPassword } = await import('../src/controllers/auth.controller.js');
  const { userRepository } = await import('../src/repositories/user.repository.js');
  const { resellerRepository } = await import('../src/repositories/reseller.repository.js');
  const { resellerService } = await import('../src/services/reseller.service.js');
  const { requireApprovedReseller } = await import('../src/middleware/rbac.js');
  const {
    loginBruteForceGuard,
    recordFailedLogin,
    recordSuccessfulLogin,
    resetIpAttempts,
    isIpBlocked,
  } = await import('../src/middlewares/login-brute-force.middleware.js');

  const mockResponse = () => ({
    statusCode: 200,
    body: undefined as any,
    headers: {} as Record<string, string>,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    cookie() {
      return this;
    },
  });

  await t.test('1. Reseller registration strictly requires Trade License and VAT Certificate documents', async () => {
    // Missing Trade License doc
    const res1 = mockResponse();
    await authController.register(
      {
        body: {
          accountType: 'RESELLER',
          name: 'Partner Director',
          email: 'partner@hardware.invalid',
          password: 'Password123#Secure',
          businessName: 'Hardware Partner LLC',
          tradeLicense: 'DED-884920',
          taxNumber: '100293847500003',
          // missing tradeLicenseDocument and vatCertificateDocument
        },
      } as any,
      res1 as any
    );
    assert.equal(res1.statusCode, 400);
    assert.equal(res1.body.error.code, 'MISSING_TRADE_LICENSE_DOC');

    // Missing VAT Certificate doc
    const res2 = mockResponse();
    await authController.register(
      {
        body: {
          accountType: 'RESELLER',
          name: 'Partner Director',
          email: 'partner2@hardware.invalid',
          password: 'Password123#Secure',
          businessName: 'Hardware Partner LLC',
          tradeLicense: 'DED-884920',
          taxNumber: '100293847500003',
          tradeLicenseDocument: '/api/upload/test-trade-license.pdf',
          // missing vatCertificateDocument
        },
      } as any,
      res2 as any
    );
    assert.equal(res2.statusCode, 400);
    assert.equal(res2.body.error.code, 'MISSING_VAT_CERTIFICATE_DOC');
  });

  await t.test('2. Successful reseller registration creates account with PENDING_APPROVAL status', async () => {
    const res = mockResponse();
    const uniqueEmail = `apex_${Date.now()}@apexsystems.ae`;
    await authController.register(
      {
        body: {
          accountType: 'RESELLER',
          name: 'Ahmad Al Nuaimi',
          email: uniqueEmail,
          password: 'Password123#Secure',
          businessName: 'Apex Systems LLC',
          tradeLicense: 'CN-904218',
          taxNumber: '100987654300003',
          tradeLicenseDocument: '/api/upload/apex-trade-license.pdf',
          vatCertificateDocument: '/api/upload/apex-vat-cert.pdf',
        },
      } as any,
      res as any
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.reseller.status, 'PENDING_APPROVAL');
    assert.equal(res.body.data.reseller.businessInformation.verificationStatus, 'PENDING_APPROVAL');
    assert.equal(
      res.body.data.reseller.businessInformation.tradeLicenseDocument,
      '/api/upload/apex-trade-license.pdf'
    );
    assert.equal(
      res.body.data.reseller.businessInformation.vatCertificateDocument,
      '/api/upload/apex-vat-cert.pdf'
    );
  });

  await t.test('3. requireApprovedReseller middleware blocks mutating actions for PENDING_APPROVAL resellers', async () => {
    // Setup a mock pending reseller in repository
    const pendingReseller = {
      id: 'res_pending_test_1',
      userId: 'user_res_pending_1',
      resellerCode: 'pendingpartner',
      status: 'PENDING_APPROVAL' as const,
      businessName: 'Pending Partner Corp',
    };
    resellerRepository.findById = async (id: string) => {
      if (id === pendingReseller.id) return pendingReseller as any;
      return null;
    };

    const req = {
      user: {
        id: 'user_res_pending_1',
        email: 'pending@reseller.invalid',
        role: 'RESELLER',
        resellerId: 'res_pending_test_1',
      },
      method: 'POST',
      originalUrl: '/api/reseller/products',
    };

    const res = mockResponse();
    let nextCalled = false;

    await requireApprovedReseller(req as any, res as any, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error.code, 'RESELLER_PENDING_APPROVAL');
  });

  await t.test('4. Admin status validation activates reseller and authorizes subsequent actions', async () => {
    let storedStatus = 'PENDING_APPROVAL';
    let storedReseller: any = {
      id: 'res_pending_test_2',
      status: 'PENDING_APPROVAL',
      businessInformation: {
        verificationStatus: 'PENDING_APPROVAL',
        tradeLicense: 'TL-12345',
      },
    };

    resellerRepository.findById = async (id: string) => {
      if (id === storedReseller.id) return { ...storedReseller, status: storedStatus } as any;
      return null;
    };
    resellerRepository.update = async (id: string, updates: any) => {
      storedStatus = updates.status;
      storedReseller = { ...storedReseller, ...updates };
      return storedReseller;
    };

    // Admin approves reseller
    const updated = await resellerService.updateResellerStatus('res_pending_test_2', 'ACTIVE', 'user_admin_1');
    assert.equal(updated?.status, 'ACTIVE');
    assert.equal(updated?.businessInformation.verificationStatus, 'APPROVED');

    // Reseller can now pass requireApprovedReseller middleware
    const req = {
      user: {
        id: 'user_res_pending_2',
        email: 'activated@reseller.invalid',
        role: 'RESELLER',
        resellerId: 'res_pending_test_2',
      },
      method: 'POST',
      originalUrl: '/api/reseller/products',
    };
    const res = mockResponse();
    let nextCalled = false;

    await requireApprovedReseller(req as any, res as any, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  });

  await t.test('5. IP Brute-force rate limiter tracks failed attempts and blocks IP after 5 failures', async () => {
    const testIp = '198.51.100.42';
    resetIpAttempts(testIp);

    // Initial state: not blocked
    assert.equal(isIpBlocked(testIp).blocked, false);

    // 4 failed attempts: not yet blocked
    for (let i = 1; i <= 4; i++) {
      const outcome = recordFailedLogin(testIp, `attacker_try_${i}@victim.invalid`);
      assert.equal(outcome.isBlocked, false);
      assert.equal(outcome.remainingAttempts, 5 - i);
    }

    assert.equal(isIpBlocked(testIp).blocked, false);

    // 5th failed attempt: triggers IP lockout!
    const lockoutOutcome = recordFailedLogin(testIp, 'attacker_try_5@victim.invalid');
    assert.equal(lockoutOutcome.isBlocked, true);
    assert.equal(lockoutOutcome.remainingAttempts, 0);
    assert.ok((lockoutOutcome.remainingSeconds || 0) > 0);

    // isIpBlocked now returns true
    const check = isIpBlocked(testIp);
    assert.equal(check.blocked, true);
    assert.ok(check.remainingSeconds > 0);

    // loginBruteForceGuard drops requests from blocked IP with HTTP 429
    const blockedReq = {
      ip: testIp,
      socket: { remoteAddress: testIp },
      headers: {},
      app: { get: () => false },
    };
    const blockedRes = mockResponse();
    let guardPassed = false;

    loginBruteForceGuard(blockedReq as any, blockedRes as any, () => {
      guardPassed = true;
    });

    assert.equal(guardPassed, false);
    assert.equal(blockedRes.statusCode, 429);
    assert.equal(blockedRes.body.error.code, 'IP_BLOCKED_BRUTE_FORCE');

    // Resetting/successful login clears lockout
    recordSuccessfulLogin(testIp);
    assert.equal(isIpBlocked(testIp).blocked, false);
  });

  process.chdir(originalCwd);
});
