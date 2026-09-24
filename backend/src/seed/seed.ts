import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { purchaseOrderRepository } from '../repositories/purchase-order.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import {
  heroHighlightRepo,
  enterpriseSolutionRepo,
  benchmarkRepo,
  testimonialRepo,
  bentoFeatureRepo,
  builderPresetRepo
} from '../repositories/content.repository.js';
import { dbStore } from '../config/db-store.js';
import {
  SEED_CATEGORIES,
  SEED_BRANDS,
  SEED_PRODUCTS,
  SEED_USERS,
  SEED_RESELLERS,
  SEED_COUPONS,
  SEED_HERO_HIGHLIGHTS,
  SEED_ENTERPRISE_SOLUTIONS,
  SEED_HARDWARE_BENCHMARKS,
  SEED_TESTIMONIALS,
  SEED_BENTO_FEATURES,
  SEED_BUILDER_PRESETS,
  SEED_STORE_SETTINGS,
  SEED_PURCHASE_ORDERS,
  SEED_ORDERS
} from './seed-data.js';

import { ebillService } from '../services/ebill.service.js';
import { walletService } from '../services/wallet.service.js';
import { auditService } from '../services/audit.service.js';

export async function runSeed(clean = false) {
  console.log('[Seed] Starting database seed process...');

  if (clean) {
    console.log('[Seed] Resetting existing collections and removing mock/test data...');
    dbStore.clearCollection('categories');
    dbStore.clearCollection('brands');
    dbStore.clearCollection('products');
    dbStore.clearCollection('users');
    dbStore.clearCollection('resellers');
    dbStore.clearCollection('coupons');
    dbStore.clearCollection('banners');
    dbStore.clearCollection('settings');
    dbStore.clearCollection('hero_highlights');
    dbStore.clearCollection('enterprise_solutions');
    dbStore.clearCollection('hardware_benchmarks');
    dbStore.clearCollection('testimonials');
    dbStore.clearCollection('bento_features');
    dbStore.clearCollection('builder_presets');
    dbStore.clearCollection('purchase_orders');
    dbStore.clearCollection('orders');
    dbStore.clearCollection('ebills');
    dbStore.clearCollection('quotes');
    dbStore.clearCollection('wallets');
    dbStore.clearCollection('wallet_transactions');
    dbStore.clearCollection('audit_logs');
  }

  // 1. Settings
  await settingsRepository.create({ id: 'global_settings', ...SEED_STORE_SETTINGS });

  // 2. Categories
  for (const cat of SEED_CATEGORIES) {
    await categoryRepository.create(cat);
  }
  console.log(`[Seed] Seeded ${SEED_CATEGORIES.length} categories.`);

  // 3. Brands
  for (const brand of SEED_BRANDS) {
    await brandRepository.create(brand);
  }
  console.log(`[Seed] Seeded ${SEED_BRANDS.length} brands.`);

  // 4. Users
  for (const user of SEED_USERS) {
    await userRepository.create(user);
  }
  console.log(`[Seed] Seeded ${SEED_USERS.length} system users.`);

  // 5. Resellers
  for (const res of SEED_RESELLERS) {
    await resellerRepository.create(res);
  }

  // 6. Products
  for (const prod of SEED_PRODUCTS) {
    await productRepository.create(prod);
  }
  console.log(`[Seed] Seeded ${SEED_PRODUCTS.length} hardware products.`);

  // 7. Coupons
  for (const c of SEED_COUPONS) {
    await couponRepository.create(c);
  }
  console.log(`[Seed] Seeded ${SEED_COUPONS.length} promotional coupons.`);

  // 8. CMS Dynamic Entities
  for (const h of SEED_HERO_HIGHLIGHTS) {
    await heroHighlightRepo.create(h);
  }
  for (const s of SEED_ENTERPRISE_SOLUTIONS) {
    await enterpriseSolutionRepo.create(s);
  }
  for (const b of SEED_HARDWARE_BENCHMARKS) {
    await benchmarkRepo.create(b);
  }
  for (const t of SEED_TESTIMONIALS) {
    await testimonialRepo.create(t);
  }
  for (const f of SEED_BENTO_FEATURES) {
    await bentoFeatureRepo.create(f);
  }
  for (const p of SEED_BUILDER_PRESETS) {
    await builderPresetRepo.create(p);
  }
  for (const po of SEED_PURCHASE_ORDERS) {
    await purchaseOrderRepository.create(po);
  }
  for (const ord of SEED_ORDERS) {
    await orderRepository.create(ord);
  }
  console.log(`[Seed] Seeded ${SEED_PURCHASE_ORDERS.length} Purchase Orders and ${SEED_ORDERS.length} Sales Orders.`);

  // 9. Initial Customer & Admin Digital Wallets
  await walletService.creditWallet({
    userId: 'user_admin_1',
    amount: 50000,
    reason: 'Initial Enterprise Administrative Reserve Balance',
    type: 'CREDIT',
  });
  await walletService.creditWallet({
    userId: 'user_customer_1',
    amount: 10000,
    reason: 'Initial Customer Store Credit Balance',
    type: 'CREDIT',
  });
  console.log('[Seed] Seeded initial customer & administrator wallet ledgers.');

  // 10. Official Tax E-Bills for Orders
  for (const ord of SEED_ORDERS) {
    try {
      const ebill = await ebillService.generateEBill(ord);
      await orderRepository.update(ord.id, { eBillId: ebill.id });
    } catch (err: any) {
      console.warn('[Seed] EBill generation notice for order %s:', ord.orderNumber, err.message);
    }
  }
  console.log(`[Seed] Seeded ${SEED_ORDERS.length} verified UAE FTA E-Bill tax invoices.`);

  // 11. Initial System Bootstrap Audit Log
  await auditService.log({
    userId: 'user_admin_1',
    userEmail: 'admin@nextech.com',
    userRole: 'ADMIN',
    action: 'SYSTEM_BOOTSTRAP',
    resource: 'system',
    details: {
      message: 'NexTech Systems Enterprise Platform catalog & secure store initialized.',
      timestamp: new Date().toISOString(),
    },
  });

  console.log('[Seed] Database seed completed successfully! 🚀');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed(true).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
