import { MongoClient, Db } from 'mongodb';
import bundledUsersData from '@/data/users.json';
import bundledCategoriesData from '@/data/categories.json';
import bundledBrandsData from '@/data/brands.json';
import bundledSettingsData from '@/data/settings.json';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'nextech_ecommerce';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let syncPromise: Promise<any> | null = null;

export async function syncAllBundledDataToMongo(db: Db): Promise<{
  usersSynced: number;
  categoriesSynced: number;
  brandsSynced: number;
  settingsSynced: number;
}> {
  let usersSynced = 0;
  let categoriesSynced = 0;
  let brandsSynced = 0;
  let settingsSynced = 0;

  try {
    // 1. Authoritative synchronization of ALL users (Admins, Resellers, Verified Clients)
    const usersCol = db.collection('users');
    const deletedCol = db.collection('deleted_admins');
    let deletedSet = new Set<string>();
    try {
      const deletedDocs = await deletedCol.find().toArray();
      for (const d of deletedDocs) {
        if (d.target) deletedSet.add(String(d.target).toLowerCase().trim());
        if (d.email) deletedSet.add(String(d.email).toLowerCase().trim());
        if (d.id) deletedSet.add(String(d.id).toLowerCase().trim());
      }
    } catch {}

    const allBundledUsers = Array.isArray(bundledUsersData) ? (bundledUsersData as any[]) : [];
    const userBulkOps: any[] = [];
    for (const u of allBundledUsers) {
      if (!u.email && !u.id) continue;
      const cleanEmail = u.email ? String(u.email).toLowerCase().trim() : '';
      if (cleanEmail && deletedSet.has(cleanEmail)) continue;
      if (u.id && deletedSet.has(String(u.id).toLowerCase().trim())) continue;

      const userDoc = {
        id: u.id,
        name: u.name || 'User',
        email: cleanEmail,
        username: u.username || (cleanEmail ? cleanEmail.split('@')[0] : u.id),
        role: u.role || 'CUSTOMER',
        phone: u.phone || '',
        avatar: u.avatar || '',
        resellerId: u.resellerId || undefined,
        company: u.company || undefined,
        tradeLicense: u.tradeLicense || undefined,
        taxRegistrationNumber: u.taxRegistrationNumber || undefined,
        addresses: u.addresses || [],
        passwordHash: u.passwordHash,
        isActive: u.isActive !== false,
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString(),
      };

      userBulkOps.push({
        updateOne: {
          filter: { $or: [{ id: u.id }, ...(cleanEmail ? [{ email: cleanEmail }] : [])] },
          update: {
            $setOnInsert: userDoc,
            $set: {
              ...(u.passwordHash ? { passwordHash: u.passwordHash } : {}),
              updatedAt: new Date().toISOString(),
            },
          },
          upsert: true,
        },
      });
    }

    if (userBulkOps.length > 0) {
      const res = await usersCol.bulkWrite(userBulkOps, { ordered: false });
      usersSynced = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    }

    // 2. Synchronize categories taxonomy if collection is underpopulated
    const categoriesCol = db.collection('categories');
    const catCount = await categoriesCol.countDocuments({});
    const allBundledCategories = Array.isArray(bundledCategoriesData) ? (bundledCategoriesData as any[]) : [];
    if (catCount < allBundledCategories.length) {
      const catOps = allBundledCategories.map(cat => ({
        updateOne: {
          filter: { $or: [{ id: cat.id }, { slug: cat.slug }] },
          update: { $setOnInsert: cat },
          upsert: true,
        },
      }));
      if (catOps.length > 0) {
        const res = await categoriesCol.bulkWrite(catOps, { ordered: false });
        categoriesSynced = res.upsertedCount || 0;
      }
    }

    // 3. Synchronize hardware brands & enterprise vendors if underpopulated
    const brandsCol = db.collection('brands');
    const brandCount = await brandsCol.countDocuments({});
    const allBundledBrands = Array.isArray(bundledBrandsData) ? (bundledBrandsData as any[]) : [];
    if (brandCount < allBundledBrands.length) {
      const brandOps = allBundledBrands.map(brand => ({
        updateOne: {
          filter: { $or: [{ id: brand.id }, { slug: brand.slug }] },
          update: { $setOnInsert: brand },
          upsert: true,
        },
      }));
      if (brandOps.length > 0) {
        const res = await brandsCol.bulkWrite(brandOps, { ordered: false });
        brandsSynced = res.upsertedCount || 0;
      }
    }

    // 4. Synchronize system governance & global settings if missing
    const settingsCol = db.collection('settings');
    const allBundledSettings = Array.isArray(bundledSettingsData) ? (bundledSettingsData as any[]) : [];
    for (const setting of allBundledSettings) {
      if (!setting.id) continue;
      const res = await settingsCol.updateOne(
        { id: setting.id },
        { $setOnInsert: setting },
        { upsert: true }
      );
      if (res.upsertedCount) settingsSynced++;
    }
  } catch (err: any) {
    console.warn('[MongoDB Full Auto-Sync Warning]:', err?.message || err);
  }

  return { usersSynced, categoriesSynced, brandsSynced, settingsSynced };
}

export async function getMongoDb(): Promise<Db | null> {
  if (!uri) return null;
  try {
    if (!clientPromise) {
      client = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 8000,
        serverSelectionTimeoutMS: 5000,
      });
      clientPromise = client.connect();
    }
    const c = await clientPromise;
    const db = c.db(dbName);

    // Auto-sync bundled users, categories, brands, and settings if missing from MongoDB
    if (!syncPromise) {
      syncPromise = syncAllBundledDataToMongo(db).catch(() => {});
    }

    return db;
  } catch (err: any) {
    console.warn('[MongoDB Frontend Client Warning]:', err?.message || err);
    clientPromise = null;
    return null;
  }
}
