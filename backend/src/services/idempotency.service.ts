import { dbStore } from '../config/db-store.js';

export interface IdempotencyEntry {
  id: string;
  key: string;
  userId: string;
  status: 'IN_FLIGHT' | 'COMPLETED';
  response?: any;
  createdAt: number;
  expiresAt: number;
}

export type AcquireResult =
  | { status: 'PROCEED' }
  | { status: 'IN_FLIGHT' }
  | { status: 'COMPLETED'; response: any };

export class IdempotencyService {
  private static instance: IdempotencyService;
  private store: Map<string, IdempotencyEntry> = new Map();
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

  private constructor() {
    // Periodic sweep every 2 minutes
    setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000).unref();
  }

  public static getInstance(): IdempotencyService {
    if (!IdempotencyService.instance) {
      IdempotencyService.instance = new IdempotencyService();
    }
    return IdempotencyService.instance;
  }

  private buildKey(userId: string, key: string): string {
    return `${userId.trim().toLowerCase()}::${key.trim()}`;
  }

  public acquire(userId: string, key: string, ttlMs: number = this.DEFAULT_TTL_MS): AcquireResult {
    const fullKey = this.buildKey(userId, key);
    const now = Date.now();
    const existing = this.store.get(fullKey);

    if (existing) {
      if (existing.expiresAt > now) {
        if (existing.status === 'IN_FLIGHT') {
          return { status: 'IN_FLIGHT' };
        }
        if (existing.status === 'COMPLETED') {
          return { status: 'COMPLETED', response: existing.response };
        }
      } else {
        this.store.delete(fullKey);
      }
    }

    // Mark as in-flight
    this.store.set(fullKey, {
      id: fullKey,
      key,
      userId,
      status: 'IN_FLIGHT',
      createdAt: now,
      expiresAt: now + ttlMs,
    });

    return { status: 'PROCEED' };
  }

  public async acquireAsync(userId: string, key: string, ttlMs: number = this.DEFAULT_TTL_MS): Promise<AcquireResult> {
    const fullKey = this.buildKey(userId, key);
    const now = Date.now();
    let existing = this.store.get(fullKey);

    // If not in local in-memory heap, inspect shared database store
    if (!existing) {
      try {
        const persisted = await dbStore.findById<IdempotencyEntry>('idempotency_keys', fullKey);
        if (persisted && persisted.expiresAt > now) {
          existing = persisted;
          this.store.set(fullKey, existing);
        }
      } catch {}
    }

    if (existing) {
      if (existing.expiresAt > now) {
        if (existing.status === 'IN_FLIGHT') {
          return { status: 'IN_FLIGHT' };
        }
        if (existing.status === 'COMPLETED') {
          return { status: 'COMPLETED', response: existing.response };
        }
      } else {
        this.store.delete(fullKey);
        dbStore.delete('idempotency_keys', fullKey).catch(() => {});
      }
    }

    const newEntry: IdempotencyEntry = {
      id: fullKey,
      key,
      userId,
      status: 'IN_FLIGHT',
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    this.store.set(fullKey, newEntry);
    dbStore.create('idempotency_keys', newEntry).catch(() => {});

    return { status: 'PROCEED' };
  }

  public complete(userId: string, key: string, response: any): void {
    const fullKey = this.buildKey(userId, key);
    const existing = this.store.get(fullKey);
    const now = Date.now();

    const entry: IdempotencyEntry = {
      id: fullKey,
      key,
      userId,
      status: 'COMPLETED',
      response,
      createdAt: existing ? existing.createdAt : now,
      expiresAt: now + this.DEFAULT_TTL_MS,
    };

    this.store.set(fullKey, entry);
    dbStore.create('idempotency_keys', entry).catch(() => {
      dbStore.update('idempotency_keys', fullKey, entry).catch(() => {});
    });
  }

  public release(userId: string, key: string): void {
    const fullKey = this.buildKey(userId, key);
    this.store.delete(fullKey);
    dbStore.delete('idempotency_keys', fullKey).catch(() => {});
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [k, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(k);
      }
    }
  }
}

export const idempotencyService = IdempotencyService.getInstance();
