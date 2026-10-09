  import fetch from 'node-fetch';

const BASE_FRONTEND = 'http://localhost:3000/api';
const BASE_BACKEND = 'http://localhost:5000/api';

const results = [];

function record(name, passed, details = '') {
  results.push({ name, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name} ${details ? '(' + details + ')' : ''}`);
}

async function runTests() {
  console.log('--- STARTING IN-DEPTH FULL-STACK VERIFICATION ---');

  // 1. Health check
  try {
    const r = await fetch(`${BASE_BACKEND}/health`);
    const d = await r.json();
    record('Backend /health', r.ok && d.status === 'healthy', `Status: ${d.status}`);
  } catch (e) {
    record('Backend /health', false, e.message);
  }

  // 2. Currencies
  try {
    const r = await fetch(`${BASE_FRONTEND}/currencies`);
    const d = await r.json();
    record('Frontend /api/currencies', r.ok && d.success, `Base: ${d.data?.baseCurrency}`);
  } catch (e) {
    record('Frontend /api/currencies', false, e.message);
  }

  // 3. Categories & Brands
  try {
    const r1 = await fetch(`${BASE_FRONTEND}/products/categories`);
    const d1 = await r1.json();
    record('Frontend /api/products/categories', r1.ok && Array.isArray(d1.data), `Count: ${d1.data?.length}`);

    const r2 = await fetch(`${BASE_FRONTEND}/products/brands`);
    const d2 = await r2.json();
    record('Frontend /api/products/brands', r2.ok && Array.isArray(d2.data), `Count: ${d2.data?.length}`);
  } catch (e) {
    record('Products metadata (Categories & Brands)', false, e.message);
  }

  // 4. Products Listing & Search
  try {
    const r = await fetch(`${BASE_FRONTEND}/products?limit=10`);
    const d = await r.json();
    record('Frontend /api/products list', r.ok && Array.isArray(d.data), `Products: ${d.data?.length}`);
  } catch (e) {
    record('Frontend /api/products list', false, e.message);
  }

  // 5. Cart Calculation
  try {
    const r = await fetch(`${BASE_FRONTEND}/cart/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'prod_1', quantity: 2 }],
        couponCode: 'NEXTECH10',
        paymentMethod: 'TAMARA',
        shippingCity: 'Dubai',
      }),
    });
    const d = await r.json();
    record('Frontend /api/cart/calculate', r.ok, `Total: ${d.data?.total || d.total}`);
  } catch (e) {
    record('Frontend /api/cart/calculate', false, e.message);
  }

  // 6. Coupon Validation
  try {
    const r = await fetch(`${BASE_FRONTEND}/cart/coupon/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'TECH10', subtotal: 1000 }),
    });
    const d = await r.json();
    record('Frontend /api/cart/coupon/validate', r.ok && d.success, `Discount: ${d.data?.discountAmount || d.discountAmount}`);
  } catch (e) {
    record('Frontend /api/cart/coupon/validate', false, e.message);
  }

  // 7. Customer Auth - Register
  const testEmail = `test_flow_${Date.now()}@nextech-verify.ae`;
  let customerToken = '';
  try {
    const r = await fetch(`${BASE_FRONTEND}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountType: 'CUSTOMER',
        name: 'Automated Tester',
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const d = await r.json();
    customerToken = d.data?.token || '';
    record('Customer Registration via Frontend', r.ok && !!customerToken, `Email: ${testEmail}`);
  } catch (e) {
    record('Customer Registration via Frontend', false, e.message);
  }

  // 8. Customer Profile /auth/me
  if (customerToken) {
    try {
      const r = await fetch(`${BASE_FRONTEND}/auth/me`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const d = await r.json();
      record('Customer /auth/me profile verification', r.ok && d.success, `User ID: ${d.data?.id}`);
    } catch (e) {
      record('Customer /auth/me', false, e.message);
    }
  }

  // 9. Customer Wallet
  if (customerToken) {
    try {
      const r = await fetch(`${BASE_FRONTEND}/wallet`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const d = await r.json();
      record('Customer /api/wallet fetch', r.ok && d.success, `Balance: ${d.data?.wallet?.balance ?? d.data?.balance}`);
    } catch (e) {
      record('Customer /api/wallet fetch', false, e.message);
    }
  }

  // 10. Reseller Registration
  const resellerEmail = `reseller_${Date.now()}@nextech-verify.ae`;
  let resellerToken = '';
  try {
    const r = await fetch(`${BASE_FRONTEND}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountType: 'RESELLER',
        name: 'Alpha Solutions Partner',
        email: resellerEmail,
        password: 'Password123!',
        businessName: 'Alpha Tech FZ-LLC',
        tradeLicense: 'TR-998877',
        taxNumber: '100200300400003',
      }),
    });
    const d = await r.json();
    resellerToken = d.data?.token || '';
    record('Reseller Registration via Frontend', r.ok && !!resellerToken, `Business: Alpha Tech`);
  } catch (e) {
    record('Reseller Registration via Frontend', false, e.message);
  }

  // 11. Admin Authentication
  let adminToken = '';
  try {
    // Attempt Admin login with bootstrap credentials
    const r = await fetch(`${BASE_BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nextech.com',
        password: 'password@123',
      }),
    });
    const d = await r.json();
    if (r.ok && d.data?.token) {
      adminToken = d.data.token;
      record('Admin Login', true, 'Authenticated as Admin');
    } else {
      record('Admin Login', false, `Status: ${r.status}, Error: ${JSON.stringify(d)}`);
    }
  } catch (e) {
    record('Admin Login', false, e.message);
  }

  // 12. Admin Endpoints with Admin Token
  if (adminToken) {
    try {
      const r = await fetch(`${BASE_FRONTEND}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = await r.json();
      record('Admin Dashboard API', r.ok && d.success, `Revenue: ${d.data?.metrics?.totalRevenue}`);
    } catch (e) {
      record('Admin Dashboard API', false, e.message);
    }

    try {
      const r = await fetch(`${BASE_FRONTEND}/admin/orders`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = await r.json();
      record('Admin Orders API', r.ok && Array.isArray(d.data), `Orders: ${d.data?.length}`);
    } catch (e) {
      record('Admin Orders API', false, e.message);
    }

    try {
      const r = await fetch(`${BASE_FRONTEND}/admin/brands`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = await r.json();
      record('Admin Brands API', r.ok && Array.isArray(d.data), `Brands: ${d.data?.length}`);
    } catch (e) {
      record('Admin Brands API', false, e.message);
    }

    try {
      const r = await fetch(`${BASE_FRONTEND}/admin/categories`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = await r.json();
      record('Admin Categories API', r.ok && Array.isArray(d.data), `Categories: ${d.data?.length}`);
    } catch (e) {
      record('Admin Categories API', false, e.message);
    }

    // Admin Notifications
    try {
      const r = await fetch(`${BASE_BACKEND}/admin/notifications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = await r.json();
      record('Backend Admin Notifications API', r.ok && d.success, `Notifications count: ${d.data?.notifications?.length}`);
    } catch (e) {
      record('Backend Admin Notifications API', false, e.message);
    }

    try {
      const r = await fetch(`${BASE_FRONTEND}/admin/notifications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = await r.json();
      record('Frontend Admin Notifications Proxy', r.ok, `Status: ${r.status}`);
    } catch (e) {
      record('Frontend Admin Notifications Proxy', false, e.message);
    }

    // Admin Products endpoint
    try {
      const r = await fetch(`${BASE_FRONTEND}/admin/products`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const d = await r.json();
      record('Frontend Admin Products Proxy', r.ok, `Status: ${r.status}`);
    } catch (e) {
      record('Frontend Admin Products Proxy', false, e.message);
    }
  }

  // 13. Warranty Verification
  try {
    const r = await fetch(`${BASE_FRONTEND}/warranty/verify/SN-TEST-12345`);
    const d = await r.json();
    record('Warranty Verification API', r.ok, `Status: ${r.status}`);
  } catch (e) {
    record('Warranty Verification API', false, e.message);
  }

  // 14. Homepage Content
  try {
    const r = await fetch(`${BASE_FRONTEND}/content/homepage`);
    const d = await r.json();
    record('Content Homepage API', r.ok && d.success, `Hero slides: ${d.data?.heroSlides?.length}`);
  } catch (e) {
    record('Content Homepage API', false, e.message);
  }

  // 15. Storefront Settings
  try {
    const r = await fetch(`${BASE_FRONTEND}/content/settings`);
    const d = await r.json();
    record('Storefront Settings API', r.ok && d.success, `Store name: ${d.data?.storeName}`);
  } catch (e) {
    record('Storefront Settings API', false, e.message);
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  const passedCount = results.filter(r => r.passed).length;
  console.log(`TOTAL: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
}

runTests();
