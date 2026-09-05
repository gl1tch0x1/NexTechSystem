import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { resellerRepository } from '../repositories/reseller.repository.js';
import { couponRepository } from '../repositories/coupon.repository.js';
import { bannerRepository } from '../repositories/banner.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
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
  SEED_STORE_SETTINGS
} from './seed-data.js';

export async function runSeed(clean = false) {
  console.log('[Seed] Starting database seed process...');

  if (clean) {
    console.log('[Seed] Resetting existing collections...');
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
  console.log('[Seed] Seeded all dynamic CMS entities.');

  console.log('[Seed] Database seed completed successfully! 🚀');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed(true).then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
