import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

test('Security Audit Remediations & Media Governance Suite', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-remediations-test-'));
  process.env.DATA_DIR = tempDir;
  process.env.JWT_SECRET = 'test_jwt_secret_audit_hardening_key_32chars!';
  Object.assign(process.env, { NODE_ENV: 'test' });

  const { resellerController } = await import('../src/controllers/reseller.controller.js');
  const { VatService } = await import('../src/services/vat.service.js');
  const { paymentController } = await import('../src/controllers/payment.controller.js');
  const { emailOtpService, computeCheckoutCartHash } = await import('../src/services/email-otp.service.js');
  const { productRepository } = await import('../src/repositories/product.repository.js');
  const { orderRepository } = await import('../src/repositories/order.repository.js');
  const { resellerRepository } = await import('../src/repositories/reseller.repository.js');

  t.after(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}
  });

  // Valid 64-char SHA-256 hex image hashes for tests
  const hash1 = crypto.createHash('sha256').update('asset_ram_64ecc').digest('hex');
  const hash2 = crypto.createHash('sha256').update('asset_switch_48p').digest('hex');
  const hash3 = crypto.createHash('sha256').update('asset_router_10g').digest('hex');

  await t.test('1. Reseller inventory input validation rejects negative or invalid values', async () => {
    const reseller = await resellerRepository.create({
      id: 'reseller_inv_test',
      userId: 'user_reseller_1',
      resellerCode: 'RES-INV-1',
      username: 'hardwarehub',
      email: 'ahmed@hardwarehub.ae',
      businessName: 'Hardware Hub FZE',
      displayName: 'Hardware Hub',
      phone: '+971501234567',
      subdomain: 'hardwarehub',
      status: 'ACTIVE',
      productCount: 1,
      salesStats: { totalRevenue: 0, totalOrders: 0, unitsSold: 0 },
      address: {
        id: 'addr_res',
        fullName: 'Ahmed',
        phone: '+971501234567',
        addressLine1: 'Warehouse 4',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        postalCode: '00000',
      },
      businessInformation: {
        taxNumber: '100000000000003',
        tradeLicense: 'TL-999',
        tradeLicenseDocument: '/api/upload/doc.pdf',
        vatCertificateDocument: '/api/upload/vat.pdf',
        verificationStatus: 'APPROVED',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const product = await productRepository.create({
      id: 'prod_inv_1',
      name: 'Server RAM 64GB',
      slug: 'server-ram-64gb',
      sku: 'RAM-64-ECC',
      brandId: 'brand_ecc',
      brandName: 'Crucial',
      categoryId: 'cat_components',
      categoryName: 'PC Components',
      price: 900,
      stock: 50,
      reservedStock: 0,
      lowStockThreshold: 10,
      resellerId: reseller.id,
      resellerCode: reseller.resellerCode,
      sellerType: 'RESELLER',
      currency: 'AED',
      description: 'DDR5 Server ECC Memory',
      images: [`/api/upload/${hash1}.webp`],
      thumbnail: `/api/upload/${hash1}.webp`,
      specifications: { memoryType: 'DDR5', capacity: '64GB' },
      features: ['ECC Error Correction', 'Server Grade'],
      tags: ['ram', 'ecc', 'server'],
      rating: 5,
      reviewCount: 0,
      isFeatured: false,
      isActive: true,
      approvalStatus: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Test: negative stock
    let statusSent = 0;
    let jsonSent: any = null;
    const mockResNegative: any = {
      status(code: number) {
        statusSent = code;
        return this;
      },
      json(payload: any) {
        jsonSent = payload;
      },
    };

    await resellerController.updateInventory(
      { user: { id: 'user_reseller_1', role: 'RESELLER' }, params: { id: product.id }, body: { stock: -10 } } as any,
      mockResNegative
    );
    assert.equal(statusSent, 400);
    assert.equal(jsonSent?.error?.code, 'INVALID_STOCK');

    // Test: non-integer / string payload
    statusSent = 0;
    jsonSent = null;
    await resellerController.updateInventory(
      { user: { id: 'user_reseller_1', role: 'RESELLER' }, params: { id: product.id }, body: { stock: 'invalid_num' } } as any,
      mockResNegative
    );
    assert.equal(statusSent, 400);
    assert.equal(jsonSent?.error?.code, 'INVALID_STOCK');

    // Test: negative lowStockThreshold
    statusSent = 0;
    jsonSent = null;
    await resellerController.updateInventory(
      { user: { id: 'user_reseller_1', role: 'RESELLER' }, params: { id: product.id }, body: { stock: 25, lowStockThreshold: -5 } } as any,
      mockResNegative
    );
    assert.equal(statusSent, 400);
    assert.equal(jsonSent?.error?.code, 'INVALID_THRESHOLD');

    // Test: valid non-negative integer stock
    statusSent = 0;
    jsonSent = null;
    const mockResValid: any = {
      json(payload: any) {
        jsonSent = payload;
      },
    };
    await resellerController.updateInventory(
      { user: { id: 'user_reseller_1', role: 'RESELLER' }, params: { id: product.id }, body: { stock: 45, lowStockThreshold: 12 } } as any,
      mockResValid
    );
    assert.equal(jsonSent?.success, true);
    assert.equal(jsonSent?.data?.stock, 45);
    assert.equal(jsonSent?.data?.lowStockThreshold, 12);
  });

  await t.test('2. Reseller order query scopes order data and strips sensitive credentials & foreign vendor items', async () => {
    const resellerAId = 'reseller_scope_a';
    const resellerBId = 'reseller_scope_b';

    await orderRepository.create({
      id: 'order_multi_vendor_1',
      orderNumber: 'ORD-2026-99001',
      userId: 'customer_123',
      customerName: 'Secret Enterprise VIP',
      customerEmail: 'vip@corp.ae',
      customerPhone: '+971509999999',
      items: [
        {
          productId: 'p_a',
          productName: 'Reseller A Switch',
          sku: 'SW-48P',
          slug: 'sw-48p',
          thumbnail: `/api/upload/${hash2}.webp`,
          unitPrice: 1200,
          quantity: 2,
          discount: 0,
          subtotal: 2400,
          resellerId: resellerAId,
          sellerType: 'RESELLER',
        },
        {
          productId: 'p_b',
          productName: 'Reseller B Router',
          sku: 'RT-10G',
          slug: 'rt-10g',
          thumbnail: `/api/upload/${hash3}.webp`,
          unitPrice: 3500,
          quantity: 1,
          discount: 0,
          subtotal: 3500,
          resellerId: resellerBId,
          sellerType: 'RESELLER',
        },
      ],
      subtotal: 5900,
      discount: 0,
      walletAmountUsed: 0,
      tax: 295,
      taxRate: 5,
      shippingFee: 0,
      total: 6195,
      currency: 'AED',
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'PAID',
      paymentMetadata: { cardBrand: 'VISA', cardLast4: '4242' } as any,
      orderStatus: 'PROCESSING',
      shippingAddress: {
        id: 'addr_1',
        fullName: 'Facility Manager',
        addressLine1: 'Building 7, Business Bay',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '00000',
        country: 'UAE',
        phone: '+971501111111',
      },
      billingAddress: {
        id: 'addr_2',
        fullName: 'Confidential Finance Dept',
        phone: '+971501111112',
        addressLine1: 'Bank Headquarters Level 40',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        postalCode: '11111',
        country: 'UAE',
      },
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    let returnedOrders: any[] = [];
    const mockRes: any = {
      json(payload: any) {
        returnedOrders = payload.data;
      },
    };

    await resellerController.getOrders(
      { user: { id: 'usr_reseller_a', resellerId: resellerAId, role: 'RESELLER' } } as any,
      mockRes
    );

    assert.equal(returnedOrders.length, 1);
    const sanitized = returnedOrders[0];
    assert.equal(sanitized.orderNumber, 'ORD-2026-99001');
    // Scoped items should only contain Reseller A items
    assert.equal(sanitized.items.length, 1);
    assert.equal(sanitized.items[0].resellerId, resellerAId);
    assert.equal(sanitized.items[0].productName, 'Reseller A Switch');
    // Total should match Reseller A subtotal (2400)
    assert.equal(sanitized.total, 2400);
    // Sensitive billing address, payment metadata, and customer email must be stripped
    assert.equal(sanitized.billingAddress, undefined);
    assert.equal(sanitized.paymentMetadata, undefined);
    assert.equal(sanitized.customerEmail, undefined);
  });

  await t.test('3. UAE VAT return classification correctly segregates zero-rated supplies to Box 4', async () => {
    // Standard rated order (5%)
    await orderRepository.create({
      id: 'order_vat_standard',
      orderNumber: 'ORD-VAT-STD',
      userId: 'user_vat',
      customerName: 'Dubai Customer',
      customerEmail: 'cust@dubai.ae',
      items: [],
      subtotal: 1000,
      discount: 0,
      walletAmountUsed: 0,
      tax: 50,
      taxRate: 5,
      shippingFee: 0,
      total: 1050,
      currency: 'AED',
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      shippingAddress: { id: 'a1', fullName: 'Customer', phone: '+971501111111', addressLine1: 'Line 1', city: 'Dubai', state: 'Dubai', postalCode: '0', country: 'UAE' },
      billingAddress: { id: 'a2', fullName: 'Customer', phone: '+971501111111', addressLine1: 'Line 1', city: 'Dubai', state: 'Dubai', postalCode: '0', country: 'UAE' },
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Zero rated export supply (0% tax)
    await orderRepository.create({
      id: 'order_vat_zero',
      orderNumber: 'ORD-VAT-ZERO',
      userId: 'user_vat_export',
      customerName: 'International Client',
      customerEmail: 'client@global.com',
      items: [],
      subtotal: 5000,
      discount: 0,
      walletAmountUsed: 0,
      tax: 0,
      taxRate: 0,
      taxTreatment: 'ZERO_RATED',
      shippingFee: 0,
      total: 5000,
      currency: 'AED',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      shippingAddress: { id: 'a3', fullName: 'Client', phone: '+971502222222', addressLine1: 'Export Terminal', city: 'Jebel Ali Free Zone', state: 'Dubai', postalCode: '0', country: 'UAE' },
      billingAddress: { id: 'a4', fullName: 'Client', phone: '+971502222222', addressLine1: 'Export Terminal', city: 'Jebel Ali Free Zone', state: 'Dubai', postalCode: '0', country: 'UAE' },
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const vatSummary = await VatService.getVatReturnSummary();
    assert.ok(vatSummary.standardRatedSupplies.taxableAmountAED >= 1000);
    assert.ok(vatSummary.standardRatedSupplies.vatAmountAED >= 50);
    // Box 4 zero-rated supplies should capture the 5000 zero-rated order
    assert.ok(vatSummary.zeroRatedSupplies.taxableAmountAED >= 5000);
    assert.equal(vatSummary.zeroRatedSupplies.vatAmountAED, 0);
  });

  await t.test('4. Payment webhook verifies order details and rejects mismatched amount or nonexistent order', async () => {
    let statusSent = 0;
    let jsonSent: any = null;
    const mockRes: any = {
      status(code: number) {
        statusSent = code;
        return this;
      },
      json(payload: any) {
        jsonSent = payload;
      },
      send(payload: any) {
        jsonSent = payload;
      },
    };

    // Non-existent order in Tamara webhook
    await paymentController.handleTamaraWebhook(
      {
        headers: {},
        body: {
          event_type: 'order_approved',
          order_id: 'tamara_order_123',
          order_reference_id: 'NON_EXISTENT_ORDER_ID',
          total_amount: { amount: 1000, currency: 'AED' },
        },
      } as any,
      mockRes
    );
    assert.equal(statusSent, 404);
    assert.equal(jsonSent?.error, 'Order not found');

    // Mismatched amount on Tamara webhook
    const existingOrder = await orderRepository.create({
      id: 'order_tamara_mismatch',
      orderNumber: 'ORD-TAM-01',
      userId: 'usr_tamara',
      customerName: 'Tamara Buyer',
      customerEmail: 'tamara@test.ae',
      items: [],
      subtotal: 500,
      discount: 0,
      walletAmountUsed: 0,
      tax: 25,
      taxRate: 5,
      shippingFee: 0,
      total: 525,
      currency: 'AED',
      paymentMethod: 'TAMARA',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      shippingAddress: { id: 'ad1', fullName: 'Buyer', phone: '+971503333333', addressLine1: 'Line', city: 'Dubai', state: 'Dubai', postalCode: '0', country: 'UAE' },
      billingAddress: { id: 'ad2', fullName: 'Buyer', phone: '+971503333333', addressLine1: 'Line', city: 'Dubai', state: 'Dubai', postalCode: '0', country: 'UAE' },
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    statusSent = 0;
    jsonSent = null;
    await paymentController.handleTamaraWebhook(
      {
        headers: {},
        body: {
          event_type: 'order_approved',
          order_id: 'tamara_order_456',
          order_reference_id: existingOrder.id,
          total_amount: { amount: 100, currency: 'AED' }, // Mismatched: expected 525, got 100
        },
      } as any,
      mockRes
    );
    assert.equal(statusSent, 400);
    assert.equal(jsonSent?.error, 'Amount mismatch');
  });

  await t.test('5. Order OTP authorization is bound to cart hash and rejects tampering', async () => {
    const userId = 'usr_otp_test_1';
    const userEmail = 'test-otp-shopper@nextech.ae';
    const userName = 'Shopper Test';

    // Generate OTP for a cart of 100 AED
    const otpResult = await emailOtpService.generateAndSendOtp({
      userId,
      userEmail,
      userName,
      cartSummary: { total: 100, itemsCount: 2, currency: 'AED' },
    });
    assert.equal(otpResult.success, true);
    assert.ok(otpResult.devCode);

    const generatedCode = otpResult.devCode!;

    // Verify deterministic cart hash computation
    const validHash = computeCheckoutCartHash(userId, 100, 'AED', 2);
    const tamperedHash = computeCheckoutCartHash(userId, 10000, 'AED', 5);
    assert.notEqual(validHash, tamperedHash);

    // Attempt verification with tampered order total (e.g. 5,000 AED instead of 100 AED)
    const tamperedResult = await emailOtpService.verifyOtp({
      userId,
      userEmail,
      code: generatedCode,
      expectedTotal: 5000,
      consumeOnSuccess: false,
    });
    assert.equal(tamperedResult.valid, false);
    assert.ok(tamperedResult.error?.includes('order total has changed'));

    // Verification with matching order total succeeds
    const validResult = await emailOtpService.verifyOtp({
      userId,
      userEmail,
      code: generatedCode,
      expectedTotal: 100,
      expectedItemsCount: 2,
      expectedCartHash: validHash,
      consumeOnSuccess: true,
    });
    assert.equal(validResult.valid, true);
  });
});
