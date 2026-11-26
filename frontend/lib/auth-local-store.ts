import { verifyPassword } from './proxy-helper';

/**
 * Credential sources consulted by the login gateway, in rough authority order:
 * MongoDB and backend settings are live data, everything else is a snapshot
 * (bundled build-time JSON or process memory).
 */
export type LocalSource =
  | 'mongo'
  | 'settings'
  | 'bundled'
  | 'bundled-settings'
  | 'dynamic'
  | 'vault';

export interface LocalCandidate {
  user: any;
  source: LocalSource;
}

export interface VerifiedCandidate {
  user: any;
  passwordHash: string;
  source: LocalSource;
}

/** Sources that are loaded at build time or held in process memory, not live data. */
export const SNAPSHOT_SOURCES: ReadonlySet<LocalSource> = new Set<LocalSource>([
  'bundled',
  'bundled-settings',
  'dynamic',
  'vault',
]);

export function normalizeIdentifier(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/^@/, '');
}

export function matchesIdentifier(user: any, keys: string[]): boolean {
  if (!user) return false;
  const email = normalizeIdentifier(user.email);
  const username = normalizeIdentifier(user.username);
  return keys.some(
    key => (email !== '' && email === key) || (username !== '' && username === key),
  );
}

export function addUserCandidate(
  candidates: LocalCandidate[],
  source: LocalSource,
  user: any,
  keys: string[],
): void {
  if (matchesIdentifier(user, keys)) {
    candidates.push({ user, source });
  }
}

export function addUserCandidates(
  candidates: LocalCandidate[],
  source: LocalSource,
  users: unknown,
  keys: string[],
): void {
  if (!Array.isArray(users)) return;
  for (const user of users) {
    addUserCandidate(candidates, source, user, keys);
  }
}

/**
 * Verify the submitted password against every distinct hash we know about.
 * Trying all sources (rather than only the first record found) keeps accounts
 * working when MongoDB holds a stale hash while the bundled store is current.
 * Authoritative sources are checked first so a current password always wins.
 */
export function findVerifiedCandidate(
  candidates: LocalCandidate[],
  candidatePasswords: string[],
  isAllowed?: (candidate: LocalCandidate) => boolean,
): VerifiedCandidate | null {
  const ordered = [
    ...candidates.filter(candidate => !SNAPSHOT_SOURCES.has(candidate.source)),
    ...candidates.filter(candidate => SNAPSHOT_SOURCES.has(candidate.source)),
  ];

  const checkedHashes = new Set<string>();
  for (const candidate of ordered) {
    if (isAllowed && !isAllowed(candidate)) continue;

    const storedHash =
      typeof candidate.user?.passwordHash === 'string' ? candidate.user.passwordHash : '';
    if (!storedHash || checkedHashes.has(storedHash)) continue;
    checkedHashes.add(storedHash);

    for (const password of candidatePasswords) {
      if (verifyPassword(password, storedHash)) {
        return { user: candidate.user, passwordHash: storedHash, source: candidate.source };
      }
    }
  }
  return null;
}

export function sameAccount(a: any, b: any): boolean {
  if (!a || !b) return false;
  if (a.id && b.id && String(a.id) === String(b.id)) return true;

  const aEmail = normalizeIdentifier(a.email);
  const bEmail = normalizeIdentifier(b.email);
  if (aEmail && bEmail && aEmail === bEmail) return true;

  const aUsername = normalizeIdentifier(a.username);
  const bUsername = normalizeIdentifier(b.username);
  return Boolean(aUsername && bUsername && aUsername === bUsername);
}

/**
 * A bundled or in-memory credential must not outlive a newer authoritative
 * record. If MongoDB/backend settings hold a different hash written after the
 * snapshot, the snapshot is stale and must not resurrect a superseded password.
 */
export function isSupersededSnapshot(
  match: Pick<LocalCandidate, 'user' | 'source'>,
  authoritativeUser: any,
): boolean {
  if (!SNAPSHOT_SOURCES.has(match.source) || !authoritativeUser) return false;

  const authoritativeHash =
    typeof authoritativeUser.passwordHash === 'string' ? authoritativeUser.passwordHash : '';
  const snapshotHash = typeof match.user?.passwordHash === 'string' ? match.user.passwordHash : '';
  if (!authoritativeHash || authoritativeHash === snapshotHash) return false;

  const authoritativeUpdated = Date.parse(String(authoritativeUser.updatedAt || ''));
  const snapshotUpdated = Date.parse(String(match.user?.updatedAt || ''));
  if (!Number.isFinite(authoritativeUpdated) || !Number.isFinite(snapshotUpdated)) return false;

  return authoritativeUpdated > snapshotUpdated;
}

/**
 * MongoDB is the authoritative profile, then backend settings. The verified
 * hash always comes from the matched record so a stale profile cannot overwrite
 * a working credential.
 */
export function resolveAuthoritativeCandidate(
  candidates: LocalCandidate[],
  matchedUser: any,
): LocalCandidate | null {
  for (const source of ['mongo', 'settings'] as const) {
    const match = candidates.find(
      candidate => candidate.source === source && sameAccount(candidate.user, matchedUser),
    );
    if (match) return match;
  }
  return null;
}

/** Verify while ignoring snapshots that a newer authoritative record superseded. */
export function findAcceptableCandidate(
  candidates: LocalCandidate[],
  candidatePasswords: string[],
): VerifiedCandidate | null {
  return findVerifiedCandidate(candidates, candidatePasswords, candidate => {
    const authoritative = resolveAuthoritativeCandidate(candidates, candidate.user);
    return !isSupersededSnapshot(candidate, authoritative?.user);
  });
}
