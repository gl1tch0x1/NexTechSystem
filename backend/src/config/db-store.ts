import fs from 'fs';
import path from 'path';
import { getFirestore, isFirebaseLive } from './firebase.js';
import { ENV } from './env.js';

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
    return path.join(DATA_DIR, `${collectionName}.json`);
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
      console.error(`[DbStore] Error persisting ${collectionName}:`, err);
    }
  }

  private getCollectionMap(name: string): Map<string, any> {
    if (!this.collections.has(name) || this.collections.get(name)!.size === 0) {
      const filePath = this.getFilePath(name);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data: any[] = JSON.parse(content || '[]');
          const map = this.collections.get(name) || new Map<string, any>();
          for (const item of data) {
            if (item && item.id) {
              map.set(item.id, item);
            }
          }
          this.collections.set(name, map);
          return map;
        } catch (e) {}
      }
      if (!this.collections.has(name)) {
        this.collections.set(name, new Map());
      }
    }
    return this.collections.get(name)!;
  }

  // --- Firestore Cloud Synchronization Handlers ---

  private async syncDocToFirestore(collection: string, id: string, data: any) {
    if (!ENV.ENABLE_FIRESTORE_SYNC) return;
    try {
      const db = getFirestore();
      if (db) {
        // Sanitize object for Firestore (remove undefined, preserve clean JSON)
        const cleanData = JSON.parse(JSON.stringify(data));
        await db.collection(collection).doc(id).set(cleanData, { merge: true });
      }
    } catch (err: any) {
      // Non-blocking background log for Firestore sync
      if (process.env.DEBUG_FIRESTORE) {
        console.warn(`[Firestore Sync Notice] ${collection}/${id}:`, err.message);
      }
    }
  }

  private async deleteDocFromFirestore(collection: string, id: string) {
    if (!ENV.ENABLE_FIRESTORE_SYNC) return;
    try {
      const db = getFirestore();
      if (db) {
        await db.collection(collection).doc(id).delete();
      }
    } catch (err: any) {
      if (process.env.DEBUG_FIRESTORE) {
        console.warn(`[Firestore Delete Notice] ${collection}/${id}:`, err.message);
      }
    }
  }

  // --- Core CRUD Operations with Dual Cloud Sync ---

  public async findById<T = any>(collection: string, id: string): Promise<T | null> {
    const map = this.getCollectionMap(collection);
    const item = map.get(id);
    return item ? (JSON.parse(JSON.stringify(item)) as T) : null;
  }

  public async find<T = any>(collection: string, query?: QueryFilter<T>): Promise<T[]> {
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
        if (direction === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
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
    
    // Asynchronous Cloud Firestore Sync
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

    // Asynchronous Cloud Firestore Sync
    this.syncDocToFirestore(collection, id, updated).catch(() => {});

    return updated as T;
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    const map = this.getCollectionMap(collection);
    const existed = map.delete(id);
    if (existed) {
      this.persistCollection(collection);
      this.deleteDocFromFirestore(collection, id).catch(() => {});
    }
    return existed;
  }

  public async count<T = any>(collection: string, query?: QueryFilter<T>): Promise<number> {
    const results = await this.find(collection, query);
    return results.length;
  }

  public async runTransaction<R>(fn: (db: DbStore) => Promise<R>): Promise<R> {
    return await fn(this);
  }

  public clearCollection(collection: string) {
    this.collections.set(collection, new Map());
    this.persistCollection(collection);
  }
}

export const dbStore = DbStore.getInstance();
