import http from 'http';
import jwt from 'jsonwebtoken';
import { createApp } from './app.js';
import { ENV } from './config/env.js';
import { userRepository } from './repositories/user.repository.js';
import { productRepository } from './repositories/product.repository.js';
import { User, Product } from './types/index.js';

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function runComprehensiveTest() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E2E WORKFLOW & SECURITY VERIFICATION');
  console.log('================================================================');

  // 1. Start test server
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`[Test Server] Running on http://localhost:${TEST_PORT}`);
      resolve();
    });
  });

  try {
    // 2. Setup Test Customer A & Customer B
    const customerA: User = {
      id: 'test_user_a_' + Date.now(),
      username: 'khalid_qasimi',
      email: 'customer.a@nextech-test.ae',
      name: 'Khalid Al Qasimi',
      role: 'CUSTOMER',
      isActive: true,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await userRepository.create(customerA);

    const customerB: User = {
      id: 'test_user_b_' + Date.now(),
      username: 'sara_suwaidi',
      email: 'customer.b@nextech-test.ae',
      name: 'Sara Al Suwaidi',
      role: 'CUSTOMER',
      isActive: true,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await userRepository.create(customerB);

    const tokenA = jwt.sign(
      { id: customerA.id, email: customerA.email, role: customerA.role },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const tokenB = jwt.sign(
      { id: customerB.id, email: customerB.email, role: customerB.role },
      ENV.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3. Ensure a product exists
    let products = await productRepository.find();
    let testProduct: Product;
    if (products.length === 0) {
      testProduct = (await productRepository.create({
        id: 'prod_fallback_123',
        name: 'Enterprise AI Server Node',
        slug: 'enterprise-ai-server-node',
        sku: 'SRV-AI-9000',
        price: 12000,
        stock: 50,
        categoryId: 'cat_servers',
        isActive: true,
        images: ['/images/server.jpg'],
        currency: 'AED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as Product));
    } else {
      testProduct = products[0];
    }
    const productPrice = testProduct.salePrice || testProduct.price;
    const expectedSubtotal = productPrice;
    const expectedVat = Math.round(productPrice * 0.05 * 100) / 100;
    const expectedBaseTotal = Math.round((expectedSubtotal + expectedVat) * 100) / 100;
    const expectedTabbySurcharge = Math.round(productPrice * 0.08 * 100) / 100;
    const expectedTabbyTotal = Math.round((expectedBaseTotal + expectedTabbySurcharge) * 100) / 100;
    const expectedTamaraSurcharge = Math.round(productPrice * 0.08 * 100) / 100;
    const expectedTamaraTotal = Math.round((expectedBaseTotal + expectedTamaraSurcharge) * 100) / 100;
    const expectedCardSurcharge = Math.round(productPrice * 0.03 * 100) / 100;
    const expectedCardTotal = Math.round((expectedBaseTotal + expectedCardSurcharge) * 100) / 100;
    const expectedCodFreeTotal = expectedBaseTotal;
    const expectedCodPaidTotal = Math.round((expectedBaseTotal + 25) * 100) / 100;

    console.log(`[Test Setup] Using product "${testProduct.name}" (SKU: ${testProduct.sku}, Price: AED ${productPrice})`);

    // -------------------------------------------------------------
    // TEST SECTION 1: EMAIL OTP WORKFLOW
    // -------------------------------------------------------------
    console.log('\n--- [TEST 1] Email OTP Generation & Verification ---');
    const otpReqRes = await fetch(`${BASE_URL}/orders/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ total: expectedTamaraTotal, itemsCount: 1, currency: 'AED' }),
    });
    const otpReqData = (await otpReqRes.json()) as any;
    console.log('OTP Request Response Status:', otpReqRes.status, otpReqData);

    if (otpReqRes.status !== 200 || !otpReqData.success) {
      throw new Error(`OTP request failed: ${JSON.stringify(otpReqData)}`);
    }

    const devOtpCode = otpReqData.data?.devCode;
    console.log(`[OTP Dispatched] Code: ${devOtpCode}, Masked Email: ${otpReqData.data?.maskedEmail}`);

    // Test verify-otp endpoint
    const verifyOtpRes = await fetch(`${BASE_URL}/orders/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ code: devOtpCode }),
    });
    const verifyOtpData = (await verifyOtpRes.json()) as any;
    console.log('OTP Pre-validation Status:', verifyOtpRes.status, verifyOtpData);
    if (verifyOtpRes.status !== 200 || !verifyOtpData.success) {
      throw new Error(`OTP validation failed: ${JSON.stringify(verifyOtpData)}`);
    }

    // -------------------------------------------------------------
    // TEST SECTION 2: TAMARA BNPL ORDER & CHECKOUT SESSION (8% SURCHARGE)
    // -------------------------------------------------------------
    console.log('\n--- [TEST 2] Tamara BNPL Order Creation & Checkout Session (8% Surcharge) ---');
    const tamaraOrderPayload = {
      items: [{ productId: testProduct.id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Khalid Al Qasimi',
        phone: '+971501234567',
        addressLine1: 'Level 14, DIFC Gate Precinct 4',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
      },
      billingAddress: {
        fullName: 'Khalid Al Qasimi',
        phone: '+971501234567',
        addressLine1: 'Level 14, DIFC Gate Precinct 4',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
      },
      paymentMethod: 'TAMARA',
      otpCode: devOtpCode,
    };

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify(tamaraOrderPayload),
    });
    const orderData = (await orderRes.json()) as any;
    console.log('Tamara Order Creation Status:', orderRes.status, 'Order ID:', orderData.id || orderData.data?.id);

    const tamaraOrder = orderData.data || orderData;
    if (!tamaraOrder?.id) {
      throw new Error(`Tamara order creation failed: ${JSON.stringify(orderData)}`);
    }

    if (
      tamaraOrder.paymentSurcharge !== expectedTamaraSurcharge ||
      tamaraOrder.paymentSurchargeRate !== 8 ||
      tamaraOrder.total !== expectedTamaraTotal
    ) {
      throw new Error(`Tamara 8% surcharge verification failed. Surcharge: ${tamaraOrder.paymentSurcharge} (expected ${expectedTamaraSurcharge}), Rate: ${tamaraOrder.paymentSurchargeRate}, Total: ${tamaraOrder.total} (expected ${expectedTamaraTotal})`);
    }
    console.log(`✅ Tamara 8% extra surcharge verified successfully (${expectedTamaraSurcharge} AED surcharge on ${expectedSubtotal} AED subtotal)`);

    // Verify initial payment status is PENDING for BNPL
    if (tamaraOrder.paymentStatus !== 'PENDING') {
      throw new Error(`Expected paymentStatus PENDING for BNPL order, got: ${tamaraOrder.paymentStatus}`);
    }
    console.log(`Tamara Order paymentStatus correctly initialized as: ${tamaraOrder.paymentStatus}`);

    // Initiate payment session
    const initiateRes = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ orderId: tamaraOrder.id, provider: 'TAMARA' }),
    });
    const initiateData = (await initiateRes.json()) as any;
    console.log('Tamara Initiate Payment Status:', initiateRes.status, initiateData);
    if (initiateRes.status !== 200 || !initiateData.data?.redirectUrl) {
      throw new Error(`Tamara payment initiate failed: ${JSON.stringify(initiateData)}`);
    }

    // Verify payment callback settlement
    console.log('\n--- [TEST 3] Tamara Payment Callback Settlement (/payments/verify) ---');
    const verifySettlementRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        orderId: tamaraOrder.id,
        status: 'success',
        paymentId: 'tamara_test_pay_999',
        isSimulated: true,
      }),
    });
    const verifySettlementData = (await verifySettlementRes.json()) as any;
    console.log('Tamara Settlement Verification Status:', verifySettlementRes.status, verifySettlementData);
    if (verifySettlementRes.status !== 200 || verifySettlementData.data?.paymentStatus !== 'PAID') {
      throw new Error(`Tamara settlement verification failed: ${JSON.stringify(verifySettlementData)}`);
    }

    // Check payment status endpoint
    const statusCheckRes = await fetch(`${BASE_URL}/payments/status/${tamaraOrder.id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const statusCheckData = (await statusCheckRes.json()) as any;
    console.log('Tamara Order Payment Status Query:', statusCheckRes.status, statusCheckData.data?.paymentStatus);
    if (statusCheckRes.status !== 200 || statusCheckData.data?.paymentStatus !== 'PAID') {
      throw new Error(`Payment status query failed: ${JSON.stringify(statusCheckData)}`);
    }

    // -------------------------------------------------------------
    // TEST SECTION 3: TABBY BNPL ORDER & WEBHOOK
    // -------------------------------------------------------------
    console.log('\n--- [TEST 4] Tabby BNPL Order Creation & Webhook Settlement (8% Surcharge) ---');
    // Request new OTP for order 2
    const otp2ReqRes = await fetch(`${BASE_URL}/orders/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ total: expectedTabbyTotal, itemsCount: 1, currency: 'AED' }),
    });
    const otp2ReqData = (await otp2ReqRes.json()) as any;
    const otp2Code = otp2ReqData.data?.devCode;

    const tabbyOrderPayload = {
      ...tamaraOrderPayload,
      paymentMethod: 'TABBY',
      otpCode: otp2Code,
    };
    const order2Res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify(tabbyOrderPayload),
    });
    const order2Data = (await order2Res.json()) as any;
    const tabbyOrder = order2Data.data || order2Data;
    console.log('Tabby Order Creation Status:', order2Res.status, 'Order ID:', tabbyOrder.id, 'Total:', tabbyOrder.total);

    if (
      tabbyOrder.paymentSurcharge !== expectedTabbySurcharge ||
      tabbyOrder.paymentSurchargeRate !== 8 ||
      tabbyOrder.total !== expectedTabbyTotal
    ) {
      throw new Error(`Tabby 8% surcharge verification failed. Surcharge: ${tabbyOrder.paymentSurcharge} (expected ${expectedTabbySurcharge}), Rate: ${tabbyOrder.paymentSurchargeRate}, Total: ${tabbyOrder.total} (expected ${expectedTabbyTotal})`);
    }
    console.log(`✅ Tabby 8% extra surcharge verified successfully (${expectedTabbySurcharge} AED surcharge on ${expectedSubtotal} AED subtotal)`);

    // Initiate Tabby session
    const initiateTabbyRes = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ orderId: tabbyOrder.id, provider: 'TABBY' }),
    });
    const initiateTabbyData = (await initiateTabbyRes.json()) as any;
    console.log('Tabby Initiate Status:', initiateTabbyRes.status, initiateTabbyData);
    if (initiateTabbyRes.status !== 200 || !initiateTabbyData.data?.redirectUrl) {
      throw new Error(`Tabby initiate failed: ${JSON.stringify(initiateTabbyData)}`);
    }

    // Test Tabby Webhook
    console.log('\n--- [TEST 5] Tabby Webhook Simulation ---');
    const webhookRes = await fetch(`${BASE_URL}/payments/tabby/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'tabby_payment_web_777',
        status: 'AUTHORIZED',
        amount: expectedTabbyTotal.toFixed(2),
        currency: 'AED',
        order: { reference_id: tabbyOrder.id },
      }),
    });
    console.log('Tabby Webhook Status:', webhookRes.status);
    if (webhookRes.status !== 200) {
      throw new Error(`Tabby webhook failed with status ${webhookRes.status}`);
    }

    // Verify Tabby order upgraded to PAID via webhook
    const tabbyStatusRes = await fetch(`${BASE_URL}/payments/status/${tabbyOrder.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const tabbyStatusData = (await tabbyStatusRes.json()) as any;
    console.log('Tabby Order Post-Webhook Status:', tabbyStatusData.data?.paymentStatus);
    if (tabbyStatusData.data?.paymentStatus !== 'PAID') {
      throw new Error(`Tabby order was not upgraded to PAID by webhook. Current: ${tabbyStatusData.data?.paymentStatus}`);
    }

    // -------------------------------------------------------------
    // TEST SECTION 3.5: CARD 3% SURCHARGE & COD BUR DUBAI VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- [TEST 5.1] Credit/Debit Card 3% Extra Surcharge Verification ---');
    const otpCardReq = await fetch(`${BASE_URL}/orders/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ total: expectedCardTotal, itemsCount: 1, currency: 'AED' }),
    });
    const otpCardData = (await otpCardReq.json()) as any;
    const cardOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        ...tamaraOrderPayload,
        paymentMethod: 'CREDIT_CARD',
        otpCode: otpCardData.data?.devCode,
      }),
    });
    const cardOrder = (await cardOrderRes.json()) as any;
    const cardOrderData = cardOrder.data || cardOrder;
    console.log('Card Order Total:', cardOrderData.total, 'Surcharge:', cardOrderData.paymentSurcharge, 'Rate:', cardOrderData.paymentSurchargeRate);
    if (
      cardOrderData.paymentSurcharge !== expectedCardSurcharge ||
      cardOrderData.paymentSurchargeRate !== 3 ||
      cardOrderData.total !== expectedCardTotal
    ) {
      throw new Error(`Card 3% surcharge failed: Surcharge ${cardOrderData.paymentSurcharge} (expected ${expectedCardSurcharge}), Total ${cardOrderData.total} (expected ${expectedCardTotal})`);
    }
    console.log(`✅ Credit/Debit card 3% surcharge verified successfully (${expectedCardSurcharge} AED surcharge on ${expectedSubtotal} AED subtotal)`);

    console.log('\n--- [TEST 5.2] COD in Bur Dubai (Free COD Fee) ---');
    const otpCodBurDubaiReq = await fetch(`${BASE_URL}/orders/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ total: expectedCodFreeTotal, itemsCount: 1, currency: 'AED' }),
    });
    const otpCodBurDubaiData = (await otpCodBurDubaiReq.json()) as any;
    const codBurDubaiRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        ...tamaraOrderPayload,
        paymentMethod: 'COD',
        shippingAddress: {
          ...tamaraOrderPayload.shippingAddress,
          addressLine1: 'Al Fahidi Historic District, Meena Bazaar, Bur Dubai',
          city: 'Dubai',
        },
        otpCode: otpCodBurDubaiData.data?.devCode,
      }),
    });
    const codBurDubaiOrder = (await codBurDubaiRes.json()) as any;
    const codBurDubaiData = codBurDubaiOrder.data || codBurDubaiOrder;
    console.log('COD Bur Dubai Order Total:', codBurDubaiData.total, 'COD Fee:', codBurDubaiData.codFee, 'Surcharge:', codBurDubaiData.paymentSurcharge);
    if (codBurDubaiData.codFee !== 0 || codBurDubaiData.paymentSurcharge !== 0 || codBurDubaiData.total !== expectedCodFreeTotal) {
      throw new Error(`COD Bur Dubai verification failed: Fee ${codBurDubaiData.codFee}, Total ${codBurDubaiData.total} (expected ${expectedCodFreeTotal})`);
    }
    console.log('✅ COD inside Bur Dubai verified FREE (0.00 AED COD fee)');

    console.log('\n--- [TEST 5.3] COD Outside Bur Dubai (Standard 25 AED Fee) ---');
    const otpCodOutsideReq = await fetch(`${BASE_URL}/orders/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ total: expectedCodPaidTotal, itemsCount: 1, currency: 'AED' }),
    });
    const otpCodOutsideData = (await otpCodOutsideReq.json()) as any;
    const codOutsideRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        ...tamaraOrderPayload,
        paymentMethod: 'COD',
        shippingAddress: {
          ...tamaraOrderPayload.shippingAddress,
          addressLine1: 'Corniche Road, Sector E10',
          city: 'Abu Dhabi',
        },
        otpCode: otpCodOutsideData.data?.devCode,
      }),
    });
    const codOutsideOrder = (await codOutsideRes.json()) as any;
    const codOutsideData = codOutsideOrder.data || codOutsideOrder;
    console.log('COD Outside Bur Dubai Order Total:', codOutsideData.total, 'COD Fee:', codOutsideData.codFee, 'Surcharge:', codOutsideData.paymentSurcharge);
    if (codOutsideData.codFee !== 25 || codOutsideData.paymentSurcharge !== 0 || codOutsideData.total !== expectedCodPaidTotal) {
      throw new Error(`COD Outside Bur Dubai verification failed: Fee ${codOutsideData.codFee}, Total ${codOutsideData.total} (expected ${expectedCodPaidTotal})`);
    }
    console.log('✅ COD outside Bur Dubai verified with 25.00 AED handling fee');

    // -------------------------------------------------------------
    // TEST SECTION 4: SECURITY & ACCESS CONTROL CHECKS
    // -------------------------------------------------------------
    console.log('\n--- [TEST 6] Security Checks: Cross-User IDOR Protection ---');
    // Customer B attempts to check Customer A's order status
    const idorStatusRes = await fetch(`${BASE_URL}/payments/status/${tamaraOrder.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log('IDOR Cross-Customer Status check result:', idorStatusRes.status);
    if (idorStatusRes.status !== 403) {
      throw new Error(`Security vulnerability: Customer B was able to view Customer A order status (Status: ${idorStatusRes.status})`);
    }
    console.log('✅ IDOR status check correctly rejected with 403 Forbidden!');

    // Customer B attempts to verify Customer A's order payment
    const idorVerifyRes = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        orderId: tamaraOrder.id,
        status: 'success',
      }),
    });
    console.log('IDOR Cross-Customer Verify settlement result:', idorVerifyRes.status);
    if (idorVerifyRes.status !== 403) {
      throw new Error(`Security vulnerability: Customer B was able to verify Customer A order payment (Status: ${idorVerifyRes.status})`);
    }
    console.log('✅ IDOR payment verify correctly rejected with 403 Forbidden!');

    // Unauthenticated user attempts payment initiation
    console.log('\n--- [TEST 7] Security Checks: Unauthenticated Access Guard ---');
    const unauthRes = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: tamaraOrder.id, provider: 'TAMARA' }),
    });
    console.log('Unauthenticated access result:', unauthRes.status);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for unauthenticated request, got: ${unauthRes.status}`);
    }
    console.log('✅ Unauthenticated access correctly blocked with 401 Unauthorized!');

    console.log('\n================================================================');
    console.log('🎉 ALL WORKFLOW & SECURITY INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
  } finally {
    server.close();
  }
}

runComprehensiveTest().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
