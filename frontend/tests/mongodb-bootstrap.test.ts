import assert from 'node:assert/strict';
import test from 'node:test';
import type { Db } from 'mongodb';
import { syncAllBundledDataToMongo } from '../lib/mongodb';

test('bundled user sync does not overwrite existing password hashes', async () => {
  let userOperations: any[] = [];
  const collections: Record<string, any> = {
    deleted_admins: {
      find: () => ({ toArray: async () => [] }),
    },
    users: {
      bulkWrite: async (operations: any[]) => {
        userOperations = operations;
        return { upsertedCount: 0, modifiedCount: 0 };
      },
    },
    categories: { countDocuments: async () => Number.MAX_SAFE_INTEGER },
    brands: { countDocuments: async () => Number.MAX_SAFE_INTEGER },
    settings: { updateOne: async () => ({ upsertedCount: 0 }) },
  };
  const db = {
    collection: (name: string) => collections[name],
  } as unknown as Db;

  await syncAllBundledDataToMongo(db);

  assert.ok(userOperations.length > 0);
  for (const operation of userOperations) {
    assert.ok(operation.updateOne.update.$setOnInsert.passwordHash);
    assert.equal(operation.updateOne.update.$set?.passwordHash, undefined);
  }
});
