import { dbStore, QueryFilter } from '../config/db-store.js';

export abstract class BaseRepository<T extends { id: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async findById(id: string): Promise<T | null> {
    return dbStore.findById<T>(this.collectionName, id);
  }

  async find(query?: QueryFilter<T>): Promise<T[]> {
    return dbStore.find<T>(this.collectionName, query);
  }

  async findOne(where: QueryFilter<T>['where']): Promise<T | null> {
    const results = await dbStore.find<T>(this.collectionName, { where, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async create(item: T): Promise<T> {
    return dbStore.create<T>(this.collectionName, item);
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    return dbStore.update<T>(this.collectionName, id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return dbStore.delete(this.collectionName, id);
  }

  async count(query?: QueryFilter<T>): Promise<number> {
    return dbStore.count<T>(this.collectionName, query);
  }
}
