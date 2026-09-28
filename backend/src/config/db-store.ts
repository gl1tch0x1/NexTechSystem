import fs from 'fs';
import path from 'path';
import { getFirestore } from './firebase.js';
import { mongoDb } from './mongodb.js';
import { ENV } from './env.js';
import { DbSnapshot } from '../types/index.js';

export interface QueryFilter<T = any> {
  where?: Array<{
    field: keyof T | string;
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'array-contains';
    value: any;
  }>;
  orderBy?: {
    field: keyof T | string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

function resolveDataDir(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), 'backend', 'data_store'),
    path.resolve(process.cwd(), 'data_store'),
    path.resolve(__dirname, '../../data_store'),
    path.resolve(__dirname, '../../../data_store')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  const defaultPath = process.cwd().endsWith('backend')
    ? path.resolve(process.cwd(), 'data_store')
    : path.resolve(process.cwd(), 'backend', 'data_store');
  if (!fs.existsSync(defaultPath)) {
    fs.mkdirSync(defaultPath, { recursive: true });
  }
  return defaultPath;
}

const DATA_DIR = resolveDataDir();

function buildMongoFilter(where?: QueryFilter['where']): any {
  if (!where || where.length === 0) return {};
  const filter: any = {};
  for (const cond of where) {
    const rawField = cond.field as string;
    if (typeof rawField !== 'string') continue;
    const field = rawField.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!field || field.startsWith('$') || field === '__proto__' || field === 'constructor' || field === 'prototype') continue;

    // CodeQL (CWE-89 / CWE-943): Use $eq and literal operators to prevent NoSQL query injection
    switch (cond.operator) {
      case '==':
        filter[field] = { $eq: cond.value };
        break;
      case '!=':
        filter[field] = { $ne: cond.value };
        break;
      case '>':
        filter[field] = { $gt: cond.value };
        break;
      case '>=':
        filter[field] = { $gte: cond.value };
        break;
      case '<':
        filter[field] = { $lt: cond.value };
        break;
      case '<=':
        filter[field] = { $lte: cond.value };
        break;
      case 'in':
        filter[field] = { $in: Array.isArray(cond.value) ? cond.value : [cond.value] };
        break;
      case 'array-contains':
        filter[field] = { $elemMatch: { $eq: cond.value } };
        break;
      default:
        filter[field] = { $eq: cond.value };
    }
  }
  return filter;
}

export class DbStore {
  private static instance: DbStore;
  private collections: Map<string, Map<string, any>> = new Map();
  private loaded: boolean = false;

  private constructor() {
    this.loadFromDisk();
  }

  public static getInstance(): DbStore {
    if (!DbStore.instance) {
      DbStore.instance = new DbStore();
    }
    return DbStore.instance;
  }

  private getFilePath(collectionName: string): string {
    const safeName = path.basename(collectionName).replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(DATA_DIR, `${safeName}.json`);
  }

