import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ITERATIONS = 120_000;
const KEY_LENGTH = 32;

/**
 * Validates PIN format: 4 to 12 digits
 */
export function isValidAdminPin(pin: string): boolean {
  return /^\d{4,12}$/.test(pin);
}

/**
 * Hashes an admin PIN using PBKDF2 with 120,000 iterations and salt
 */
export function hashAdminPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(pin, salt, ITERATIONS, KEY_LENGTH, 'sha256');
  return `pbkdf2$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

/**
 * Verifies a provided PIN against the stored hash in constant time
 */
export function verifyAdminPin(pin: string, storedHash: string): boolean {
  if (!pin || !storedHash) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;
  
  const [scheme, iterationText, saltText, hashText] = parts;
  const iterations = Number(iterationText);
  
  if (scheme !== 'pbkdf2' || !Number.isInteger(iterations) || iterations <= 0 || !saltText || !hashText) {
    return false;
  }
  
  try {
    const expected = Buffer.from(hashText, 'base64');
    const actual = pbkdf2Sync(pin, Buffer.from(saltText, 'base64'), iterations, expected.length, 'sha256');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

// System-wide fallback secondary PIN hash for admin/financial approvals (Configurable via ADMIN_SECURITY_PIN)
export const DEFAULT_SYSTEM_ADMIN_PIN_HASH = hashAdminPin(process.env.ADMIN_SECURITY_PIN || '888888');
