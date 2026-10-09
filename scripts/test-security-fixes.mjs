const API_BASE = 'http://localhost:5000/api';

async function runSecurityTests() {
  console.log('========================================================');
  console.log('🔒 VERIFYING NEW SECURITY FIXES & BUSINESS LOGIC GUARDS');
  console.log('========================================================');

  let passed = 0;
  let failed = 0;

  // 1. Customer registration & login
  const customerEmail = `sec_test_${Date.now()}@nextech-sec.ae`;
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Security Test Customer',
      email: customerEmail,
      password: 'Password123!',
      phone: '+971501112233',
    }),
  });
  const regJson = await regRes.json();
  const customerToken = regJson.data.token;
  console.log('✅ Customer registered and token obtained.');

  // Test 1: Customer attempting addFunds (Wallet Top-Up Bypass)
  const custAddFundsRes = await fetch(`${API_BASE}/wallet/add-funds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ amount: 500, adminPin: '123456' }),
  });
  if (custAddFundsRes.status === 403) {
    console.log('✅ PASS: Regular customer add-funds blocked with 403 Forbidden.');
    passed++;
  } else {
    console.error('❌ FAIL: Regular customer was not blocked with 403! Status:', custAddFundsRes.status);
    failed++;
  }

  // Admin login
  const adminRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@nextech.com',
      password: 'password@123',
    }),
  });
  const adminJson = await adminRes.json();
  const adminToken = adminJson.data.token;

  // Test 2: Admin attempting addFunds with WRONG PIN
  const adminWrongPinRes = await fetch(`${API_BASE}/wallet/add-funds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ amount: 500, adminPin: '000000' }),
  });
  if (adminWrongPinRes.status === 403) {
    console.log('✅ PASS: Admin add-funds with invalid PIN blocked with 403 Forbidden.');
    passed++;
  } else {
    console.error('❌ FAIL: Admin add-funds with invalid PIN status:', adminWrongPinRes.status);
    failed++;
  }

  // Test 3: Bur Dubai Address Spoof Protection
  // Submitting an address with "Bur Dubai" in line1 but city "Abu Dhabi" should NOT waive COD fee
  const spoofAddressRes = await fetch(`${API_BASE}/cart/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'amd-ryzen-9-7950x-processor', quantity: 1 }],
      paymentMethod: 'COD',
      shippingAddress: {
        addressLine1: 'Bur Dubai Street 12',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'United Arab Emirates',
      },
    }),
  });
  const spoofData = await spoofAddressRes.json();
  if (spoofData.data?.codFee === 25) {
    console.log('✅ PASS: Bur Dubai spoof outside Dubai emirate correctly charged 25 AED COD fee.');
    passed++;
  } else {
    console.error('❌ FAIL: Bur Dubai spoof was granted waiver! COD fee:', spoofData.data?.codFee);
    failed++;
  }

  // Valid Bur Dubai address inside Dubai
  const validBurDubaiRes = await fetch(`${API_BASE}/cart/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: 'amd-ryzen-9-7950x-processor', quantity: 1 }],
      paymentMethod: 'COD',
      shippingAddress: {
        addressLine1: 'Al Fahidi, Meena Bazaar, Bur Dubai',
        city: 'Dubai',
        state: 'Dubai',
        country: 'United Arab Emirates',
      },
    }),
  });
  const validData = await validBurDubaiRes.json();
  if (validData.data?.codFee === 0) {
    console.log('✅ PASS: Authentic Bur Dubai address correctly received 0 AED COD fee waiver.');
    passed++;
  } else {
    console.error('❌ FAIL: Authentic Bur Dubai address did not receive 0 AED COD fee:', validData.data?.codFee);
    failed++;
  }

  // Test 4: Coupon Per-User Limit Enforcement
  // Validate SUMMER50 first time (perUserLimit is 1)
  const val1Res = await fetch(`${API_BASE}/cart/coupon/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ code: 'SUMMER50', subtotal: 1000 }),
  });
  const val1Data = await val1Res.json();
  if (val1Res.ok && val1Data.data?.valid) {
    console.log('✅ PASS: First-time coupon validation succeeded.');
    passed++;
  } else {
    console.error('❌ FAIL: First-time coupon validation failed:', val1Data);
    failed++;
  }

  // Request OTP to place order
  const otpRes = await fetch(`${API_BASE}/orders/request-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      total: 1000,
      itemsCount: 1,
      currency: 'AED',
    }),
  });
  const otpData = await otpRes.json();
  const devCode = otpData.data?.devCode;

  // Retrieve an existing product ID from catalog
  const prodRes = await fetch(`${API_BASE}/products?limit=1`);
  const prodData = await prodRes.json();
  const testProductId = prodData.data?.products?.[0]?.id || prodData.data?.[0]?.id;

  // Place order with SUMMER50
  const orderRes = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      customerName: 'Security Test Customer',
      customerEmail: customerEmail,
      items: [{ productId: testProductId, quantity: 1 }],
      shippingAddress: {
        addressLine1: 'Al Fahidi Street',
        city: 'Dubai',
        country: 'United Arab Emirates',
      },
      billingAddress: {
        addressLine1: 'Al Fahidi Street',
        city: 'Dubai',
        country: 'United Arab Emirates',
      },
      paymentMethod: 'IN_STORE',
      couponCode: 'SUMMER50',
      otpCode: devCode,
    }),
  });
  const orderData = await orderRes.json();
  if (orderRes.ok && orderData.data?.id) {
    console.log('✅ Order placed successfully with coupon SUMMER50.');
    if (orderData.data.inStoreReservationExpiry) {
      console.log('✅ PASS: Order has inStoreReservationExpiry hold timestamp set.');
      passed++;
    } else {
      console.error('❌ FAIL: Order missing inStoreReservationExpiry hold timestamp!');
      failed++;
    }
  } else {
    console.error('❌ FAIL: Order placement failed:', orderData);
    failed++;
  }

  // Now attempt to validate SUMMER50 a second time for the same user
  const val2Res = await fetch(`${API_BASE}/cart/coupon/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ code: 'SUMMER50', subtotal: 1000 }),
  });
  const val2Data = await val2Res.json();
  if (val2Res.status === 400 && val2Data.error?.code === 'COUPON_USER_LIMIT_REACHED') {
    console.log('✅ PASS: Second coupon redemption correctly blocked with COUPON_USER_LIMIT_REACHED.');
    passed++;
  } else {
    console.error('❌ FAIL: Second coupon redemption was not blocked as expected:', val2Res.status, val2Data);
    failed++;
  }

  console.log('========================================================');
  console.log(`SECURITY VERIFICATION RESULTS: Passed ${passed}, Failed ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((e) => {
  console.error('FATAL TEST ERROR:', e);
  process.exit(1);
});