  private loadFromDisk() {
    if (this.loaded) return;
    try {
      if (fs.existsSync(DATA_DIR)) {
        const files = fs.readdirSync(DATA_DIR);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const colName = path.basename(file, '.json');
            const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
            const data: any[] = JSON.parse(content || '[]');
            const map = new Map<string, any>();
            for (const item of data) {
              if (item && item.id) {
                map.set(item.id, item);
              }
            }
            this.collections.set(colName, map);
          }
        }
      }
      this.loaded = true;
    } catch (err) {
      console.error('[DbStore] Error loading disk data:', err);
    }
  }

  public persistCollection(collectionName: string) {
    try {
      const map = this.getCollectionMap(collectionName);
      const items = Array.from(map.values());
      fs.writeFileSync(this.getFilePath(collectionName), JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DbStore] Error persisting %s:', collectionName, err);
    }
  }

  public clearCollection(collectionName: string) {
    if (this.collections.has(collectionName)) {
      this.collections.get(collectionName)!.clear();
    } else {
      this.collections.set(collectionName, new Map());
    }
    try {
      const filePath = this.getFilePath(collectionName);
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
    } catch (err) {
      console.error('[DbStore] Error clearing collection %s:', collectionName, err);
    }

    // Async clear in MongoDB if connected
    if (mongoDb.isConnected()) {
      const col = mongoDb.getCollection(collectionName);
      if (col) {
        col.deleteMany({}).catch((err: any) => {
          console.warn('[MongoDB Clear error]:', err?.message || 'Clear error');
        });
      }
    }
  }

  private getCollectionMap(name: string): Map<string, any> {
    if (!this.collections.has(name)) {
      const filePath = this.getFilePath(name);
      const map = new Map<string, any>();
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data: any[] = JSON.parse(content || '[]');
          for (const item of data) {
            if (item && item.id) {
              map.set(item.id, item);
            }
          }
        } catch (e) {}
      }
      this.collections.set(name, map);
    }
    return this.collections.get(name)!;
  }

  // --- Firestore Cloud Synchronization Handlers ---
  private async syncDocToFirestore(collection: string, id: string, data: any) {
    if (!ENV.ENABLE_FIRESTORE_SYNC) return;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return;
    try {
      const db = getFirestore();
      if (db) {
        const cleanData = JSON.parse(JSON.stringify(data));
        await db.collection(collection).doc(id).set(cleanData, { merge: true });
      }
    } catch (err: any) {
      if (process.env.DEBUG_FIRESTORE) {
        console.warn('[Firestore Sync Notice]:', err?.message || 'Sync error');
      }
    }
  }

  private async deleteDocFromFirestore(collection: string, id: string) {
    if (!ENV.ENABLE_FIRESTORE_SYNC) return;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return;
    try {
      const db = getFirestore();
      if (db) {
        await db.collection(collection).doc(id).delete();
      }
    } catch (err: any) {
      if (process.env.DEBUG_FIRESTORE) {
        console.warn('[Firestore Delete Notice]:', err?.message || 'Delete error');
      }
    }
  }

  // --- MongoDB Operations ---
  private async syncDocToMongo(collection: string, id: string, data: any) {
    if (!mongoDb.isConnected()) return;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return;
    const safeId = id;

    try {
      const col = mongoDb.getCollection(collection);
      if (col) {
        const cleanDoc: Record<string, any> = JSON.parse(JSON.stringify(data || {}));
        delete cleanDoc._id;
        for (const k of Object.keys(cleanDoc)) {
          if (k.startsWith('$') || k.includes('.') || k === '__proto__' || k === 'constructor' || k === 'prototype') {
            delete cleanDoc[k];
          }
        }
        cleanDoc.id = safeId;
        await col.replaceOne({ id: { $eq: safeId } } as any, cleanDoc as any, { upsert: true });
      }
    } catch (err: any) {
      console.warn('[MongoDB Sync Notice]:', err?.message || 'Sync error');
    }
  }

  private async deleteDocFromMongo(collection: string, id: string) {
    if (!mongoDb.isConnected()) return;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return;
    const safeId = id;

    try {
      const col = mongoDb.getCollection(collection);
      if (col) {
        await col.deleteOne({ id: { $eq: safeId } } as any);
      }
    } catch (err: any) {
      console.warn('[MongoDB Delete Notice]:', err?.message || 'Delete error');
    }
  }

  // --- Core CRUD Operations ---
  public async findById<T = any>(collection: string, id: string): Promise<T | null> {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
      return null;
    }
    const safeId = id;

    // 1. If MongoDB is connected, attempt to read directly from MongoDB
    if (mongoDb.isConnected()) {
      try {
        const col = mongoDb.getCollection(collection);
        if (col) {
          const doc = await col.findOne({ id: { $eq: safeId } } as any, { projection: { _id: 0 } });
          if (doc) {
            // Keep local memory store warm with retrieved record
            const map = this.getCollectionMap(collection);
            map.set(safeId, doc);
            return doc as T;
          }
        }
      } catch (err: any) {
        console.warn('[DbStore MongoDB read error]:', err?.message || 'Read error');
      }
    }

    // 2. Resilient memory/disk fallback
    const map = this.getCollectionMap(collection);
    const item = map.get(id);
    return item ? (JSON.parse(JSON.stringify(item)) as T) : null;
  }

  public async find<T = any>(collection: string, query?: QueryFilter<T>): Promise<T[]> {
    // 1. If MongoDB is connected, query MongoDB with projection, sorting & limits
    if (mongoDb.isConnected()) {
      try {
        const col = mongoDb.getCollection(collection);
        if (col) {
          const filter = buildMongoFilter(query?.where);
          let cursor = col.find(filter, { projection: { _id: 0 } });

          if (query?.orderBy) {
            const rawSortField = String(query.orderBy.field);
            const sortField = rawSortField.replace(/[^a-zA-Z0-9_.-]/g, '');
            if (sortField && !sortField.startsWith('$') && sortField !== '__proto__' && sortField !== 'constructor' && sortField !== 'prototype') {
              const dir = query.orderBy.direction === 'asc' ? 1 : -1;
              cursor = cursor.sort({ [sortField]: dir });
            }
          }

          if (query?.offset && query.offset > 0) {
            cursor = cursor.skip(query.offset);
          }

          if (query?.limit && query.limit > 0) {
            cursor = cursor.limit(query.limit);
          }

          const docs = await cursor.toArray();
          if (docs && docs.length > 0) {
            return docs as T[];
          }
        }
      } catch (err: any) {
        console.warn('[DbStore MongoDB query error]:', err?.message || 'Query error');
      }
    }

    // 2. Resilient memory/disk fallback with filter pipeline
    const map = this.getCollectionMap(collection);
    let items = Array.from(map.values()).map(it => JSON.parse(JSON.stringify(it)));

    if (query?.where && query.where.length > 0) {
      items = items.filter(item => {
        return query.where!.every(cond => {
          const itemVal = item[cond.field as string];
          switch (cond.operator) {
            case '==':
              return itemVal === cond.value;
            case '!=':
              return itemVal !== cond.value;
            case '>':
              return itemVal > cond.value;
            case '>=':
              return itemVal >= cond.value;
            case '<':
              return itemVal < cond.value;
            case '<=':
              return itemVal <= cond.value;
            case 'in':
              return Array.isArray(cond.value) && cond.value.includes(itemVal);
            case 'array-contains':
              return Array.isArray(itemVal) && itemVal.includes(cond.value);
            default:
              return true;
          }
        });
      });
    }

    if (query?.orderBy) {
      const { field, direction } = query.orderBy;
      items.sort((a, b) => {
        const valA = a[field as string];
        const valB = b[field as string];
        if (valA === valB) return 0;
        if (valA == null) return direction === 'asc' ? -1 : 1;
        if (valB == null) return direction === 'asc' ? 1 : -1;
        return direction === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    if (query?.offset) {
      items = items.slice(query.offset);
    }

    if (query?.limit) {
      items = items.slice(0, query.limit);
    }

    return items as T[];
  }

  public async create<T extends { id: string }>(collection: string, item: T): Promise<T> {
    const map = this.getCollectionMap(collection);
    const copy = JSON.parse(JSON.stringify(item));
    map.set(item.id, copy);
    this.persistCollection(collection);

    // Asynchronous Dual Cloud Persistence (MongoDB + Firestore)
    this.syncDocToMongo(collection, item.id, copy).catch(() => {});
    this.syncDocToFirestore(collection, item.id, copy).catch(() => {});

    return item;
  }

  public async update<T = any>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    const map = this.getCollectionMap(collection);
    const existing = map.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    map.set(id, updated);
    this.persistCollection(collection);

    // Asynchronous Dual Cloud Persistence (MongoDB + Firestore)
    this.syncDocToMongo(collection, id, updated).catch(() => {});
    this.syncDocToFirestore(collection, id, updated).catch(() => {});

    return updated as T;
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    const map = this.getCollectionMap(collection);
    const existed = map.delete(id);
    if (existed) {
      this.persistCollection(collection);
      this.deleteDocFromMongo(collection, id).catch(() => {});
      this.deleteDocFromFirestore(collection, id).catch(() => {});
    }
    return existed;
  }

  public async count<T = any>(collection: string, query?: QueryFilter<T>): Promise<number> {
    if (mongoDb.isConnected()) {
      try {
        const col = mongoDb.getCollection(collection);
        if (col) {
          const filter = buildMongoFilter(query?.where);
          return await col.countDocuments(filter);
        }
      } catch (err: any) {
        console.warn('[DbStore MongoDB count error]:', err?.message || 'Count error');
      }
    }
    const results = await this.find(collection, query);
    return results.length;
  }

  public async runTransaction<R>(fn: (db: DbStore) => Promise<R>): Promise<R> {
    return await fn(this);
  }

  // --- Enterprise MongoDB Synchronization & Seeding ---
  public async syncAllToMongo(): Promise<{ success: boolean; collectionsSynced: number; totalRecords: number }> {
    if (!mongoDb.isConnected()) {
      throw new Error('MongoDB is not currently connected. Please verify cluster accessibility & IP allowlist in Atlas.');
    }

    this.loadFromDisk();
    const db = mongoDb.getDb();
    if (!db) throw new Error('MongoDB database instance is null.');

    let collectionsSynced = 0;
    let totalRecords = 0;

    // Collect all collections from disk and memory
    const colNames = new Set<string>();
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          colNames.add(file.replace(/\.json$/, ''));
        }
      }
    }
    for (const key of this.collections.keys()) {
      colNames.add(key);
    }

    for (const colName of colNames) {
      const map = this.getCollectionMap(colName);
      const items = Array.from(map.values());
      if (items.length === 0) continue;

      const mongoCollection = db.collection(colName);

      // Perform bulk upsert operations
      const operations = items.map(item => {
        const copy = JSON.parse(JSON.stringify(item));
        delete copy._id;
        const safeId = typeof item.id === 'string' ? item.id : String(item.id);
        return {
          updateOne: {
            filter: { id: { $eq: safeId } },
            update: { $set: copy },
            upsert: true,
          }
        };
      });

      if (operations.length > 0) {
        await mongoCollection.bulkWrite(operations, { ordered: false });
        collectionsSynced++;
        totalRecords += items.length;
      }
    }

    console.log('✅ [MongoDB Sync] Synced %d collections (%d records) to MongoDB Atlas.', collectionsSynced, totalRecords);
    return { success: true, collectionsSynced, totalRecords };
  }

  public async syncToMongoIfEmpty(): Promise<void> {
    if (!mongoDb.isConnected()) return;
    try {
      const productCol = mongoDb.getCollection('products');
      if (productCol) {
        const count = await productCol.countDocuments({});
        if (count === 0) {
          console.log('📦 [MongoDB Bootstrapper] MongoDB database is currently empty. Synchronizing full enterprise catalog...');
          await this.syncAllToMongo();
        }
      }
    } catch (err: any) {
      console.warn('[MongoDB Bootstrapper Notice]: %s', err?.message || err);
    }
  }

  public async syncAllFromMongo(): Promise<{ success: boolean; collectionsSynced: number; totalRecords: number }> {
    if (!mongoDb.isConnected()) {
      throw new Error('MongoDB is not currently connected.');
    }
    const db = mongoDb.getDb();
    if (!db) throw new Error('MongoDB database instance is null.');

    const collections = await db.listCollections().toArray();
    let collectionsSynced = 0;
    let totalRecords = 0;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const mongoCol = db.collection(colName);
      const docs = await mongoCol.find({}, { projection: { _id: 0 } }).toArray();

      const map = new Map<string, any>();
      for (const doc of docs) {
        if (doc && doc.id) {
          map.set(doc.id, doc);
        }
      }

      this.collections.set(colName, map);
      this.persistCollection(colName);
      collectionsSynced++;
      totalRecords += map.size;
    }

    return { success: true, collectionsSynced, totalRecords };
  }

  public getStorageStats() {
    this.loadFromDisk();
    const stats: Record<string, number> = {};
    let total = 0;
    for (const [colName, map] of this.collections.entries()) {
      stats[colName] = map.size;
      total += map.size;
    }
    return {
      totalRecords: total,
      collectionsCount: this.collections.size,
      collections: stats,
      mongoConnected: mongoDb.isConnected(),
    };
  }

  public exportAll(): DbSnapshot {
    this.loadFromDisk();
    const allCollections: Record<string, any[]> = {};
    let totalRecords = 0;

    try {
      if (fs.existsSync(DATA_DIR)) {
        const files = fs.readdirSync(DATA_DIR);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const colName = file.replace(/\.json$/, '');
            const items = Array.from(this.getCollectionMap(colName).values());
            allCollections[colName] = items;
            totalRecords += items.length;
          }
        }
      }
    } catch (err) {
      console.error('Error reading DATA_DIR during backup export:', err);
    }

    for (const [colName, map] of this.collections.entries()) {
      if (!allCollections[colName]) {
        const items = Array.from(map.values());
        allCollections[colName] = items;
        totalRecords += items.length;
      }
    }

    const jsonStr = JSON.stringify(allCollections);
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');
    const timestamp = new Date().toISOString();
    const id = `snap_${Date.now()}`;

    return {
      id,
      filename: `nextech_db_snapshot_${timestamp.replace(/[:.]/g, '-')}.json`,
      timestamp,
      collectionCount: Object.keys(allCollections).length,
      totalRecords,
      sizeBytes,
      collections: allCollections,
    };
  }

  public async importAll(snapshotData: any): Promise<{ success: boolean; restoredCollections: string[]; totalRecords: number }> {
    if (!snapshotData || typeof snapshotData !== 'object') {
      throw new Error('Invalid snapshot format: Must be a JSON object.');
    }

    const collectionsObj = snapshotData.collections && typeof snapshotData.collections === 'object'
      ? snapshotData.collections
      : snapshotData;

    const restoredCollections: string[] = [];
    let totalRecords = 0;

    const FORBIDDEN_COLLECTIONS = new Set(['__proto__', 'constructor', 'prototype']);
    const SAFE_COL_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

    for (const [colName, items] of Object.entries(collectionsObj)) {
      if (FORBIDDEN_COLLECTIONS.has(colName) || !SAFE_COL_REGEX.test(colName)) {
        continue;
      }
      if (Array.isArray(items)) {
        const map = new Map<string, any>();
        for (const item of items) {
          if (item && item.id) {
            map.set(item.id, item);
          } else {
            const fallbackId = `rec_${Math.random().toString(36).substring(2, 9)}`;
            map.set(fallbackId, { ...item, id: fallbackId });
          }
        }
        this.collections.set(colName, map);
        this.persistCollection(colName);
        restoredCollections.push(colName);
        totalRecords += map.size;
      }
    }

    // If MongoDB is connected, also mirror snapshot into MongoDB
    if (mongoDb.isConnected()) {
      this.syncAllToMongo().catch((err: any) => {
        console.warn('[MongoDB Import Sync Notice]:', err?.message || 'Import sync error');
      });
    }

    return {
      success: true,
      restoredCollections,
      totalRecords,
    };
  }
}

export const dbStore = DbStore.getInstance();
