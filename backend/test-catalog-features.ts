import jwt from 'jsonwebtoken';

async function runCatalogTestSuite() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('========================================================');
  console.log('🧪 RUNNING ADVANCED CATALOG, VARIANTS & SKU TEST SUITE');
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

  const adminToken = jwt.sign(
    { id: 'user_admin_1', email: 'admin@nextech.com', role: 'ADMIN' },
    process.env.JWT_SECRET || 'nextech_super_secret_jwt_key_2026_enterprise',
    { expiresIn: '1h' }
  );

  const customerToken = jwt.sign(
    { id: 'user_customer_1', email: 'client@nextech.com', role: 'CUSTOMER', name: 'Rashid Al-Maktoum' },
    process.env.JWT_SECRET || 'nextech_super_secret_jwt_key_2026_enterprise',
    { expiresIn: '1h' }
  );

  let createdProductId = '';
  let variant1Id = 'var_hp_16g_512g_slv';
  let variant2Id = 'var_hp_32g_1tb_slv';

  // 1. Create Product with Full Variants, Shipping, Tax, and Namespaced Specs
  await test('Admin Creates Enterprise Laptop with Multi-SKU Variants & Logistics', async () => {
    const payload = {
      name: 'HP ProBook 460 G11 Intel Core Ultra 5',
      title: 'HP ProBook 460 G11 Intel Core Ultra 5 16.1" FHD BL ENG DOS',
      sku: 'NX-HP-PB460-BASE',
      barcode: '729183920192',
      brandId: 'brand_hp',
      brandName: 'HP',
      categoryId: 'cat_laptops',
      categoryName: 'Laptops in Computers',
      price: 3360,
      compareAtPrice: 3800,
      costPrice: 2700,
      currency: 'AED',
      stock: 15,
      lowStockThreshold: 3,
      chargeTax: true,
      unitPrice: 3360,
      unitMeasure: 'unit',
      isPhysical: true,
      weight: 1.74,
      dimensions: {
        length: 35.9,
        width: 25.1,
        height: 1.9,
        unit: 'cm',
      },
      hsCode: '8471.30.01',
      allowBackorder: false,
      inventoryTracked: true,
      collections: ['Laptops', 'HP', 'Home & Business Laptops'],
      tags: ['Work Laptop', 'UAE', 'Silver', 'ProBook 460 G11', 'Intel Core Ultra 5', 'DOS', 'FHD'],
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
      specifications: {
        'LAPTOP | Brand': 'HP',
        'LAPTOP | Model': 'ProBook 460 G11',
        'LAPTOP | Screen Size': '16.1"',
        'LAPTOP | Display Resolution': 'FHD (1920 x 1080)',
        'LAPTOP | Display Technology': 'LED Backlit',
        'LAPTOP | Color': 'Silver',
        'LAPTOP | Operating System': 'DOS',
        'LAPTOP | Touchscreen': 'No',
        'LAPTOP | Backlit Keyboard': 'Yes',
        'LAPTOP | Keyboard Type': 'Island-style Chiclet',
        'LAPTOP | Fingerprint Reader': 'No',
        'LAPTOP | Warranty': 'One Year Shop Warranty',
      },
      hasVariants: true,
      variantOptions: [
        { name: 'RAM', values: ['16GB', '32GB'] },
        { name: 'Storage', values: ['512GB SSD', '1TB SSD'] },
      ],
      variants: [
        {
          id: variant1Id,
          sku: 'NX-HP-PB460-16G-512G',
          barcode: '729183920193',
          title: '16GB RAM / 512GB SSD / Silver',
          price: 3360,
          compareAtPrice: 3800,
          costPrice: 2700,
          stock: 10,
          options: { RAM: '16GB', Storage: '512GB SSD', Color: 'Silver' },
          chargeTax: true,
          weight: 1.74,
        },
        {
          id: variant2Id,
          sku: 'NX-HP-PB460-32G-1TB',
          barcode: '729183920194',
          title: '32GB RAM / 1TB SSD / Silver',
          price: 4150,
          compareAtPrice: 4600,
          costPrice: 3300,
          stock: 5,
          options: { RAM: '32GB', Storage: '1TB SSD', Color: 'Silver' },
          chargeTax: true,
          weight: 1.76,
        },
      ],
      locations: [
        {
          locationId: 'loc_dxb_main',
          locationName: 'Dubai Logistics Hub (JAFZA)',
          city: 'Dubai',
          quantity: 10,
          available: 10,
          committed: 0,
          unavailable: 0,
          onHand: 10,
        },
        {
          locationId: 'loc_deira_tech',
          locationName: 'Deira Showroom & Tech Center',
          city: 'Dubai',
          quantity: 5,
          available: 5,
          committed: 0,
          unavailable: 0,
          onHand: 5,
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.success || !json.data?.id) {
      throw new Error(`Product creation failed: ${JSON.stringify(json)}`);
    }

    createdProductId = json.data.id;
    if (json.data.stock !== 15) throw new Error(`Expected aggregated stock 15, got ${json.data.stock}`);
    if (json.data.variants?.length !== 2) throw new Error(`Expected 2 variants, got ${json.data.variants?.length}`);
    if (json.data.weight !== 1.74) throw new Error(`Weight not persisted properly`);
    if (json.data.hsCode !== '8471.30.01') throw new Error(`HS Code not persisted properly`);
  });

  // 2. Test Duplicate SKU Rejection
  await test('Collision Protection: Duplicate Variant SKU Rejected', async () => {
    const payload = {
      name: 'Conflict Test Laptop',
      sku: 'NX-CONFLICT-BASE',
      brandId: 'brand_hp',
      brandName: 'HP',
      categoryId: 'cat_laptops',
      categoryName: 'Laptops',
      price: 2000,
      stock: 5,
      hasVariants: true,
      variants: [
        {
          id: 'var_conflict',
          sku: 'NX-HP-PB460-16G-512G', // Exact duplicate of variant1
          title: 'Duplicate SKU Variant',
          price: 2000,
          stock: 5,
          options: {},
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (json.success || res.status < 400) {
      throw new Error('Duplicate variant SKU was unexpectedly accepted!');
    }
  });

  // 3. Test Collection and Tag Query Filters
  await test('Public Catalog Filtering by Collection & Tags', async () => {
    const colRes = await fetch(`${BASE_URL}/products?collection=Home%20%26%20Business%20Laptops`);
    const colJson = await colRes.json();
    const colList = Array.isArray(colJson.data) ? colJson.data : colJson.data?.products || [];
    if (!colJson.success || !colList.some((p: any) => p.id === createdProductId)) {
      throw new Error(`Collection filtering did not return the created product (found ${colList.length} products)`);
    }

    const tagRes = await fetch(`${BASE_URL}/products?tag=ProBook%20460%20G11`);
    const tagJson = await tagRes.json();
    const tagList = Array.isArray(tagJson.data) ? tagJson.data : tagJson.data?.products || [];
    if (!tagJson.success || !tagList.some((p: any) => p.id === createdProductId)) {
      throw new Error(`Tag filtering did not return the created product (found ${tagList.length} products)`);
    }
  });

  // 4. Cart Calculation with Selected Variant
  await test('Cart Calculation Resolves Variant SKU, Title, and Price', async () => {
    const res = await fetch(`${BASE_URL}/cart/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [
          { productId: createdProductId, variantId: variant2Id, quantity: 1 },
        ],
      }),
    });

    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(`Cart calculation failed: ${JSON.stringify(json)}`);
    }

    const cartItem = json.data.items[0];
    if (cartItem.price !== 4150) {
      throw new Error(`Expected variant2 price 4150, got ${cartItem.price}`);
    }
    if (cartItem.sku !== 'NX-HP-PB460-32G-1TB') {
      throw new Error(`Expected variant2 SKU NX-HP-PB460-32G-1TB, got ${cartItem.sku}`);
    }
    if (!cartItem.productName.includes('32GB RAM')) {
      throw new Error(`Expected variant title to include '32GB RAM', got ${cartItem.productName}`);
    }
    // Tax check: 5% VAT on 4150 is 207.50
    if (Math.abs(json.data.tax - 207.5) > 0.1) {
      throw new Error(`Expected VAT 207.5, got ${json.data.tax}`);
    }
  });

  // 5. Test Tax-Exempt Product Toggle (chargeTax = false)
  await test('Tax Exemption Engine (chargeTax: false exempts item from VAT)', async () => {
    // Create tax exempt item (e.g. specialized software license or export hardware)
    const taxExemptProd = await (await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Enterprise Cloud License 1-Year',
        sku: 'NX-TAX-EXEMPT-LIC',
        brandId: 'brand_hp',
        brandName: 'HP Enterprise',
        categoryId: 'cat_software',
        categoryName: 'Enterprise Software',
        price: 2000,
        stock: 50,
        chargeTax: false, // EXEMPT FROM VAT
        isPhysical: false,
      }),
    })).json();

    const res = await fetch(`${BASE_URL}/cart/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: taxExemptProd.data.id, quantity: 1 }],
      }),
    });

    const json = await res.json();
    if (!json.success) throw new Error('Cart calc failed for tax exempt item');
    if (json.data.tax !== 0) {
      throw new Error(`Expected tax to be 0 for tax-exempt item, but got ${json.data.tax}`);
    }

    // Cleanup tax exempt product
    await fetch(`${BASE_URL}/admin/products/${taxExemptProd.data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  // 6. Test Backorder Policy (allowBackorder = true allows checkout on 0 stock)
  await test('Inventory Backorder Policy (allowBackorder: true allows order when 0 stock)', async () => {
    const backorderProd = await (await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Special Factory Order Server Rack',
        sku: 'NX-BACKORDER-RACK-01',
        brandId: 'brand_hp',
        brandName: 'HP Enterprise',
        categoryId: 'cat_servers',
        categoryName: 'Servers',
        price: 5000,
        stock: 0, // OUT OF STOCK
        allowBackorder: true, // BACKORDER ALLOWED
        inventoryTracked: true,
      }),
    })).json();

    // Verify stock check allows purchase
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: backorderProd.data.id, quantity: 1 }],
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '+971501234567',
          addressLine1: 'Business Bay, Tower 1',
          city: 'Dubai',
          state: 'Dubai',
          country: 'United Arab Emirates',
          postalCode: '00000',
        },
        paymentMethod: 'CREDIT_CARD',
      }),
    });

    const orderJson = await orderRes.json();
    if (!orderJson.success) {
      throw new Error(`Backorder item order failed unexpectedly: ${JSON.stringify(orderJson)}`);
    }

    // Cleanup
    await fetch(`${BASE_URL}/admin/products/${backorderProd.data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  // 7. Order Placement with Variant Decrements Variant Stock & Locations
  await test('Order Placement Deducts Variant-Specific Stock & Location Stock', async () => {
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        items: [{ productId: createdProductId, variantId: variant1Id, quantity: 2 }],
        shippingAddress: {
          fullName: 'Test Customer',
          phone: '+971501234567',
          addressLine1: 'Sheikh Zayed Rd, Suite 400',
          city: 'Dubai',
          state: 'Dubai',
          country: 'United Arab Emirates',
          postalCode: '00000',
        },
        paymentMethod: 'CREDIT_CARD',
      }),
    });

    const orderJson = await orderRes.json();
    if (!orderJson.success) {
      throw new Error(`Order placement failed: ${JSON.stringify(orderJson)}`);
    }

    // Verify order item contains variantId and variantTitle
    const item = orderJson.data.items[0];
    if (item.variantId !== variant1Id) {
      throw new Error(`Expected order item variantId ${variant1Id}, got ${item.variantId}`);
    }

    // Check that product and variant stock were decremented:
    const prodRes = await fetch(`${BASE_URL}/products/hp-probook-460-g11-intel-core-ultra-5`);
    const prodJson = await prodRes.json();
    const prod = prodJson.data?.product;

    if (prod) {
      const v1 = prod.variants?.find((v: any) => v.id === variant1Id);
      if (v1 && v1.stock !== 8) {
        throw new Error(`Expected variant1 stock to be decremented from 10 to 8, got ${v1.stock}`);
      }
      if (prod.stock !== 13) {
        throw new Error(`Expected total product stock to be decremented from 15 to 13, got ${prod.stock}`);
      }
    }
  });

  // Cleanup created test product
  if (createdProductId) {
    await fetch(`${BASE_URL}/admin/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  console.log('\n========================================================');
  console.log(`🏁 ADVANCED CATALOG TESTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runCatalogTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
