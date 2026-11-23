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
    const allBundledUsers = Array.isArray(bundledUsersData) ? (bundledUsersData as any[]) : [];
    for (const u of allBundledUsers) {
      if (!u.email && !u.id) continue;
      const cleanEmail = u.email ? String(u.email).toLowerCase().trim() : '';
      const existing = await usersCol.findOne({
        $or: [
          ...(u.id ? [{ id: u.id }] : []),
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
        ],
      });

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

      if (!existing) {
        await usersCol.insertOne(userDoc);
        usersSynced++;
      } else if (!existing.passwordHash && u.passwordHash) {
        await usersCol.updateOne(
          { _id: existing._id },
          { $set: { passwordHash: u.passwordHash, updatedAt: new Date().toISOString() } }
        );
        usersSynced++;
      }
    }

    // 2. Synchronize categories taxonomy if collection is underpopulated
    const categoriesCol = db.collection('categories');
    const catCount = await categoriesCol.countDocuments({});
    const allBundledCategories = Array.isArray(bundledCategoriesData) ? (bundledCategoriesData as any[]) : [];
    if (catCount < allBundledCategories.length) {
      for (const cat of allBundledCategories) {
        if (!cat.id && !cat.slug) continue;
        const existing = await categoriesCol.findOne({
          $or: [
            ...(cat.id ? [{ id: cat.id }] : []),
            ...(cat.slug ? [{ slug: cat.slug }] : []),
          ],
        });
        if (!existing) {
          await categoriesCol.insertOne({ ...cat });
          categoriesSynced++;
        }
      }
    }

    // 3. Synchronize hardware brands & enterprise vendors if underpopulated
    const brandsCol = db.collection('brands');
    const brandCount = await brandsCol.countDocuments({});
    const allBundledBrands = Array.isArray(bundledBrandsData) ? (bundledBrandsData as any[]) : [];
    if (brandCount < allBundledBrands.length) {
      for (const brand of allBundledBrands) {
        if (!brand.id && !brand.slug) continue;
        const existing = await brandsCol.findOne({
          $or: [
            ...(brand.id ? [{ id: brand.id }] : []),
            ...(brand.slug ? [{ slug: brand.slug }] : []),
          ],
        });
        if (!existing) {
          await brandsCol.insertOne({ ...brand });
          brandsSynced++;
        }
      }
    }

    // 4. Synchronize system governance & global settings if missing
    const settingsCol = db.collection('settings');
    const allBundledSettings = Array.isArray(bundledSettingsData) ? (bundledSettingsData as any[]) : [];
    for (const setting of allBundledSettings) {
      if (!setting.id) continue;
      const existing = await settingsCol.findOne({ id: setting.id });
      if (!existing) {
        await settingsCol.insertOne({ ...setting });
        settingsSynced++;
      }
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
