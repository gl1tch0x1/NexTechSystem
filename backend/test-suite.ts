import { ApiClient } from '../frontend/lib/api-client.js';

async function runTestSuite() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('========================================================');
  console.log('🧪 RUNNING COMPREHENSIVE E-COMMERCE END-TO-END TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<any>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err);
      failed++;
    }
  }

  // 1. Health Check
  await test('API Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error('Health check status is not healthy');
  });

  // 2. Auth Tests: Admin Login, Customer Registration, Admin Reseller Provisioning
  let adminToken = '';
  await test('Admin Login (admin@nextech.com)', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nextech.com', password: 'password123' })
    });
    const json = await res.json();
    if (!json.success || !json.data?.token) throw new Error('Admin login failed');
    adminToken = json.data.token;
  });

  let customerToken = '';
  let customerId = '';
  const testId = Date.now().toString().slice(-6);
  const customerEmail = `alex.morgan_${testId}@enterprise.com`;
  const customerUsername = `alexm_${testId}`;
  await test('Customer Unified Auth (Register or Login)', async () => {
    let res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Morgan',
        email: customerEmail,
        username: customerUsername,
        phone: '+971 52 333 4455',
        password: 'password123',
        address: {
          fullName: 'Alex Morgan',
          phone: '+971 52 333 4455',
          addressLine1: 'Downtown Financial Tower, Apt 1402',
          city: 'Dubai',
          state: 'Dubai',
          country: 'United Arab Emirates',
          postalCode: '33445'
        }
      })
    });
    let json = await res.json();
    if (!json.success || !json.data?.token) {
      res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail, password: 'password123' })
      });
      json = await res.json();
    }
    if (!json.success || !json.data?.token) throw new Error('Customer auth failed: ' + (json.error?.message || ''));
    customerToken = json.data.token;
    customerId = json.data.user.id;
  });

  let resellerToken = '';
  const resellerEmail = 'reseller@comnet.com';
  const resellerCode = 'comnet101';
  await test('Admin Provisions or Logs in Reseller Partner Account', async () => {
    let loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resellerEmail, password: 'password123', resellerCode })
    });
    let loginJson = await loginRes.json();
    if (!loginJson.success || !loginJson.data?.token) {
      const res = await fetch(`${BASE_URL}/admin/resellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          businessName: 'ComNet IT Distribution LLC',
          displayName: 'ComNet Hardware Store',
          username: resellerCode,
          email: resellerEmail,
          phone: '+971 55 987 6543',
          resellerCode,
          subdomain: resellerCode,
          commissionRate: 8,
          address: {
            fullName: 'ComNet Distribution Center',
            phone: '+971 55 987 6543',
            addressLine1: 'Al Quoz Industrial Area 3, Warehouse 18',
            city: 'Dubai',
            state: 'Dubai',
            country: 'United Arab Emirates',
            postalCode: '11223'
          },
          businessInformation: {
            taxNumber: 'TRN-100492819200003',
            tradeLicense: 'DED-849201'
          }
        })
      });
      const json = await res.json();
      if (!json.success && !json.error?.message?.includes('already exists')) {
        throw new Error('Admin reseller provisioning failed: ' + (json.error?.message || ''));
      }

      loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resellerEmail, password: 'password123', resellerCode })
      });
      loginJson = await loginRes.json();
    }
    if (!loginJson.success || !loginJson.data?.token) throw new Error('Reseller login failed');
    resellerToken = loginJson.data.token;
  });

  // 3. User Profile Verification (/auth/me)
  await test('Customer Profile Verification (/auth/me)', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const json = await res.json();
    if (!json.success || json.data.user.role !== 'CUSTOMER') throw new Error('Profile verification failed');
  });

  // 4. Products & Catalog
  let sampleProduct: any = null;
  await test('Get Products Catalog with Filters and Facets', async () => {
    const res = await fetch(`${BASE_URL}/products?category=cat_components&limit=5`);
    const json = await res.json();
    if (!json.success || json.data.length === 0) throw new Error('No products returned');
    sampleProduct = json.data[0];
  });

  await test('Get Product Detail by Slug', async () => {
    const res = await fetch(`${BASE_URL}/products/${sampleProduct.slug}`);
    const json = await res.json();
    if (!json.success || !json.data?.product || json.data.product.id !== sampleProduct.id) {
      throw new Error('Product detail mismatch');
    }
  });

  await test('Get Categories and Brands Taxonomy', async () => {
    const resCat = await fetch(`${BASE_URL}/products/categories`);
    const jsonCat = await resCat.json();
    const resBrand = await fetch(`${BASE_URL}/products/brands`);
    const jsonBrand = await resBrand.json();
    if (!jsonCat.success || !jsonBrand.success) throw new Error('Taxonomy fetch failed');
  });

  // 5. PC Builder Components & Validation
  let pcComponents: any = null;
  await test('PC Builder Component Matrix', async () => {
    const res = await fetch(`${BASE_URL}/pc-builder/components`);
    const json = await res.json();
    if (!json.success || !json.data.cpu || !json.data.motherboard) throw new Error('PC Builder components missing');
    pcComponents = json.data;
  });

  await test('PC Builder Compatibility Validation (Valid LGA1700 Build)', async () => {
    const cpu = pcComponents.cpu[0]; // e.g. i9-14900K
    const mobo = pcComponents.motherboard.find((m: any) => m.specifications?.socket === cpu.specifications?.socket) || pcComponents.motherboard[0];
    const ram = pcComponents.ram?.[0];
    const gpu = pcComponents.gpu?.[0];
    const psu = pcComponents.psu?.[0];

    const res = await fetch(`${BASE_URL}/pc-builder/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slots: {
          cpu,
          motherboard: mobo,
          ram,
          gpu,
          psu
        }
      })
    });
    const json = await res.json();
    if (!json.success || typeof json.data?.isCompatible !== 'boolean') {
      throw new Error('Compatibility validation returned invalid response');
    }
  });

  // 6. Cart Calculations & Coupon Validation
  await test('Cart Calculation Engine', async () => {
    const res = await fetch(`${BASE_URL}/cart/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [
          { productId: sampleProduct.id, quantity: 2 }
        ],
        shippingMethod: 'STANDARD'
      })
    });
    const json = await res.json();
    if (!json.success || !json.data?.subtotal || !json.data?.total) {
      throw new Error('Cart calculation failed');
    }
  });

  await test('Coupon Validation (TECH10)', async () => {
    const res = await fetch(`${BASE_URL}/cart/coupon/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'TECH10',
        cartSubtotal: 5000
      })
    });
    const json = await res.json();
    if (!json.success || !json.data?.valid || json.data.discountAmount <= 0) {
      throw new Error('Coupon validation failed');
    }
  });

  // 7. Wallet Top-Up & Balance
  await test('Wallet Top-Up (Demo Funds)', async () => {
    const res = await fetch(`${BASE_URL}/wallet/add-funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ amount: 5000 })
    });
    const json = await res.json();
    if (!json.success || json.data.balance < 5000) {
      throw new Error('Wallet top-up failed');
    }
  });

  await test('Wallet Inquiry & Transaction History', async () => {
    const res = await fetch(`${BASE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const json = await res.json();
    if (!json.success || !json.data.wallet || !Array.isArray(json.data.transactions)) {
      throw new Error('Wallet fetch failed');
    }
  });

  // 8. Order Placement & E-Bill Generation
  let createdOrderId = '';
  await test('Checkout & Order Placement with Wallet + Card', async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [
          {
            productId: sampleProduct.id,
            name: sampleProduct.name,
            price: sampleProduct.price,
            quantity: 1,
            sellerType: sampleProduct.sellerType,
            resellerId: sampleProduct.resellerId
          }
        ],
        shippingAddress: {
          fullName: 'Alex Morgan',
          company: 'Enterprise Solutions LLC',
          street: 'Sheikh Zayed Road, Building 4',
          city: 'Dubai',
          state: 'Dubai',
          country: 'United Arab Emirates',
          zipCode: '00000',
          phone: '+971 50 123 4567'
        },
        paymentMethod: 'WALLET',
        walletAmountToUse: 500,
        couponCode: 'TECH10'
      })
    });
    const json = await res.json();
    if (!json.success || !json.data?.id || !json.data?.orderNumber) {
      throw new Error('Order creation failed: ' + (json.error?.message || 'Unknown error'));
    }
    createdOrderId = json.data.id;
  });

  await test('Fetch Order Details and Verified E-Bill', async () => {
    const res = await fetch(`${BASE_URL}/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const json = await res.json();
    if (!json.success || !json.data.order || !json.data.ebill || !json.data.ebill.invoiceNumber) {
      throw new Error('Order/E-Bill retrieval failed');
    }
  });

  await test('Customer Orders History (/orders/my)', async () => {
    const res = await fetch(`${BASE_URL}/orders/my`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error('Customer orders history failed');
    }
  });

  // 9. Reseller Operations
  let createdResellerProductId = '';
  await test('Reseller Dashboard Metrics', async () => {
    const res = await fetch(`${BASE_URL}/reseller/dashboard`, {
      headers: { Authorization: `Bearer ${resellerToken}` }
    });
    const json = await res.json();
    if (!json.success || json.data?.revenue?.total == null) throw new Error('Reseller dashboard failed');
  });

  await test('Reseller Product Creation (Pending Approval)', async () => {
    const res = await fetch(`${BASE_URL}/reseller/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resellerToken}` },
      body: JSON.stringify({
        name: 'Enterprise Ultra NVMe 4TB SSD Module',
        sku: 'COM-NVME-4TB-01',
        brandName: 'ComNet Tech',
        categoryName: 'Storage & Drives',
        categoryId: 'cat_storage',
        price: 1499,
        stock: 25,
        description: 'High performance PCIe 5.0 Enterprise Grade NVMe drive with 14,000 MB/s read speeds.'
      })
    });
    const json = await res.json();
    if (!json.success || !json.data?.id || json.data.approvalStatus !== 'PENDING_APPROVAL') {
      throw new Error('Reseller product creation failed');
    }
    createdResellerProductId = json.data.id;
  });

  await test('Reseller Inventory Stock Update', async () => {
    const res = await fetch(`${BASE_URL}/reseller/products/${createdResellerProductId}/inventory`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resellerToken}` },
      body: JSON.stringify({ stock: 35, lowStockThreshold: 5 })
    });
    const json = await res.json();
    if (!json.success || json.data?.stock !== 35) throw new Error('Reseller inventory update failed');
  });

  await test('Reseller Excel Template Download', async () => {
    const res = await fetch(`${BASE_URL}/reseller/template/download`);
    if (!res.ok) throw new Error('Template download failed with status ' + res.status);
    const blob = await res.arrayBuffer();
    if (blob.byteLength < 100) throw new Error('Downloaded template buffer is too small');
  });

  // 10. Admin Operations
  await test('Admin Dashboard Master Analytics', async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!json.success || json.data?.revenue?.total == null) throw new Error('Admin dashboard failed');
  });

  await test('Admin Product Approval Workflow', async () => {
    const res = await fetch(`${BASE_URL}/admin/products/${createdResellerProductId}/approval`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'APPROVED' })
    });
    const json = await res.json();
    if (!json.success || json.data?.approvalStatus !== 'APPROVED') {
      throw new Error('Admin product approval failed');
    }
  });

  await test('Admin Order Status Update (To PROCESSING & SHIPPED)', async () => {
    const res = await fetch(`${BASE_URL}/admin/orders/${createdOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'SHIPPED',
        trackingNumber: 'TRACK-DXB-987654321',
        courier: 'DHL Express UAE'
      })
    });
    const json = await res.json();
    if (!json.success || json.data?.orderStatus !== 'SHIPPED') {
      throw new Error('Admin order status update failed');
    }
  });

  await test('Admin Customer & Reseller Management Lists', async () => {
    const resCust = await fetch(`${BASE_URL}/admin/customers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const jsonCust = await resCust.json();
    const resReseller = await fetch(`${BASE_URL}/admin/resellers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const jsonReseller = await resReseller.json();
    if (!jsonCust.success || !jsonReseller.success) throw new Error('Admin management lists fetch failed');
  });

  await test('Admin Audit Logs Inspection', async () => {
    const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error('Audit logs retrieval failed');
    }
  });

  // 11. Edge Cases & Robustness Tests
  await test('PC Builder Compatibility Engine: Socket Mismatch Detection', async () => {
    const lga1700Cpu = {
      id: 'cpu_intel',
      name: 'Intel Core i9-14900K',
      specifications: { socket: 'LGA1700', wattage: '253W' },
      price: 2249
    };
    const am5Mobo = {
      id: 'mobo_amd',
      name: 'ASUS ROG Crosshair X670E Hero',
      specifications: { socket: 'AM5', ramType: 'DDR5' },
      price: 2499
    };

    const res = await fetch(`${BASE_URL}/pc-builder/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slots: { cpu: lga1700Cpu, motherboard: am5Mobo }
      })
    });
    const json = await res.json();
    if (!json.success || json.data.isCompatible !== false) {
      throw new Error('Compatibility engine failed to flag socket mismatch');
    }
    const hasSocketIssue = json.data.issues.some((i: any) => i.category === 'CPU_MOTHERBOARD_SOCKET');
    if (!hasSocketIssue) throw new Error('Socket mismatch issue category missing');
  });

  await test('PC Builder Compatibility Engine: Insufficient PSU Wattage Guard', async () => {
    const highPowerCpu = {
      id: 'cpu_intel',
      name: 'Intel Core i9-14900K',
      specifications: { socket: 'LGA1700', wattage: '253W' },
      price: 2249
    };
    const highPowerGpu = {
      id: 'gpu_rtx4090',
      name: 'ASUS ROG Strix RTX 4090 OC 24GB',
      specifications: { wattage: '450W' },
      price: 7499
    };
    const weakPsu = {
      id: 'psu_weak',
      name: 'Basic Power Supply 300W',
      specifications: { wattage: '300W' },
      price: 150
    };

    const res = await fetch(`${BASE_URL}/pc-builder/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slots: { cpu: highPowerCpu, gpu: highPowerGpu, psu: weakPsu }
      })
    });
    const json = await res.json();
    if (!json.success || json.data.isCompatible !== false) {
      throw new Error('Compatibility engine failed to flag weak PSU');
    }
    const hasPsuError = json.data.issues.some((i: any) => i.category === 'PSU_INSUFFICIENT_WATTAGE');
    if (!hasPsuError) throw new Error('PSU wattage error issue missing');
  });

  await test('Inventory Protection: Out of Stock Order Rejection', async () => {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: sampleProduct.id, quantity: 999999 }],
        shippingAddress: {
          fullName: 'Alex Morgan',
          addressLine1: 'Dubai',
          city: 'Dubai',
          state: 'Dubai',
          country: 'United Arab Emirates',
          postalCode: '00000',
          phone: '+971 50 123 4567'
        },
        billingAddress: {
          fullName: 'Alex Morgan',
          addressLine1: 'Dubai',
          city: 'Dubai',
          state: 'Dubai',
          country: 'United Arab Emirates',
          postalCode: '00000',
          phone: '+971 50 123 4567'
        },
        paymentMethod: 'COD'
      })
    });
    const json = await res.json();
    if (json.success || res.status < 400) {
      throw new Error('Order placement succeeded when stock was insufficient');
    }
  });

  await test('RBAC Security: Unauthenticated Admin Endpoint Blocking', async () => {
    const res = await fetch(`${BASE_URL}/admin/audit-logs`);
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401/403 for unauthenticated admin access, got ${res.status}`);
    }
  });

  await test('RBAC Security: Customer Access to Admin Endpoint Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for customer accessing admin route, got ${res.status}`);
    }
  });

  await test('Wallet Security: Negative / Zero Top-Up Rejection', async () => {
    const res = await fetch(`${BASE_URL}/wallet/add-funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ amount: -500 })
    });
    const json = await res.json();
    if (json.success || res.status < 400) {
      throw new Error('Negative wallet balance addition was not rejected');
    }
  });

  await test('Admin Product Moderation: Rejection with Reason', async () => {
    // Create another dummy product to reject
    const createRes = await fetch(`${BASE_URL}/reseller/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resellerToken}` },
      body: JSON.stringify({
        name: 'Rejected Sample Product',
        sku: 'REJ-SAMPLE-01',
        brandName: 'Test Brand',
        categoryName: 'Components',
        categoryId: 'cat_components',
        price: 99,
        stock: 5,
        description: 'Test Description'
      })
    });
    const createJson = await createRes.json();
    const prodId = createJson.data.id;

    const rejRes = await fetch(`${BASE_URL}/admin/products/${prodId}/approval`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'REJECTED', rejectionReason: 'Incomplete warranty and technical specifications' })
    });
    const rejJson = await rejRes.json();
    if (!rejJson.success || rejJson.data?.approvalStatus !== 'REJECTED' || !rejJson.data?.rejectionReason) {
      throw new Error('Product rejection workflow failed');
    }
  });

  // 34. Dynamic CMS Content Endpoints
  await test('Dynamic CMS Content: Aggregated Homepage API (/api/content/homepage)', async () => {
    const res = await fetch(`${BASE_URL}/content/homepage`);
    const json = await res.json();
    if (!json.success || !json.data) throw new Error('Failed to fetch homepage content');
    const { heroHighlights, solutions, benchmarks, testimonials, features, builderPresets, stats } = json.data;
    if (!Array.isArray(heroHighlights) || heroHighlights.length === 0) throw new Error('Hero highlights missing');
    if (!Array.isArray(solutions) || solutions.length === 0) throw new Error('Solutions missing');
    if (!Array.isArray(benchmarks) || benchmarks.length === 0) throw new Error('Benchmarks missing');
    if (!Array.isArray(testimonials) || testimonials.length === 0) throw new Error('Testimonials missing');
    if (!Array.isArray(features) || features.length === 0) throw new Error('Features missing');
    if (!Array.isArray(builderPresets) || builderPresets.length === 0) throw new Error('Builder presets missing');
    if (!stats || typeof stats.totalProducts !== 'number') throw new Error('Stats missing or invalid');
  });

  await test('Dynamic CMS Content: Individual Domain Endpoints', async () => {
    const endpoints = [
      'hero-highlights',
      'solutions',
      'benchmarks',
      'testimonials',
      'features',
      'builder-presets'
    ];
    for (const ep of endpoints) {
      const res = await fetch(`${BASE_URL}/content/${ep}`);
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
        throw new Error(`Failed to fetch /api/content/${ep}`);
      }
    }
  });


  // 35. Real-Time Admin Analytics & Business Intelligence (/api/admin/analytics)
  await test('Admin Analytics: Advanced BI Engine (/api/admin/analytics)', async () => {
    const res = await fetch(`${BASE_URL}/admin/analytics?range=30d`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (!json.success || !json.data) throw new Error('Failed to fetch analytics data');

    const data = json.data;
    if (!data.kpis || typeof data.kpis.grossRevenue !== 'number') throw new Error('Analytics KPIs missing or invalid');
    if (!Array.isArray(data.revenueTimeline) || data.revenueTimeline.length === 0) throw new Error('Revenue timeline missing');
    if (!Array.isArray(data.topModels) || data.topModels.length === 0) throw new Error('Top models leaderboard missing');
    if (!Array.isArray(data.categoryDistribution) || data.categoryDistribution.length === 0) throw new Error('Category distribution missing');
    if (!Array.isArray(data.brandDistribution) || data.brandDistribution.length === 0) throw new Error('Brand distribution missing');
    if (!data.trafficAnalytics || !Array.isArray(data.trafficAnalytics.geoDistribution) || !Array.isArray(data.trafficAnalytics.trafficSources)) {
      throw new Error('Traffic telemetry analytics missing');
    }
    if (!Array.isArray(data.conversionFunnel) || data.conversionFunnel.length === 0) throw new Error('Conversion funnel missing');

    // Test time range switching (24h, 7d, 90d, 1y)
    for (const r of ['24h', '7d', '90d', '1y']) {
      const rangeRes = await fetch(`${BASE_URL}/admin/analytics?range=${r}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const rangeJson = await rangeRes.json();
      if (!rangeJson.success || !rangeJson.data?.kpis) {
        throw new Error(`Failed to fetch analytics for range ${r}`);
      }
    }
  });

  // 36. Cloudflare CDN, Bot Check Security & Anti-DDoS Endpoints (/api/security)
  await test('Cloudflare Security: Global Edge & CDN Status (/api/security/cloudflare-status)', async () => {
    const res = await fetch(`${BASE_URL}/security/cloudflare-status`);
    const json = await res.json();
    if (!json.success || !json.data) throw new Error('Cloudflare status fetch failed');
    if (!json.data.edgeNode || !json.data.wafMode || !json.data.rateLimitPolicy) {
      throw new Error('Cloudflare telemetry metadata incomplete');
    }
    // Verify custom CDN headers injected
    const cfRay = res.headers.get('cf-ray');
    const xContentTypeOptions = res.headers.get('x-content-type-options');
    if (!cfRay || xContentTypeOptions !== 'nosniff') {
      throw new Error('Missing Cloudflare security response headers');
    }
  });

  await test('Cloudflare Turnstile Bot Verification (/api/security/verify-turnstile)', async () => {
    // Test valid/demo token
    const res = await fetch(`${BASE_URL}/security/verify-turnstile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'demo_verified_token_2026' })
    });
    const json = await res.json();
    if (!json.success || !json.data?.verified) {
      throw new Error('Turnstile verification failed for valid token');
    }

    // Test missing token rejection
    const emptyRes = await fetch(`${BASE_URL}/security/verify-turnstile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const emptyJson = await emptyRes.json();
    if (emptyJson.success || emptyRes.status < 400) {
      throw new Error('Turnstile should reject empty token');
    }
  });

  console.log('\n========================================================');
  console.log(`🏁 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});

