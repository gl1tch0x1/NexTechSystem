import { MongoClient, Db } from 'mongodb';
import bundledUsersData from '@/data/users.json';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'nextech_ecommerce';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let syncPromise: Promise<void> | null = null;

async function syncBundledAdminsToMongo(db: Db): Promise<void> {
  try {
    const usersCol = db.collection('users');
    const bundledAdmins = (bundledUsersData as any[]).filter(u => u.role === 'ADMIN');
    for (const admin of bundledAdmins) {
      if (!admin.email) continue;
      const cleanEmail = String(admin.email).toLowerCase().trim();
      const existing = await usersCol.findOne({
        $or: [{ id: admin.id }, { email: cleanEmail }],
      });
      if (!existing) {
        await usersCol.insertOne({
          id: admin.id,
          name: admin.name || 'Administrator',
          email: cleanEmail,
          username: admin.username || cleanEmail.split('@')[0],
          role: 'ADMIN',
          phone: admin.phone || '',
          avatar: admin.avatar || '',
          addresses: admin.addresses || [],
          passwordHash: admin.passwordHash,
          isActive: admin.isActive !== false,
          createdAt: admin.createdAt || new Date().toISOString(),
          updatedAt: admin.updatedAt || new Date().toISOString(),
        });
        console.log(`[MongoDB Auto-Sync] Synced administrator ${cleanEmail} to MongoDB users collection.`);
      }
    }
  } catch (err: any) {
    console.warn('[MongoDB Auto-Sync Warning]:', err?.message || err);
  }
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

    // Auto-sync bundled administrators if missing from MongoDB collection
    if (!syncPromise) {
      syncPromise = syncBundledAdminsToMongo(db).catch(() => {});
    }

    return db;
  } catch (err: any) {
    console.warn('[MongoDB Frontend Client Warning]:', err?.message || err);
    clientPromise = null;
    return null;
  }
}
