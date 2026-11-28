import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { mongoDb } from './mongodb.js';
import { ENV } from './env.js';
import { DbSnapshot } from '../types/index.js';

class AsyncLock {
  private queue: Promise<void> = Promise.resolve();

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    const currentLock = this.queue;
    this.queue = currentLock.then(() => nextLock, () => nextLock);

    await currentLock;
    try {
      return await fn();
    } finally {
      release!();
    }
  }
}

interface TxContext {
  txId: string;
}

const txStorage = new AsyncLocalStorage<TxContext>();

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
  try {
    fs.mkdirSync(defaultPath, { recursive: true });
  } catch {}
  return defaultPath;
}

const DATA_DIR = resolveDataDir();

function requireMongoDbForProduction(operation: string): void {
  if (ENV.NODE_ENV === 'production' && !mongoDb.isConnected()) {
    throw new Error(`MongoDB is unavailable. Cannot ${operation} because MongoDB is the authoritative production database.`);
  }
}

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
  private transactionLock = new AsyncLock();

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
      console.error('[DbStore] Error loading disk data:', (err instanceof Error ? err.message : String(err)).replace(/[\r\n]/g, ' '));
    }
  }

  public persistCollection(collectionName: string) {
    const filePath = this.getFilePath(collectionName);
    const randSuffix = crypto.randomBytes(4).toString('hex');
    const tmpPath = `${filePath}.tmp.${Date.now()}_${randSuffix}`;
    try {
      const map = this.getCollectionMap(collectionName);
      const items = Array.from(map.values());
      const data = JSON.stringify(items, null, 2);

      // Write atomically: write to temp file then atomic rename
      fs.writeFileSync(tmpPath, data, 'utf-8');
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (renameErr) {
        // Fallback for Windows if destination file is locked/open
        fs.copyFileSync(tmpPath, filePath);
        try { fs.unlinkSync(tmpPath); } catch {}
      }

      // NOTE: The frontend syncs its catalog directly from this store
      // (frontend/lib/catalog-service.ts reads backend/data_store/products.json).
      // Never write into the frontend source tree from here: files under
      // frontend/ are part of the Next.js module graph, and runtime writes
      // trigger Turbopack rebuilds / page reloads in dev.
    } catch (err) {
      console.error('[DbStore] Error persisting %s:', collectionName, (err instanceof Error ? err.message : String(err)).replace(/[\r\n]/g, ' '));
    } finally {
      // Ensure temp file is cleaned up if it was created
      try {
        fs.unlinkSync(tmpPath);
      } catch {}
    }
  }

  public clearCollection(collectionName: string) {
    if (this.collections.has(collectionName)) {
      this.collections.get(collectionName)!.clear();
    } else {
      this.collections.set(collectionName, new Map());
    }
    const filePath = this.getFilePath(collectionName);
    const randSuffix = crypto.randomBytes(4).toString('hex');
    const tmpPath = `${filePath}.tmp.${Date.now()}_${randSuffix}`;
    try {
      fs.writeFileSync(tmpPath, JSON.stringify([], null, 2), 'utf-8');
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (renameErr) {
        fs.copyFileSync(tmpPath, filePath);
        try { fs.unlinkSync(tmpPath); } catch {}
      }
    } catch (err) {
      console.error('[DbStore] Error clearing collection %s:', collectionName, (err instanceof Error ? err.message : String(err)).replace(/[\r\n]/g, ' '));
    } finally {
      try {
        fs.unlinkSync(tmpPath);
      } catch {}
    }

    // Async clear in MongoDB if connected
    if (mongoDb.isConnected()) {
      const col = mongoDb.getCollection(collectionName);
      if (col) {
        col.deleteMany({}).catch((err: any) => {
          console.warn('[MongoDB Clear error]:', (err instanceof Error ? err.message : String(err)).replace(/[\r\n]/g, ' '));
        });
      }
    }
  }

  private getCollectionMap(name: string): Map<string, any> {
    if (!this.collections.has(name)) {
      const filePath = this.getFilePath(name);
      const map = new Map<string, any>();
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: any[] = JSON.parse(content || '[]');
        for (const item of data) {
          if (item && item.id) {
            map.set(item.id, item);
          }
        }
      } catch (e) {}
      this.collections.set(name, map);
    }
    return this.collections.get(name)!;
  }

  // --- MongoDB Operations ---
  private async syncDocToMongo(collection: string, id: string, data: any) {
    if (!mongoDb.isConnected()) {
      requireMongoDbForProduction(`persist ${collection}/${id}`);
      return;
    }
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return;
    const safeId = id;

    try {
      const col = mongoDb.getCollection(collection);
      if (col) {
        const cleanDoc: Record<string, any> = JSON.parse(
          JSON.stringify(data || {}, (key, val) => {
            if (key && (key.startsWith('$') || key.includes('.') || key === '_id' || key === '__proto__' || key === 'constructor' || key === 'prototype')) {
              return undefined;
            }
            return val;
          })
        );
        cleanDoc.id = safeId;
        await col.replaceOne({ id: { $eq: safeId } } as any, cleanDoc as any, { upsert: true });
      }
    } catch (err: any) {
      if (ENV.NODE_ENV === 'production') throw err;
      console.warn('[MongoDB Sync Notice]:', (err instanceof Error ? err.message : String(err)).replace(/[\r\n]/g, ' '));
    }
  }

  private async deleteDocFromMongo(collection: string, id: string) {
    if (!mongoDb.isConnected()) {
      requireMongoDbForProduction(`delete ${collection}/${id}`);
      return;
    }
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return;
    const safeId = id;

    try {
      const col = mongoDb.getCollection(collection);
      if (col) {
        await col.deleteOne({ id: { $eq: safeId } } as any);
      }
    } catch (err: any) {
      if (ENV.NODE_ENV === 'production') throw err;
      console.warn('[MongoDB Delete Notice]:', err?.message || 'Delete error');
    }
  }

  // --- Core CRUD Operations ---
  public async findById<T = any>(collection: string, id: string): Promise<T | null> {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
      return null;
    }
    const safeId = id;
    if (!mongoDb.isConnected()) {
      requireMongoDbForProduction(`read ${collection}/${id}`);
    }

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
          // MongoDB is authoritative. Do not resurrect a missing record from disk/memory.
          if (ENV.NODE_ENV === 'production') return null;
        }
      } catch (err: any) {
        if (ENV.NODE_ENV === 'production') {
          throw new Error(`MongoDB read failed for ${collection}/${safeId}: ${err?.message || 'unknown database error'}`);
        }
        console.warn('[DbStore MongoDB read error]:', err?.message || 'Read error');
      }
    }

    // 2. Resilient memory/disk fallback
    const map = this.getCollectionMap(collection);
    const item = map.get(id);
    return item ? (JSON.parse(JSON.stringify(item)) as T) : null;
  }

  public async find<T = any>(collection: string, query?: QueryFilter<T>): Promise<T[]> {
    if (!mongoDb.isConnected()) {
      requireMongoDbForProduction(`query ${collection}`);
    }
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
          if (Array.isArray(docs)) {
            return docs as T[];
          }
        }
      } catch (err: any) {
        if (ENV.NODE_ENV === 'production') {
          throw new Error(`MongoDB query failed for ${collection}: ${err?.message || 'unknown database error'}`);
        }
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
    requireMongoDbForProduction(`create ${collection}/${item.id}`);
    return await this.transactionLock.acquire(async () => {
      const map = this.getCollectionMap(collection);
      const copy = JSON.parse(JSON.stringify(item));
      map.set(item.id, copy);
      this.persistCollection(collection);

      await this.syncDocToMongo(collection, item.id, copy);
      return item;
    });
  }

  public async update<T = any>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    requireMongoDbForProduction(`update ${collection}/${id}`);
    return await this.transactionLock.acquire(async () => {
      // Always read MongoDB first in authoritative mode; the local map is only a development cache.
      let existing = mongoDb.isConnected()
        ? await this.findById(collection, id)
        : this.getCollectionMap(collection).get(id);
      if (!existing) return null;
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      const map = this.getCollectionMap(collection);
      map.set(id, updated);
      this.persistCollection(collection);

      await this.syncDocToMongo(collection, id, updated);
      return updated as T;
    });
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    requireMongoDbForProduction(`delete ${collection}/${id}`);
    return await this.transactionLock.acquire(async () => {
      const map = this.getCollectionMap(collection);
      const existed = map.delete(id);
      if (existed) {
        this.persistCollection(collection);
        await this.deleteDocFromMongo(collection, id);
      } else if (mongoDb.isConnected()) {
        await this.deleteDocFromMongo(collection, id);
        return true;
      }
      return existed;
    });
  }

  public async count<T = any>(collection: string, query?: QueryFilter<T>): Promise<number> {
    if (!mongoDb.isConnected()) {
      requireMongoDbForProduction(`count ${collection}`);
    }
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
    if (txStorage.getStore()) {
      return await fn(this);
    }

    return await this.transactionLock.acquire(async () => {
      const txId = typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString('hex');
      return await txStorage.run({ txId }, async () => {
        return await fn(this);
      });
    });
  }

  // --- Enterprise MongoDB Synchronization & Seeding ---
  /**
   * Synchronize one authoritative disk-backed collection without touching
   * unrelated records (orders, users, settings, and so on).
   */
  public async syncCollectionToMongo(collectionName: string): Promise<{ success: boolean; collection: string; records: number }> {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(collectionName)) {
      throw new Error('Invalid collection name.');
    }
    if (!mongoDb.isConnected()) {
      throw new Error('MongoDB is not currently connected. Please verify cluster accessibility & IP allowlist in Atlas.');
    }

    this.loadFromDisk();
    const db = mongoDb.getDb();
    if (!db) throw new Error('MongoDB database instance is null.');

    const items = Array.from(this.getCollectionMap(collectionName).values());
    if (items.length === 0) {
      throw new Error(`No ${collectionName} records are available to synchronize.`);
    }

    const operations = items.map(item => {
      const copy = JSON.parse(JSON.stringify(item));
      delete copy._id;
      const safeId = typeof item.id === 'string' ? item.id : String(item.id);
      return {
        updateOne: {
          filter: { id: { $eq: safeId } },
          update: { $set: copy },
          upsert: true,
        },
      };
    });

    await db.collection(collectionName).bulkWrite(operations, { ordered: false });
    console.log('✅ [MongoDB Sync] Synced %d %s records to MongoDB Atlas.', items.length, collectionName);
    return { success: true, collection: collectionName, records: items.length };
  }

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
      let needsSync = false;
      const productCol = mongoDb.getCollection('products');
      if (productCol) {
        const count = await productCol.countDocuments({});
        if (count < 300) {
          console.log('📦 [MongoDB Bootstrapper] MongoDB catalog has fewer than 300 items (found %d).', count);
          needsSync = true;
        }
      }

      const userCol = mongoDb.getCollection('users');
      if (userCol) {
        const userCount = await userCol.countDocuments({});
        const localUsers = this.getCollectionMap('users');
        if (userCount < localUsers.size || userCount <= 1) {
          console.log('👥 [MongoDB Bootstrapper] MongoDB users collection has only %d records (local store has %d).', userCount, localUsers.size);
          needsSync = true;
        }
      }

      const categoryCol = mongoDb.getCollection('categories');
      if (categoryCol) {
        const catCount = await categoryCol.countDocuments({});
        if (catCount < 10) needsSync = true;
      }

      const brandCol = mongoDb.getCollection('brands');
      if (brandCol) {
        const brandCount = await brandCol.countDocuments({});
        if (brandCount < 20) needsSync = true;
      }

      if (needsSync) {
        console.log('🔄 [MongoDB Bootstrapper] Initializing authoritative synchronization of all collections to MongoDB Atlas...');
        await this.syncAllToMongo();
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
            const fallbackId = `rec_${crypto.randomBytes(6).toString('hex')}`;
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
