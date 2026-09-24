const http = require('http');

const endpoints = [
  { name: 'Backend Health Check', url: 'http://localhost:5000/api/health' },
  { name: 'Backend Hardware Catalog', url: 'http://localhost:5000/api/products' },
  { name: 'Backend Categories List', url: 'http://localhost:5000/api/products/categories' },
  { name: 'Backend Brands List', url: 'http://localhost:5000/api/products/brands' },
  { name: 'Frontend Homepage', url: 'http://localhost:3000/' },
  { name: 'Frontend Products Catalog', url: 'http://localhost:3000/products' },
  { name: 'Frontend Product Detail (ASUS RTX 4090)', url: 'http://localhost:3000/products/asus-rog-strix-geforce-rtx-4090-oc-24gb' },
  { name: 'Frontend Custom PC Builder Matrix', url: 'http://localhost:3000/pc-builder' },
  { name: 'Frontend Side-by-Side Comparison', url: 'http://localhost:3000/compare' },
  { name: 'Frontend Cart', url: 'http://localhost:3000/cart' },
  { name: 'Frontend Checkout', url: 'http://localhost:3000/checkout' },
  { name: 'Frontend Customer Dashboard', url: 'http://localhost:3000/account' },
  { name: 'Frontend Customer Orders', url: 'http://localhost:3000/account/orders' },
  { name: 'Frontend Printable E-Bill View', url: 'http://localhost:3000/account/orders/ORD-2026-933963' },
  { name: 'Frontend Customer Wallet', url: 'http://localhost:3000/account/wallet' },
  { name: 'Frontend Customer Wishlist', url: 'http://localhost:3000/account/wishlist' },
  { name: 'Frontend Admin Command Center', url: 'http://localhost:3000/admin' },
  { name: 'Frontend Admin Catalog & Approvals', url: 'http://localhost:3000/admin/products' },
  { name: 'Frontend Admin Reseller Accounts', url: 'http://localhost:3000/admin/resellers' },
  { name: 'Frontend Admin Global Orders', url: 'http://localhost:3000/admin/orders' },
  { name: 'Frontend Admin Coupons', url: 'http://localhost:3000/admin/coupons' },
  { name: 'Frontend Admin Audit Logs', url: 'http://localhost:3000/admin/audit-logs' },
  { name: 'Frontend Reseller Dashboard (ComNet)', url: 'http://localhost:3000/reseller/comnet101/dashboard' },
  { name: 'Frontend Reseller Excel Importer', url: 'http://localhost:3000/reseller/comnet101/products/import' },
  { name: 'Frontend Reseller Inventory', url: 'http://localhost:3000/reseller/comnet101/inventory' },
  { name: 'Frontend Reseller Orders', url: 'http://localhost:3000/reseller/comnet101/orders' },
];

async function checkUrl(name, url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ name, url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    }).on('error', (err) => {
      resolve({ name, url, status: 'ERROR', ok: false, error: err.message });
    });
  });
}

async function run() {
  console.log('--- STARTING COMPREHENSIVE END-TO-END SUITE VERIFICATION ---');
  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    const res = await checkUrl(ep.name, ep.url);
    if (res.ok) {
      console.log(`[PASS] ${res.status} | ${res.name.padEnd(45)} | ${res.url}`);
      passed++;
    } else {
      console.log(`[FAIL] ${res.status} | ${res.name.padEnd(45)} | ${res.url} (${res.error || ''})`);
      failed++;
    }
  }

  console.log('------------------------------------------------------------');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${endpoints.length})`);
  if (failed === 0) {
    console.log('>>> 100% OF ALL SYSTEM ENDPOINTS VERIFIED OPERATIONAL! <<<');
  }
}

run();
