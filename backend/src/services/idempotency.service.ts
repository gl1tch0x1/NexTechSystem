/**
 * Enterprise Server-Side Idempotency Service
 * Provides mutual exclusion and response caching for concurrent mutations (orders, payments).
 * Prevents duplicate financial transactions from multiple rapid clicks, network retries, or distributed clients.
 */

export interface IdempotencyEntry {
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
      key,
      userId,
      status: 'IN_FLIGHT',
      createdAt: now,
      expiresAt: now + ttlMs,
    });

    return { status: 'PROCEED' };
  }

  public complete(userId: string, key: string, response: any): void {
    const fullKey = this.buildKey(userId, key);
    const existing = this.store.get(fullKey);
    const now = Date.now();

    if (existing) {
      existing.status = 'COMPLETED';
      existing.response = response;
      existing.expiresAt = now + this.DEFAULT_TTL_MS;
    } else {
      this.store.set(fullKey, {
        key,
        userId,
        status: 'COMPLETED',
        response,
        createdAt: now,
        expiresAt: now + this.DEFAULT_TTL_MS,
      });
    }
  }

  public release(userId: string, key: string): void {
    const fullKey = this.buildKey(userId, key);
    this.store.delete(fullKey);
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
