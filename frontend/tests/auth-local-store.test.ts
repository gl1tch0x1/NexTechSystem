import assert from 'node:assert/strict';
import test from 'node:test';

test('credential snapshots never outlive a newer authoritative record', async (t) => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'frontend-local-store-test-secret-at-least-32-chars';

  const { hashPassword } = await import('../lib/proxy-helper');
  const {
    addUserCandidates,
    findAcceptableCandidate,
    findVerifiedCandidate,
    isSupersededSnapshot,
    resolveAuthoritativeCandidate,
  } = await import('../lib/auth-local-store');

  const currentPassword = 'Current#Password$2026';
  const oldPassword = 'Old#Password$2025';
  const currentHash = hashPassword(currentPassword);
  const oldHash = hashPassword(oldPassword);

  const bundledUser = {
    id: 'user_admin_master',
    email: 'admin@nextechsystem.com',
    username: 'admin',
    role: 'ADMIN',
    passwordHash: oldHash,
    isActive: true,
    updatedAt: '2026-10-30T06:16:41.718Z',
  };

  const buildCandidates = (authoritative: any) => {
    const candidates: any[] = [];
    addUserCandidates(candidates, 'bundled', [bundledUser], ['admin@nextechsystem.com']);
    if (authoritative) addUserCandidates(candidates, 'mongo', [authoritative], ['admin@nextechsystem.com']);
    return candidates;
  };

  await t.test('accepts the bundled password when MongoDB is unavailable or older', () => {
    const withoutMongo = buildCandidates(null);
    assert.equal(findAcceptableCandidate(withoutMongo, [oldPassword])?.passwordHash, oldHash);

    const olderMongo = buildCandidates({
      ...bundledUser,
      passwordHash: oldHash,
      updatedAt: '2026-10-28T08:25:47.840Z',
    });
    assert.equal(findAcceptableCandidate(olderMongo, [oldPassword])?.passwordHash, oldHash);
  });

  await t.test('rejects a bundled password after MongoDB recorded a newer hash', () => {
    const newerMongo = buildCandidates({
      ...bundledUser,
      passwordHash: currentHash,
      updatedAt: '2026-11-26T13:00:00.000Z',
    });

    assert.equal(findAcceptableCandidate(newerMongo, [oldPassword]), null);
    assert.equal(isSupersededSnapshot(newerMongo[0], newerMongo[1].user), true);
    assert.equal(
      resolveAuthoritativeCandidate(newerMongo, bundledUser)?.user?.passwordHash,
      currentHash,
    );

    // The authoritative password still works and is preferred over the snapshot.
    const current = findVerifiedCandidate(newerMongo, [currentPassword]);
    assert.equal(current?.passwordHash, currentHash);
    assert.equal(current?.source, 'mongo');
  });
});
