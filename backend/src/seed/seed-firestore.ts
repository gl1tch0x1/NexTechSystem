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

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  SEED_CATEGORIES,
  SEED_BRANDS,
  SEED_PRODUCTS,
  SEED_USERS,
  SEED_COUPONS,
  SEED_HERO_HIGHLIGHTS,
  SEED_ENTERPRISE_SOLUTIONS,
  SEED_HARDWARE_BENCHMARKS,
  SEED_TESTIMONIALS,
  SEED_BENTO_FEATURES,
  SEED_BUILDER_PRESETS,
  SEED_STORE_SETTINGS
} from './seed-data.js';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nextechsystems-65aaa',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export async function seedCloudFirestore() {
  console.log('====================================================');
  console.log('🔥 STARTING CLOUD FIRESTORE CLEAN SEED & MIGRATION');
  console.log('Target Project:', config.projectId);
  console.log('====================================================\n');

  const app = initializeApp(config);
  const db = getFirestore(app);

  try {
    // Clean up old dummy users & resellers from Firestore
    console.log('🧹 Cleaning up old mock accounts from Firestore...');
    await deleteDoc(doc(db, 'users', 'user_reseller_1')).catch(() => {});
    await deleteDoc(doc(db, 'users', 'user_customer_1')).catch(() => {});
    await deleteDoc(doc(db, 'resellers', 'reseller_comnet_101')).catch(() => {});
    console.log('✅ Cleaned up old mock accounts.');

    // 1. Settings
    console.log('⏳ Uploading Store Settings to Firestore...');
    await setDoc(doc(db, 'settings', 'global_settings'), SEED_STORE_SETTINGS);
    console.log('✅ Seeded store settings.');

    // 2. Categories
    console.log(`⏳ Uploading ${SEED_CATEGORIES.length} categories to Firestore...`);
    for (const cat of SEED_CATEGORIES) {
      await setDoc(doc(db, 'categories', cat.id), cat);
    }
    console.log(`✅ Seeded ${SEED_CATEGORIES.length} categories.`);

    // 3. Brands
    console.log(`⏳ Uploading ${SEED_BRANDS.length} brands to Firestore...`);
    for (const brand of SEED_BRANDS) {
      await setDoc(doc(db, 'brands', brand.id), brand);
    }
    console.log(`✅ Seeded ${SEED_BRANDS.length} brands.`);

    // 4. Products
    console.log(`⏳ Uploading ${SEED_PRODUCTS.length} hardware products & spec matrices...`);
    for (const prod of SEED_PRODUCTS) {
      await setDoc(doc(db, 'products', prod.id), prod);
    }
    console.log(`✅ Seeded ${SEED_PRODUCTS.length} products.`);

    // 5. Single Master Admin User
    console.log(`⏳ Uploading 1 Master Admin account (${SEED_USERS[0].email})...`);
    for (const user of SEED_USERS) {
      await setDoc(doc(db, 'users', user.id), user);
    }
    console.log(`✅ Seeded single master admin account (${SEED_USERS[0].email}) to Firestore.`);

    // 6. Coupons
    console.log(`⏳ Uploading ${SEED_COUPONS.length} active coupons...`);
    for (const c of SEED_COUPONS) {
      await setDoc(doc(db, 'coupons', c.id), c);
    }
    console.log(`✅ Seeded ${SEED_COUPONS.length} discount coupons.`);

    // 7. Dynamic CMS Entities
    console.log(`⏳ Uploading ${SEED_HERO_HIGHLIGHTS.length} hero highlights...`);
    for (const h of SEED_HERO_HIGHLIGHTS) {
      await setDoc(doc(db, 'hero_highlights', h.id), h);
    }

    console.log(`⏳ Uploading ${SEED_ENTERPRISE_SOLUTIONS.length} enterprise solutions...`);
    for (const s of SEED_ENTERPRISE_SOLUTIONS) {
      await setDoc(doc(db, 'enterprise_solutions', s.id), s);
    }

    console.log(`⏳ Uploading ${SEED_HARDWARE_BENCHMARKS.length} hardware benchmarks...`);
    for (const b of SEED_HARDWARE_BENCHMARKS) {
      await setDoc(doc(db, 'hardware_benchmarks', b.id), b);
    }

    console.log(`⏳ Uploading ${SEED_TESTIMONIALS.length} client testimonials...`);
    for (const t of SEED_TESTIMONIALS) {
      await setDoc(doc(db, 'testimonials', t.id), t);
    }

    console.log(`⏳ Uploading ${SEED_BENTO_FEATURES.length} bento features...`);
    for (const f of SEED_BENTO_FEATURES) {
      await setDoc(doc(db, 'bento_features', f.id), f);
    }

    console.log(`⏳ Uploading ${SEED_BUILDER_PRESETS.length} builder presets...`);
    for (const p of SEED_BUILDER_PRESETS) {
      await setDoc(doc(db, 'builder_presets', p.id), p);
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
