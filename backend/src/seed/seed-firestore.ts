import fs from 'fs';
import path from 'path';

// Load credentials from frontend/.env.local or frontend/.env or .env
const envFiles = [
  path.resolve(process.cwd(), '../frontend/.env.local'),
  path.resolve(process.cwd(), '../frontend/.env'),
  path.resolve(process.cwd(), 'frontend/.env.local'),
  path.resolve(process.cwd(), '.env')
];

for (const f of envFiles) {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && !process.env[k.trim()]) process.env[k.trim()] = v.join('=').trim();
      }
    });
  }
}

import { getFirestore, initializeFirebase } from '../config/firebase.js';
import { dbStore } from '../config/db-store.js';
import {
  SEED_CATEGORIES,
  SEED_BRANDS,
  SEED_PRODUCTS,
  SEED_COUPONS,
  SEED_HERO_HIGHLIGHTS,
  SEED_ENTERPRISE_SOLUTIONS,
  SEED_HARDWARE_BENCHMARKS,
  SEED_TESTIMONIALS,
  SEED_BENTO_FEATURES,
  SEED_BUILDER_PRESETS,
  SEED_STORE_SETTINGS
} from './seed-data.js';

export async function seedCloudFirestore() {
  initializeFirebase();
  const db = getFirestore();

  if (!db) {
    console.warn('⚠️ [Firebase Seed Notice] Firestore instance could not be initialized. Please verify FIREBASE_PROJECT_ID in backend/.env.');
    return;
  }

  console.log('====================================================');
  console.log('🔥 STARTING CLOUD FIRESTORE CLEAN SEED & MIGRATION');
  console.log('====================================================\n');

  try {
    // Clean up old dummy users & resellers from Firestore
    console.log('🧹 Cleaning up old mock accounts from Firestore...');
    await db.collection('users').doc('user_reseller_1').delete().catch(() => {});
    await db.collection('users').doc('user_customer_1').delete().catch(() => {});
    await db.collection('resellers').doc('reseller_comnet_101').delete().catch(() => {});
    console.log('✅ Cleaned up old mock accounts.');

    // 1. Settings
    console.log('⏳ Uploading Store Settings to Firestore...');
    await db.collection('settings').doc('global_settings').set(SEED_STORE_SETTINGS);
    console.log('✅ Seeded store settings.');

    // 2. Categories
    console.log(`⏳ Uploading ${SEED_CATEGORIES.length} categories to Firestore...`);
    for (const cat of SEED_CATEGORIES) {
      await db.collection('categories').doc(cat.id).set(cat);
    }
    console.log(`✅ Seeded ${SEED_CATEGORIES.length} categories.`);

    // 3. Brands
    console.log(`⏳ Uploading ${SEED_BRANDS.length} brands to Firestore...`);
    for (const brand of SEED_BRANDS) {
      await db.collection('brands').doc(brand.id).set(brand);
    }
    console.log(`✅ Seeded ${SEED_BRANDS.length} brands.`);

    // 4. Products
    console.log(`⏳ Uploading ${SEED_PRODUCTS.length} hardware products & spec matrices...`);
    for (const prod of SEED_PRODUCTS) {
      await db.collection('products').doc(prod.id).set(prod);
    }
    console.log(`✅ Seeded ${SEED_PRODUCTS.length} products.`);

    // 5. User Accounts (from database store)
    const localUsers = await dbStore.find('users');
    if (localUsers.length > 0) {
      console.log(`⏳ Uploading ${localUsers.length} user accounts to Firestore...`);
      for (const user of localUsers) {
        await db.collection('users').doc(user.id).set(user);
      }
      console.log(`✅ Seeded ${localUsers.length} user accounts to Firestore.`);
    }

    // 6. Coupons
    console.log(`⏳ Uploading ${SEED_COUPONS.length} active coupons...`);
    for (const c of SEED_COUPONS) {
      await db.collection('coupons').doc(c.id).set(c);
    }
    console.log(`✅ Seeded ${SEED_COUPONS.length} discount coupons.`);

    // 7. Dynamic CMS Entities
    console.log(`⏳ Uploading ${SEED_HERO_HIGHLIGHTS.length} hero highlights...`);
    for (const h of SEED_HERO_HIGHLIGHTS) {
      await db.collection('hero_highlights').doc(h.id).set(h);
    }

    console.log(`⏳ Uploading ${SEED_ENTERPRISE_SOLUTIONS.length} enterprise solutions...`);
    for (const s of SEED_ENTERPRISE_SOLUTIONS) {
      await db.collection('enterprise_solutions').doc(s.id).set(s);
    }

    console.log(`⏳ Uploading ${SEED_HARDWARE_BENCHMARKS.length} hardware benchmarks...`);
    for (const b of SEED_HARDWARE_BENCHMARKS) {
      await db.collection('hardware_benchmarks').doc(b.id).set(b);
    }

    console.log(`⏳ Uploading ${SEED_TESTIMONIALS.length} client testimonials...`);
    for (const t of SEED_TESTIMONIALS) {
      await db.collection('testimonials').doc(t.id).set(t);
    }

    console.log(`⏳ Uploading ${SEED_BENTO_FEATURES.length} bento features...`);
    for (const f of SEED_BENTO_FEATURES) {
      await db.collection('bento_features').doc(f.id).set(f);
    }

    console.log(`⏳ Uploading ${SEED_BUILDER_PRESETS.length} builder presets...`);
    for (const p of SEED_BUILDER_PRESETS) {
      await db.collection('builder_presets').doc(p.id).set(p);
    }

    console.log('\n====================================================');
    console.log('🎉 CLOUD FIRESTORE CLEAN SEED COMPLETED 100%');
    console.log('====================================================');
  } catch (err: any) {
    console.error('\n❌ Firestore Seed Error:', err.message);
  }
}

if (process.argv[1]?.includes('seed-firestore')) {
  seedCloudFirestore().then(() => process.exit(0)).catch(() => process.exit(1));
}
